'use client';

import { useState } from 'react';

/* ── Inline types ── */

interface CitedExample { quote: string; criterionId: string; isStrength: boolean; context?: string; }
interface CriterionFeedback { criterionId: string; score: number; feedback: string; examples: CitedExample[]; }
interface FactualIssue { quote: string; issue: string; correction: string; }
interface StudentDebateFeedback {
  sessionId?: string; studentId?: string; analyzedAt: string; rubricVersion: string;
  overallScore: number; overallSummary: string; criteria: CriterionFeedback[];
  factualIssues?: FactualIssue[];
  strengths: string[]; areasForImprovement: string[]; suggestedNextSteps?: string[];
}

/* ── Labels ── */

const CRITERIA: Record<string, { label: string; icon: string }> = {
  chain_of_reasoning:      { label: 'Chain of reasoning',    icon: '🔗' },
  sound_evidence:          { label: 'Sound evidence',        icon: '📚' },
  clarity_of_response:     { label: 'Clarity of response',   icon: '💬' },
  logical_consistency:     { label: 'Logical consistency',   icon: '🧩' },
  engagement_and_civility: { label: 'Engagement & civility', icon: '🤝' },
  relevance_and_focus:     { label: 'Relevance & focus',     icon: '🎯' },
  critical_thinking:       { label: 'Critical thinking',     icon: '🧠' },
};

function scoreColor(score: number) {
  if (score >= 4) return { text: 'var(--success)', bg: 'var(--success-soft)' };
  if (score >= 3) return { text: 'var(--warning)', bg: 'var(--warning-soft)' };
  return { text: 'var(--danger)', bg: 'var(--danger-soft)' };
}

/* ── Sample transcript (plain text, like a real Zoom transcript) ── */

const SAMPLE_TRANSCRIPT_TEXT = `Alex: I think Socrates' point about questioning assumptions is relevant here. If we take the premise that justice is what benefits the stronger, we still have to ask who decides what counts as stronger.
Socrates (AI): An interesting starting point. Maya, do you agree that justice is defined by the stronger?
Maya: Not exactly. I think justice has to account for fairness across the board, not just whoever holds power. Thrasymachus' view collapses once you realize the strong can be wrong about their own interests.
Alex: That's a good point. And in history we've seen laws that were later recognized as unjust. So obedience alone can't define justice.
Socrates (AI): Good. So what criterion do you each use when you examine a law — how do you tell if it is just or not?
Maya: I'd say we need to look at whether a law respects basic human dignity and distributes burdens proportionally. Rawls' veil of ignorance is useful here — would you accept the law if you didn't know your position in society?
Alex: I guess we look at outcomes — whether it treats people fairly and doesn't cause unnecessary harm. But I'm not sure that's a complete definition.
Socrates (AI): Maya, Alex raises a concern about completeness. How would you address it?
Maya: No single criterion will be complete, but that's why we combine procedural fairness — how the law was made — with substantive fairness — what it does. A law passed democratically but targeting a minority would still fail on substance.
Alex: I agree with Maya on combining both. I think the procedural side is something I hadn't considered enough.`;

/* ── Sample feedback for preview (2 students) ── */

