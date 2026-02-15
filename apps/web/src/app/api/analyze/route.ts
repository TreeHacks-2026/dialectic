import { NextResponse } from 'next/server';

export const maxDuration = 120;

/* ── Inline types ── */

interface TranscriptSegment {
  id: string;
  speakerId: string;
  speakerRole: 'student' | 'agent' | 'unknown';
  text: string;
  startTimeSeconds?: number;
  endTimeSeconds?: number;
}

interface MeetingTranscript {
  sessionId?: string;
  segments: TranscriptSegment[];
}

/* ── Plain-text transcript parser ──
 *
 * Accepts formats like:
 *   Alex: I think justice is...
 *   Socrates (AI): What do you mean by that?
 *   Maya: I agree, because...
 *
 * Also handles timestamps:
 *   [0:42] Alex: I think...
 *   00:01:23 Alex: I think...
 *
 * Agent detection: speakers whose name contains "(AI)", "(Bot)", "(Agent)",
 * or matches common patterns like "Socrates", "Assistant" are tagged as agents.
 * Everything else defaults to "student".
 */

const AGENT_PATTERNS = /\(ai\)|\(bot\)|\(agent\)|^assistant$|^ai$/i;

function parseTimestamp(raw: string): number | undefined {
  // "0:42" or "1:02:30" or "00:01:23"
  const parts = raw.split(':').map(Number);
  if (parts.some(isNaN)) return undefined;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return undefined;
}

function parsePlainText(text: string, agentNames?: string[]): MeetingTranscript {
  const agentSet = new Set((agentNames ?? []).map((n) => n.toLowerCase().trim()));
  const segments: TranscriptSegment[] = [];
  const lines = text.split('\n');
  // Match: optional timestamp, then "Speaker Name: text"
  const lineRe = /^(?:\[?(\d{1,2}(?::\d{2}){1,2})\]?\s+)?([^:]+?):\s+(.+)$/;

  let id = 1;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const m = trimmed.match(lineRe);
    if (!m) {
      // Continuation line — append to previous segment
      if (segments.length > 0) {
        segments[segments.length - 1].text += ' ' + trimmed;
      }
      continue;
    }
    const [, timeStr, rawName, text] = m;
    const speakerId = rawName.trim();
    const isAgent =
      AGENT_PATTERNS.test(speakerId) || agentSet.has(speakerId.toLowerCase());
    segments.push({
      id: String(id++),
      speakerId,
      speakerRole: isAgent ? 'agent' : 'student',
      text: text.trim(),
      ...(timeStr ? { startTimeSeconds: parseTimestamp(timeStr) } : {}),
    });
  }
  return { segments };
}

/* ── Rubric ── */

const RUBRIC_CRITERIA = [
  { id: 'chain_of_reasoning', name: 'Chain of reasoning', description: 'Whether the student builds a clear step-by-step argument rather than jumping to conclusions.', excellent: 'Moves logically from premise to conclusion; explicitly connects ideas; acknowledges assumptions.', needsWork: 'Conclusions stated without clear steps; logical leaps; missing links between claims.' },
  { id: 'sound_evidence', name: 'Sound evidence', description: 'Use of relevant, accurate, and well-sourced evidence to support claims.', excellent: 'Cites specific facts, examples, or sources; evidence directly supports claims; distinguishes fact from interpretation.', needsWork: 'Vague or unsupported claims; evidence irrelevant or misused; no distinction between fact and opinion.' },
  { id: 'clarity_of_response', name: 'Clarity of response', description: 'How clearly and coherently the student expresses their position and responds to others.', excellent: 'Precise language; direct answers to questions; structure where helpful.', needsWork: "Vague or rambling; doesn't directly address the question; hard to follow." },
  { id: 'logical_consistency', name: 'Logical consistency', description: 'Absence of contradictions and internal coherence of the argument.', excellent: 'Positions and claims are consistent throughout; acknowledges and resolves apparent tensions.', needsWork: 'Contradicts earlier claims; inconsistent premises; unacknowledged tensions.' },
  { id: 'engagement_and_civility', name: 'Engagement and civility', description: "How well the student engages with others' ideas and maintains respectful, constructive dialogue.", excellent: "Directly engages others' points; asks clarifying questions; respectful even when disagreeing.", needsWork: "Talks past others; dismissive or uncivil; doesn't build on or challenge ideas constructively." },
  { id: 'relevance_and_focus', name: 'Relevance and focus', description: 'Staying on topic and addressing the question or prompt at hand.', excellent: 'Responses directly address the question; tangents are brief and purposeful.', needsWork: "Frequently off-topic; doesn't answer what was asked; tangents dominate." },
  { id: 'critical_thinking', name: 'Critical thinking', description: 'Willingness to question assumptions, consider counterarguments, and revise in light of new information.', excellent: 'Surfaces assumptions; considers objections; updates views when evidence warrants.', needsWork: "Defensive; ignores counterarguments; doesn't question own or others' assumptions." },
];

