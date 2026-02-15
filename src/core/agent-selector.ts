/**
 * Agent selector — uses Claude to decide which agent should respond
 */

import { AgentConfig, AgentSelectionResult } from "../types/types";
import { ClaudeClient } from "./claude-client";

export class AgentSelector {
    private client: ClaudeClient;
    private model: string;
    private agents: AgentConfig[];

    constructor(
        client: ClaudeClient,
        model: string,
        agents: AgentConfig[]
    ) {
        this.client = client;
        this.model = model;
        this.agents = agents;
    }

    async select(
        recentTranscript: string,
        lastNSpeakers: string[]
    ): Promise<AgentSelectionResult> {
        const agentDescriptions = this.agents
            .map((a) => `- ${a.name}: ${a.description}`)
            .join("\n");

        // Identify agents who spoke recently
        const recentAgents = new Set(
            lastNSpeakers.filter((s) =>
                this.agents.some((a) => a.name === s)
            )
        );

        const turnTakingGuidance =
            recentAgents.size > 0
                ? `\n\nNOTE: ${Array.from(recentAgents).join(", ")} spoke recently. Consider selecting a different agent for variety, unless their expertise is uniquely needed.`
                : "";

        const systemPrompt = `You are an agent router for a dynamic intellectual conversation. 

Available agents:
${agentDescriptions}

Your job is to select the agent who will make the conversation most engaging and thought-provoking right now.

Selection criteria (in order of priority):
1. **Who can challenge or question?** - Select someone who might push back on what was just said or ask a tough question
2. **Who brings a fresh perspective?** - Choose someone whose worldview/expertise differs from the last speaker
3. **Who can draw from relevant experience?** - Pick someone with concrete examples or stories to share
4. **Conversation dynamics** - Encourage variety in voices${turnTakingGuidance}

You're NOT just matching expertise to topic. You're creating an engaging debate. Sometimes the "wrong" expert asking a great question is better than the "right" expert giving another answer.

Respond with ONLY a JSON object in this exact format, no markdown:
{"selectedAgent": "<agent name>", "reasoning": "<one sentence explanation>"}`;

        const response = await this.client.generate(
            this.model,
            systemPrompt,
            `Recent conversation:\n\n${recentTranscript}\n\nWhich agent should respond?`
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