const SAMPLE_FEEDBACK_ALEX: StudentDebateFeedback = {
  sessionId: 'zoom-2026-02-14', studentId: 'Alex', analyzedAt: new Date().toISOString(), rubricVersion: '1.0', overallScore: 4,
  overallSummary: 'Alex showed strong engagement with the Socratic dialogue, building a clear chain of reasoning from obedience to laws toward examining them for justice. He used historical evidence effectively, though it remained at a general level. His willingness to acknowledge uncertainty and build on Maya\'s contributions demonstrates intellectual honesty and collaborative thinking. The main areas to develop are precision in defining key terms and willingness to engage with counterarguments proactively rather than waiting to be prompted.',
  criteria: [
    { criterionId: 'chain_of_reasoning', score: 4,
      feedback: 'Alex built a clear logical progression: starting from questioning who defines "stronger," moving to the need to examine laws rather than just obey them, and connecting this to historical evidence. The final acknowledgment that procedural fairness was something he hadn\'t considered shows his reasoning evolved during the discussion. However, the chain breaks slightly when he jumps from "outcomes" to fairness without defining what outcomes count.',
      examples: [
        { quote: "we've seen laws that were later recognized as unjust. So obedience alone can't define justice.", criterionId: 'chain_of_reasoning', isStrength: true, context: 'Building from premise to conclusion with evidence' },
        { quote: "I guess we look at outcomes — whether it treats people fairly and doesn't cause unnecessary harm", criterionId: 'chain_of_reasoning', isStrength: false, context: 'The jump from "outcomes" to "fairly" leaves a gap — what outcomes? Measured how?' },
      ] },
    { criterionId: 'sound_evidence', score: 3,
      feedback: 'Alex referenced historical examples of unjust laws, which is appropriate evidence for the claim. However, the reference remained vague — no specific law, era, or situation was named. This weakens the evidentiary force because the listener can\'t evaluate whether the examples actually support the argument. Compared to Maya\'s use of Rawls, Alex\'s evidence was less precise and less grounded in a specific framework.',
      examples: [
        { quote: "in history we've seen laws that were later recognized as unjust", criterionId: 'sound_evidence', isStrength: false, context: 'General reference without specifics — e.g. which laws? Which era?' },
        { quote: "If we take the premise that justice is what benefits the stronger, we still have to ask who decides what counts as stronger", criterionId: 'sound_evidence', isStrength: true, context: 'Engaged with Thrasymachus\'s position directly' },
      ] },
    { criterionId: 'clarity_of_response', score: 4,
      feedback: 'Responses were direct and conversational. Alex typically answered the question asked without meandering. His language was accessible and his points easy to follow.',
      examples: [
        { quote: "we look at outcomes — whether it treats people fairly and doesn't cause unnecessary harm", criterionId: 'clarity_of_response', isStrength: true, context: 'Clear, concise articulation of a position' },
        { quote: "I'm not sure that's a complete definition", criterionId: 'clarity_of_response', isStrength: true, context: 'Transparent about limitations rather than overcommitting' },
      ] },
    { criterionId: 'logical_consistency', score: 5,
      feedback: 'No contradictions throughout. Alex\'s position evolved (from questioning the premise, to examining laws, to acknowledging procedural fairness) but each evolution was additive rather than contradictory. He never walked back a previous claim.',
      examples: [
        { quote: "I agree with Maya on combining both. I think the procedural side is something I hadn't considered enough.", criterionId: 'logical_consistency', isStrength: true, context: 'Updated his view without contradicting earlier points' },
      ] },
    { criterionId: 'engagement_and_civility', score: 5,
      feedback: 'Alex actively engaged with both the AI interlocutor and Maya. He affirmed Maya\'s point before building on it, demonstrating constructive dialogue. His tone was consistently respectful and collaborative.',
      examples: [
        { quote: "That's a good point", criterionId: 'engagement_and_civility', isStrength: true, context: 'Acknowledged Maya\'s argument before extending it' },
        { quote: "I agree with Maya on combining both", criterionId: 'engagement_and_civility', isStrength: true, context: 'Built on a peer\'s framework rather than competing' },
      ] },
    { criterionId: 'relevance_and_focus', score: 5,
      feedback: 'Every response directly addressed the question posed. No tangents or off-topic remarks.',
      examples: [] },
    { criterionId: 'critical_thinking', score: 3,
      feedback: 'Alex acknowledged uncertainty twice, which shows intellectual honesty. However, he did not surface his own assumptions, question Maya\'s framework, or anticipate objections. The critical thinking was reactive (responding when prompted) rather than proactive.',
      examples: [
        { quote: "I'm not sure that's a complete definition", criterionId: 'critical_thinking', isStrength: false, context: 'Identified a weakness but stopped there instead of trying to resolve it' },
        { quote: "the procedural side is something I hadn't considered enough", criterionId: 'critical_thinking', isStrength: true, context: 'Showed willingness to update thinking based on new input' },
      ] },
  ],
  factualIssues: [
    { quote: "in history we've seen laws that were later recognized as unjust", issue: 'This is accurate as a general statement but too vague to verify or evaluate. No specific law, jurisdiction, or era is mentioned.', correction: 'Strengthen by citing specific examples: e.g. the Fugitive Slave Act of 1850, Jim Crow laws (1877–1964), or South Africa\'s apartheid-era Group Areas Act (1950).' },
  ],
  strengths: [
    'Built a clear reasoning chain from questioning premises to examining laws, supported by historical evidence: "we\'ve seen laws that were later recognized as unjust. So obedience alone can\'t define justice."',
    'Engaged constructively with Maya — affirmed her points before extending them: "That\'s a good point. And in history..."',
    'Demonstrated intellectual honesty by acknowledging gaps in his own position rather than overcommitting: "I\'m not sure that\'s a complete definition."',
    'Showed genuine willingness to update his view based on peer input: "I think the procedural side is something I hadn\'t considered enough."',
  ],
  areasForImprovement: [
    'Replace general historical references with specific examples — e.g. name a particular unjust law (Jim Crow, apartheid-era legislation) to make the argument more concrete and harder to dismiss.',
    'When proposing a criterion like "fairness" and "unnecessary harm," define those terms. What counts as fair? Who decides what harm is unnecessary? Without definitions, the criterion is too vague to evaluate.',
    'Try generating a counterargument to your own position before the interlocutor asks. For example, after proposing outcomes-based justice, ask yourself: "What if good outcomes were achieved through unjust means?"',
    'Push beyond agreeing with peers — when you say "I agree with Maya on combining both," try articulating what specifically you would add or modify in her framework.',
  ],
  suggestedNextSteps: [
    'Before the next session, write down 3 specific historical examples of unjust laws and prepare a one-sentence explanation of what made each unjust.',
    'Practice the "steelman" exercise: pick your strongest claim from this session and write the best possible objection to it, then respond to that objection.',
    'Read the first two pages of Rawls\' "A Theory of Justice" (section on the original position) to build on Maya\'s point about the veil of ignorance.',
    'Write a one-paragraph definition of "fairness" as you would use it in an argument, then test it against two real-world cases.',
    'In the next session, try disagreeing constructively with at least one point rather than only building agreement.',
  ],
};

