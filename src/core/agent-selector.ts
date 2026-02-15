/**
 * Agent selector — uses Gemini Flash (free) to decide which agent should respond
 */

import { AgentConfig, AgentSelectionResult } from "../types/types";
import { GeminiClient } from "./gemini-client";

export class AgentSelector {
    private client: GeminiClient;
    private model: string;
    private agents: AgentConfig[];

    constructor(
        client: GeminiClient,
        model: string,
        agents: AgentConfig[]
    ) {
        this.client = client;
        this.model = model;
        this.agents = agents;
    }

    async select(fullTranscript: string): Promise<AgentSelectionResult> {
        const agentDescriptions = this.agents
            .map((a) => `- ${a.name}: ${a.description}`)
            .join("\n");

        const systemPrompt = `You are an agent router. Given a conversation transcript, decide which of the following agents is best suited to respond next. Consider the context, topic, and what kind of expertise would be most helpful.

Available agents:
${agentDescriptions}

Respond with ONLY a JSON object in this exact format, no markdown:
{"selectedAgent": "<agent name>", "reasoning": "<one sentence explanation>"}`;

        const response = await this.client.generate(
            this.model,
            systemPrompt,
            fullTranscript
        );

        try {
            const cleaned = response.replace(/```json\n?|\n?```/g, "").trim();
            return JSON.parse(cleaned) as AgentSelectionResult;
        } catch {
            console.warn(
                `[SELECTOR] Failed to parse selection response, falling back to ${this.agents[0].name}`
            );
            console.warn(`[SELECTOR] Raw response: ${response}`);
            return {
                selectedAgent: this.agents[0].name,
                reasoning: "Fallback due to parse error",
            };
        }
    }
}
