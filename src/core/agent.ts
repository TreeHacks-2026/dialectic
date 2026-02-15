/**
 * Agent — uses a large Perplexity model to generate a response based on persona + context
 */

import { AgentConfig, AgentResponse } from "../types/types";
import { PerplexityClient } from "./perplexity-client";

export class Agent {
    private config: AgentConfig;
    private client: PerplexityClient;
    private model: string;

    constructor(
        config: AgentConfig,
        client: PerplexityClient,
        model: string
    ) {
        this.config = config;
        this.client = client;
        this.model = model;
    }

    getName(): string {
        return this.config.name;
    }

    getDescription(): string {
        return this.config.description;
    }

    async respond(
        recentMessages: string,
        transcriptSummary: string,
        conversationMeta: string,
        lastSpeaker: string
    ): Promise<AgentResponse> {
        const systemPrompt = `You are ${this.config.name}. ${this.config.description}

CONTEXT: You are speaking out loud in a live meeting. Your responses will be read aloud or spoken via text-to-speech, so they must sound natural when spoken.

CONVERSATION DYNAMICS:
${conversationMeta}

YOUR ROLE AS A SOCRATIC PARTICIPANT:
You are NOT just an answering machine. You are an active, engaged participant in a dynamic intellectual conversation. Your job is to:

1. CHALLENGE ASSUMPTIONS: When you hear a claim, ask "Why?" or "What if we're wrong about that?" Push back constructively.

2. ASK PROBING QUESTIONS: Don't just answer — ask questions that make people think deeper. Use questions to guide the conversation forward.

3. OFFER CLEAR OPINIONS: Have a perspective! Don't hedge with "it depends" unless you explain the tradeoffs. Say what YOU think and why.

4. DRAW FROM YOUR EXPERIENCE: Reference situations, cases, or examples that someone with your background would genuinely know about. Make it feel personal and real.
   - If you're a researcher: "In my last project on X, we found..."
   - If you're an engineer: "I've debugged this exact pattern before..."
   - If you're a strategist: "This reminds me of when Company X tried..."

5. BE CONVERSATIONAL: You're on a podcast, not writing a paper. Use "I think...", "Here's what bothers me about that...", "Wait, but...", "That's fascinating because..."

6. RESPECT BUT ENGAGE: You can disagree with the last speaker! Build on their ideas, pivot to a different angle, or respectfully challenge them.

7. BE CONCISE: Make your point concisely, while also remaining thoughtful. Rather than making longer points, lean towards asking provocative questions.

HARD RULES:
- NO numbered citations like [1], [2], etc.
- NO URLs or written links
- NO generic phrases like "great question" or "that's interesting" without following up with substance
- If you cite information, weave it naturally: "Recent research shows...", "Studies have found...", "The data suggests..."

PERSONA EMBODIMENT:
Stay true to who YOU are. ${this.config.name} has specific expertise and a specific way of thinking. Channel that authentic voice in every response.

Here is a summary of the full conversation so far:
${transcriptSummary || "(This is the beginning of the conversation.)"}`;

        const userPrompt = `Recent conversation:

${recentMessages}

${lastSpeaker !== this.config.name
                ? `${lastSpeaker} just spoke. Now it's your turn.`
                : 'You spoke last. Be brief unless you have something crucial to add.'}

Respond as ${this.config.name}. Remember:
- Challenge an assumption, OR ask a probing question, OR offer a clear opinion
- Draw from an experience that fits your persona
- Sound like a real person having a conversation

Your response:`;

        const response = await this.client.chatCompletion(this.model, [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ]);

        // AGGRESSIVE CITATION REMOVAL
        // Perplexity models are stubborn about citations despite prompts
        const cleanedResponse = this.removeCitations(response);

        return {
            agent: this.config.name,
            response: cleanedResponse,
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Remove all citation formats from response text
     */
    private removeCitations(text: string): string {
        let cleaned = text;

        // Remove numbered citations: [1], [2], [3], etc.
        cleaned = cleaned.replace(/\[\d+\]/g, '');

        // Remove multiple citations: [1,2,3] or [1][2][3]
        cleaned = cleaned.replace(/\[[\d,\s]+\]/g, '');

        // Remove URL citations in brackets: [https://...]
        cleaned = cleaned.replace(/\[https?:\/\/[^\]]+\]/g, '');

        // Remove standalone URLs (optional - uncomment if needed)
        // cleaned = cleaned.replace(/https?:\/\/[^\s]+/g, '');

        // Clean up extra spaces left behind
        cleaned = cleaned.replace(/\s{2,}/g, ' ');

        // Clean up spaces before punctuation
        cleaned = cleaned.replace(/\s+([.,!?;:])/g, '$1');

        return cleaned.trim();
    }
}