const SAMPLE_FEEDBACK_MAYA: StudentDebateFeedback = {
  sessionId: 'zoom-2026-02-14', studentId: 'Maya', analyzedAt: new Date().toISOString(), rubricVersion: '1.0', overallScore: 5,
  overallSummary: 'Maya demonstrated sophisticated philosophical reasoning throughout the dialogue. She drew on Rawls\' veil of ignorance to ground her argument, distinguished between procedural and substantive fairness, and proactively addressed the "completeness" objection before it could undermine her position. Her contributions were the most analytically precise in the session. The primary area for growth is deepening engagement with peers — while she engaged with the AI\'s questions effectively, she could do more to build on or challenge Alex\'s specific claims.',
  criteria: [
    { criterionId: 'chain_of_reasoning', score: 5,
      feedback: 'Maya built a multi-layered argument with clear logical structure: (1) justice is not defined by the stronger, (2) because the strong can be wrong about their interests, (3) justice requires respecting dignity and proportionality, (4) operationalized via the veil of ignorance, (5) combining procedural and substantive criteria handles the completeness problem. Each step followed naturally from the last.',
      examples: [
        { quote: "Thrasymachus' view collapses once you realize the strong can be wrong about their own interests", criterionId: 'chain_of_reasoning', isStrength: true, context: 'Identified a specific logical weakness in the opposing view' },
        { quote: "that's why we combine procedural fairness — how the law was made — with substantive fairness — what it does", criterionId: 'chain_of_reasoning', isStrength: true, context: 'Synthesized two frameworks into a cohesive criterion' },
      ] },
    { criterionId: 'sound_evidence', score: 5,
      feedback: 'Maya referenced Rawls\' veil of ignorance as a concrete philosophical tool — not just name-dropping, but actually explaining how it works and why it\'s relevant. She also used a concrete illustrative example (a law targeting a minority) to demonstrate her point about substantive fairness.',
      examples: [
        { quote: "Rawls' veil of ignorance is useful here — would you accept the law if you didn't know your position in society?", criterionId: 'sound_evidence', isStrength: true, context: 'Applied a philosophical framework directly to the question' },
        { quote: "A law passed democratically but targeting a minority would still fail on substance", criterionId: 'sound_evidence', isStrength: true, context: 'Illustrative example that concretizes an abstract principle' },
      ] },
    { criterionId: 'clarity_of_response', score: 5,
      feedback: 'Every response was precisely worded and directly addressed the question. Maya used clear structural markers ("not just X, but Y"; "that\'s why we combine X with Y") that made her reasoning easy to follow.',
      examples: [
        { quote: "justice has to account for fairness across the board, not just whoever holds power", criterionId: 'clarity_of_response', isStrength: true, context: 'Clear framing that directly addresses the question' },
      ] },
    { criterionId: 'logical_consistency', score: 5,
      feedback: 'No contradictions. Each contribution built on the previous ones. The move from "dignity + proportionality" to "procedural + substantive" is an enrichment, not a shift.',
      examples: [] },
    { criterionId: 'engagement_and_civility', score: 4,
      feedback: 'Maya engaged thoroughly with the AI\'s questions and addressed the completeness concern Alex raised. However, she could have engaged more directly with Alex himself — asking him to elaborate on his "outcomes" framework or building a bridge between their positions.',
      examples: [
        { quote: "No single criterion will be complete, but that's why we combine procedural fairness…", criterionId: 'engagement_and_civility', isStrength: true, context: 'Addressed Alex\'s concern directly' },
      ] },
    { criterionId: 'relevance_and_focus', score: 5,
      feedback: 'Every response directly addressed the question asked. No tangents.',
      examples: [] },
    { criterionId: 'critical_thinking', score: 4,
      feedback: 'Maya proactively addressed a major objection (completeness) and showed awareness that no single criterion is sufficient. To reach a 5, she could have questioned the limitations of her own framework — e.g. what happens when procedural and substantive fairness conflict?',
      examples: [
        { quote: "No single criterion will be complete", criterionId: 'critical_thinking', isStrength: true, context: 'Self-aware about the limits of her own framework' },
        { quote: "A law passed democratically but targeting a minority would still fail on substance", criterionId: 'critical_thinking', isStrength: true, context: 'Used a counterexample to test and refine her own position' },
      ] },
  ],
  factualIssues: [],
  strengths: [
    'Sophisticated use of Rawls\' veil of ignorance — not just cited but explained and applied: "would you accept the law if you didn\'t know your position in society?"',
    'Pre-emptively addressed the completeness objection with the procedural/substantive distinction: "that\'s why we combine procedural fairness — how the law was made — with substantive fairness."',
    'Used a concrete counterexample to test her own framework: "A law passed democratically but targeting a minority would still fail on substance."',
    'Clear, precise language throughout — every response was easy to follow and directly addressed the question.',
    'Accurately identified the flaw in Thrasymachus\' argument: "the strong can be wrong about their own interests" — a key insight from Republic Book I.',
  ],
  areasForImprovement: [
    'Engage more directly with Alex\'s specific claims. When he proposed "outcomes," you could have asked: "What outcomes specifically? How do you measure fairness of outcomes vs. fairness of process?"',
    'Explore the tension in your own framework: what happens when a law is procedurally fair (democratically passed, due process followed) but produces bad substantive outcomes? Which takes priority?',
    'Consider what a critic of Rawls would say — e.g. libertarian objections about individual rights vs. distributive fairness — to strengthen your argument by showing you\'ve considered alternatives.',
    'Acknowledge limitations of the veil of ignorance — critics point out it may not capture the moral significance of particular relationships, cultures, or histories.',
  ],
  suggestedNextSteps: [
    'In the next session, ask at least one probing follow-up question of a peer, building directly on something specific they said.',
    'Write a one-paragraph response to a libertarian critique of Rawls (e.g. Nozick\'s "Anarchy, State, and Utopia") to prepare for potential objections.',
    'Explore the procedural-vs-substantive tension: find or construct a real-world example where they conflict, and write down which you\'d prioritize and why.',
    'Read about communitarian critiques of Rawls (e.g. Michael Sandel) to anticipate a different angle of objection.',
  ],
};

