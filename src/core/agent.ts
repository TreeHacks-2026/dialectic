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
        transcriptSummary: string
    ): Promise<AgentResponse> {
        const systemPrompt = `You are ${this.config.name}. ${this.config.description}

You are participating in a meeting. Respond naturally and in-character. Make sure your responses are accurate to your persona and do the relevant research needed to ensure this. Keep your response concise and conversational while also being thoughtful and deep — keep in mind that this is a live discussion. If you reference a source, cite it verbally (e.g. "As per [source name],...", "according to [source name],...").

Here is a summary of the full conversation so far:
${transcriptSummary || "(This is the beginning of the conversation.)"}`;

        const userPrompt = `Here are the most recent messages in the conversation:

${recentMessages}

Respond as ${this.config.name}:`;

        const response = await this.client.chatCompletion(this.model, [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ]);

        return {
            agent: this.config.name,
            response,
            timestamp: new Date().toISOString(),
        };
    }
}