/* ── Prompt building ── */

function formatTranscript(transcript: MeetingTranscript): string {
  return transcript.segments
    .map((s, i) => {
      const role = s.speakerRole === 'student' ? 'Student' : s.speakerRole === 'agent' ? 'Agent' : 'Other';
      const time = s.startTimeSeconds != null
        ? ` [${Math.floor(s.startTimeSeconds / 60)}:${String(Math.floor(s.startTimeSeconds % 60)).padStart(2, '0')}]`
        : '';
      return `[${i + 1}] ${role} (${s.speakerId})${time}: ${s.text}`;
    })
    .join('\n');
}

function buildSystemPrompt(): string {
  const criteriaText = RUBRIC_CRITERIA.map(
    (c) => `- **${c.name}** (id: ${c.id}): ${c.description}\n  Excellent (5): ${c.excellent}\n  Needs improvement (1–2): ${c.needsWork}`
  ).join('\n\n');

  return `You are an expert educator providing thorough, detailed feedback on a student's performance in a Socratic seminar or debate. You will receive a full meeting transcript and must produce a comprehensive analysis.

## Rubric criteria (score each 1–5: 1 = needs significant improvement, 5 = excellent)

${criteriaText}

## Your task — be THOROUGH

You will be told which student to evaluate (by speakerId). Evaluate ONLY that student's contributions, but consider the full context of the conversation.

### Rubric evaluation
For each of the 7 rubric criteria:
1. Assign a score 1–5.
2. Write **3–5 sentences** of detailed feedback explaining WHY you gave that score. Reference what the student actually said.
3. Provide **at least 2 cited examples** from the transcript — direct quotes that illustrate the student's performance on that criterion. For each, explain whether it is a strength or area for growth, and give brief context (what prompted the quote, what it demonstrates).

### Factual & historical accuracy check
Carefully review every factual, historical, scientific, or philosophical claim the student made. For each claim that is inaccurate, misleading, incomplete, or misattributed, create a "factualIssue" entry with:
- The exact quote
- What is wrong or misleading about it
- A brief correction with accurate information
If all claims are accurate, return an empty array.

### Synthesis
Then provide:
4. An **overall summary** (a full paragraph, 4–6 sentences) that synthesizes the student's performance across all criteria, identifies patterns, and gives a balanced assessment of where they are.
5. An **overall score** 1–5.
6. **Key strengths** — as many as warranted. Each should be a full sentence with a specific citation from the transcript. Do not cap or limit these.
7. **Areas for improvement** — as many as warranted. Each should be specific, actionable, and reference what the student actually said or failed to do. Avoid generic advice. Do not cap or limit these.
8. **Suggested next steps** — as many as warranted. Concrete, practical actions the student can take before the next session. Be specific (e.g. "Before the next session, write a one-paragraph argument for the opposing view on [specific topic discussed]" rather than "practice counterarguments"). Do not cap or limit these.

Respond with valid JSON only (no markdown fences, no extra text):

{
  "overallScore": 1-5,
  "overallSummary": "string (4-6 sentences)",
  "criteria": [
    {
      "criterionId": "string (must be one of the 7 criterion IDs)",
      "score": 1-5,
      "feedback": "string (3-5 detailed sentences)",
      "examples": [
        { "quote": "exact words from transcript", "criterionId": "string", "isStrength": boolean, "context": "what prompted this and what it shows" }
      ]
    }
  ],
  "factualIssues": [
    { "quote": "the student's exact words", "issue": "what is wrong or misleading", "correction": "accurate information" }
  ],
  "strengths": ["string (full sentence with citation)"],
  "areasForImprovement": ["string (specific and actionable)"],
  "suggestedNextSteps": ["string (concrete action item)"]
}`;
}