const SAMPLE_RESULTS = [SAMPLE_FEEDBACK_ALEX, SAMPLE_FEEDBACK_MAYA];

/* ── UI Components ── */

function ScoreBadge({ score }: { score: number }) {
  const c = scoreColor(score);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.2rem 0.6rem', borderRadius: 999, background: c.bg, color: c.text, fontWeight: 700, fontSize: '0.85rem' }}>
      {score}/5
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  const c = scoreColor(score);
  return (
    <div style={{ flex: 1, height: 6, background: 'var(--surface-2)', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ width: `${(score / 5) * 100}%`, height: '100%', background: c.text, borderRadius: 3, transition: 'width 0.4s ease' }} />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '2rem' }}>
      <h3 style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: '0.75rem' }}>{title}</h3>
      {children}
    </div>
  );
}

/* ── Single student feedback view ── */

function FeedbackView({ feedback }: { feedback: StudentDebateFeedback }) {
  const avgScore = (feedback.criteria.reduce((a, c) => a + c.score, 0) / feedback.criteria.length).toFixed(1);
  return (
    <>
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          {feedback.studentId && <><strong>{feedback.studentId}</strong> · </>}
          {feedback.sessionId} · {new Date(feedback.analyzedAt).toLocaleDateString()}
        </p>
      </div>

      {/* Overall score */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.25rem 1.5rem', marginBottom: '2rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: scoreColor(feedback.overallScore).text, lineHeight: 1 }}>{feedback.overallScore}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 2 }}>out of 5</div>
        </div>
        <p style={{ flex: 1, fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>{feedback.overallSummary}</p>
      </div>

      {/* Factual issues */}
      {feedback.factualIssues && feedback.factualIssues.length > 0 && (
        <Section title="Factual & historical accuracy">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {feedback.factualIssues.map((fi, i) => (
              <div key={i} style={{ padding: '0.85rem 1rem', background: 'var(--danger-soft)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 'var(--radius)' }}>
                <p style={{ fontSize: '0.84rem', color: 'var(--muted)', fontStyle: 'italic', margin: '0 0 0.4rem 0' }}>
                  &ldquo;{fi.quote}&rdquo;
                </p>
                <p style={{ fontSize: '0.86rem', color: '#fca5a5', margin: '0 0 0.3rem 0', fontWeight: 500 }}>
                  Issue: {fi.issue}
                </p>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Correction: {fi.correction}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Criteria */}
      <Section title="Rubric scores">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {feedback.criteria.map((c) => {
            const meta = CRITERIA[c.criterionId];
            return (
              <details key={c.criterionId} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                <summary style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem', cursor: 'pointer', listStyle: 'none', WebkitAppearance: 'none' }}>
                  <span className="chevron" style={{ fontSize: '0.7rem', width: 16, textAlign: 'center', color: 'var(--muted)', transition: 'transform 0.2s ease' }}>&#9654;</span>
                  <span style={{ fontSize: '1.1rem', width: 24, textAlign: 'center' }}>{meta?.icon ?? '•'}</span>
                  <span style={{ flex: 'none', fontWeight: 500, fontSize: '0.9rem', width: 180 }}>{meta?.label ?? c.criterionId}</span>
                  <ScoreBar score={c.score} />
                  <ScoreBadge score={c.score} />
                </summary>
                <div style={{ padding: '0 1rem 1rem 3.25rem' }}>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '0.5rem' }}>{c.feedback}</p>
                  {c.examples.filter((e) => e.quote).map((e, i) => (
                    <div key={i} style={{ marginTop: '0.5rem', padding: '0.6rem 0.75rem', background: 'var(--surface-2)', borderRadius: 6, borderLeft: `3px solid ${e.isStrength ? 'var(--success)' : 'var(--warning)'}` }}>
                      <p style={{ fontSize: '0.84rem', color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>
                        &ldquo;{e.quote}&rdquo;
                      </p>
                      {e.context && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--muted)', margin: '0.25rem 0 0 0', opacity: 0.8 }}>
                          {e.isStrength ? '✓' : '△'} {e.context}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </details>
            );
          })}
        </div>
        <p style={{ textAlign: 'right', color: 'var(--muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>Average: {avgScore}/5</p>
      </Section>

      {/* Strengths & Improvements */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ padding: '1rem 1.25rem', background: 'var(--success-soft)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 'var(--radius)' }}>
          <h3 style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--success)', marginBottom: '0.6rem' }}>Strengths</h3>
          <ul style={{ paddingLeft: '1.1rem', margin: 0 }}>
            {feedback.strengths.map((s, i) => <li key={i} style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '0.55rem', lineHeight: 1.5 }}>{s}</li>)}
          </ul>
        </div>
        <div style={{ padding: '1rem 1.25rem', background: 'var(--warning-soft)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 'var(--radius)' }}>
          <h3 style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--warning)', marginBottom: '0.6rem' }}>Areas for improvement</h3>
          <ul style={{ paddingLeft: '1.1rem', margin: 0 }}>
            {feedback.areasForImprovement.map((s, i) => <li key={i} style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '0.55rem', lineHeight: 1.5 }}>{s}</li>)}
          </ul>
        </div>
      </div>

      {/* Next steps */}
      {feedback.suggestedNextSteps && feedback.suggestedNextSteps.length > 0 && (
        <Section title="Suggested next steps">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {feedback.suggestedNextSteps.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem 1rem', background: 'var(--accent-soft)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 'var(--radius)' }}>
                <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.85rem', minWidth: 20 }}>{i + 1}.</span>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s}</span>
              </div>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}

/* ── Student tabs (only shown when >1 student) ── */

function StudentTabs({ results, activeIdx, onSelect }: { results: StudentDebateFeedback[]; activeIdx: number; onSelect: (i: number) => void }) {
  return (
    <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
      {results.map((r, i) => {
        const active = i === activeIdx;
        return (
          <button
            key={r.studentId ?? i}
            type="button"
            onClick={() => onSelect(i)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.55rem 1.1rem',
              background: active ? 'var(--surface)' : 'transparent',
              border: active ? '1px solid var(--border)' : '1px solid transparent',
              borderBottom: active ? '1px solid var(--bg)' : '1px solid transparent',
              borderRadius: '8px 8px 0 0',
              marginBottom: -1,
              color: active ? 'var(--text)' : 'var(--muted)',
              fontWeight: active ? 600 : 400,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {r.studentId ?? `Student ${i + 1}`}
            <ScoreBadge score={r.overallScore} />
          </button>
        );
      })}
    </div>
  );
}

/* ── Dashboard ── */

export default function DashboardPage() {
  const [transcriptText, setTranscriptText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<StudentDebateFeedback[] | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  const loadSample = () => { setTranscriptText(SAMPLE_TRANSCRIPT_TEXT); setError(null); };
  const viewSample = () => { setResults(SAMPLE_RESULTS); setActiveTab(0); setError(null); };
  const reset = () => { setResults(null); setActiveTab(0); setError(null); };

  const runAnalysis = async () => {
    setError(null);
    setResults(null);
    const text = transcriptText.trim();
    if (!text) { setError('Paste a transcript first.'); return; }

    // Detect if user pasted JSON (structured) or plain text
    let bodyPayload: Record<string, unknown>;
    if (text.startsWith('{')) {
      try {
        const parsed = JSON.parse(text);
        bodyPayload = { transcript: parsed };
      } catch {
        // Not valid JSON — treat as plain text
        bodyPayload = { rawText: text };
      }
    } else {
      bodyPayload = { rawText: text };
    }

    setLoading(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? `Error ${res.status}`); return; }
      const feedbackList = (data.results ?? [data]) as StudentDebateFeedback[];
      setResults(feedbackList);
      setActiveTab(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: '52rem', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Post-meeting feedback</p>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700 }}>Debate Analysis</h1>
      </div>

      {/* ── Results view ── */}
      {results && results.length > 0 ? (
        <>
          <button type="button" onClick={reset} style={{ marginBottom: '1.5rem', padding: '0.4rem 0.9rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem' }}>
            ← Analyze another transcript
          </button>

          {results.length > 1 && (
            <StudentTabs results={results} activeIdx={activeTab} onSelect={setActiveTab} />
          )}

          <FeedbackView feedback={results[activeTab]} />
        </>
      ) : (
        /* ── Input view ── */
        <>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            Paste your meeting transcript below. Plain text works — just use the format <code style={{ background: 'var(--surface)', padding: '0.15rem 0.35rem', borderRadius: 4, fontSize: '0.82rem' }}>Name: what they said</code> per line. Speakers with &quot;(AI)&quot; in their name are auto-detected as agents.
          </p>

          <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button type="button" onClick={loadSample} style={{ padding: '0.45rem 0.9rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', cursor: 'pointer', fontSize: '0.85rem' }}>
              Load sample transcript
            </button>
            <button type="button" onClick={viewSample} style={{ padding: '0.45rem 0.9rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', cursor: 'pointer', fontSize: '0.85rem' }}>
              Preview sample results
            </button>
            <button
              type="button" onClick={runAnalysis}
              disabled={loading || !transcriptText.trim()}
              style={{ padding: '0.45rem 0.9rem', background: loading ? 'var(--muted)' : 'var(--accent)', border: 'none', borderRadius: 8, color: loading ? 'var(--border)' : 'var(--bg)', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
            >
              {loading ? 'Analyzing…' : 'Run analysis'}
            </button>
          </div>

          <textarea
            value={transcriptText}
            onChange={(e) => setTranscriptText(e.target.value)}
            placeholder={`Alex: I think Socrates' point about questioning assumptions is relevant here...\nSocrates (AI): An interesting starting point. Do you agree?\nMaya: Not exactly. I think justice has to account for fairness...`}
            style={{ width: '100%', minHeight: 240, padding: '0.75rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)', fontFamily: 'inherit', fontSize: '0.88rem', resize: 'vertical', lineHeight: 1.6 }}
          />

          {error && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--danger-soft)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, color: '#fca5a5', fontSize: '0.88rem' }}>
              {error}
            </div>
          )}
        </>
      )}
    </main>
  );
}