function buildUserPrompt(transcript: MeetingTranscript, studentSpeakerId: string): string {
  const body = formatTranscript(transcript);
  return `Provide a thorough, detailed analysis of this student's debate performance using the rubric.

**Evaluate ONLY the student whose speakerId is: "${studentSpeakerId}".** Score and cite only this student's contributions, but consider the full dialogue context.

Be thorough — this feedback will be the primary way the student understands their performance. Generic or vague feedback is not helpful.

## Transcript

${body}`;
}

/* ── LLM call for a single student ── */

async function analyzeOneStudent(
  transcript: MeetingTranscript,
  studentId: string,
  apiKey: string,
  baseURL: string,
  model: string,
): Promise<Record<string, unknown>> {
  const res = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: buildUserPrompt(transcript, studentId) },
      ],
      max_tokens: 8192,
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('LLM returned empty response');

  const trimmed = content.trim().replace(/^```json\s*/i, '').replace(/\s*```\s*$/i, '');
  const feedback = JSON.parse(trimmed);

  return {
    ...feedback,
    sessionId: transcript.sessionId ?? 'session',
    studentId,
    analyzedAt: new Date().toISOString(),
    rubricVersion: '1.0',
  };
}

/* ── POST handler ── */

export async function POST(request: Request) {
  try {
    const body = await request.json();

    let transcript: MeetingTranscript;

    if (body.transcript?.segments?.length) {
      // Structured JSON input
      transcript = body.transcript as MeetingTranscript;
    } else if (typeof body.rawText === 'string' && body.rawText.trim()) {
      // Plain-text input: parse "Speaker: text" lines
      const agentNames = Array.isArray(body.agentNames) ? body.agentNames as string[] : undefined;
      transcript = parsePlainText(body.rawText, agentNames);
      if (body.sessionId) transcript.sessionId = body.sessionId;
      if (!transcript.segments.length) {
        return NextResponse.json(
          { error: 'Could not parse any speaker lines. Expected format: "Name: text" per line.' },
          { status: 400 },
        );
      }
    } else {
      return NextResponse.json({ error: 'Provide either a transcript object or rawText string.' }, { status: 400 });
    }

    const apiKey = process.env.PERPLEXITY_API_KEY ?? process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'No API key configured. Set PERPLEXITY_API_KEY or OPENAI_API_KEY in .env.local' },
        { status: 500 },
      );
    }

    const baseURL = (process.env.LLM_BASE_URL ?? 'https://api.openai.com/v1').replace(/\/$/, '');
    const model = process.env.LLM_MODEL ?? 'gpt-4o';

    // Detect all unique student speaker IDs
    const studentIds = [
      ...new Set(
        transcript.segments
          .filter((s) => s.speakerRole === 'student')
          .map((s) => s.speakerId),
      ),
    ];

    if (studentIds.length === 0) {
      return NextResponse.json({ error: 'No student speakers found in transcript.' }, { status: 400 });
    }

    // Analyze each student sequentially
    const results: Record<string, unknown>[] = [];
    for (const id of studentIds) {
      const feedback = await analyzeOneStudent(transcript, id, apiKey, baseURL, model);
      results.push(feedback);
    }

    return NextResponse.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
