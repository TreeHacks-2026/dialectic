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
        const agentNames = this.agents.map((a) => a.name);
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

        // Check if user explicitly requested a specific agent
        const explicitRequest = this.detectExplicitAgentRequest(recentTranscript, agentNames);

        const systemPrompt = `You are an agent router for a dynamic intellectual conversation. 

CRITICAL CONSTRAINT: You MUST select ONLY from these available agents:
${agentNames.map((n) => `- ${n}`).join("\n")}

Available agents and their descriptions:
${agentDescriptions}

${explicitRequest ? `\nIMPORTANT: The user explicitly requested "${explicitRequest}". You MUST select this agent unless it's not in the available list above.` : ""}

Your job is to select the agent who will make the conversation most engaging and thought-provoking right now.

Selection criteria (in order of priority):
1. **Explicit user request** - If the user specifically asked for an agent by name, honor that request${explicitRequest ? ` (User requested: ${explicitRequest})` : ""}
2. **Who can challenge or question?** - Select someone who might push back on what was just said or ask a tough question
3. **Who brings a fresh perspective?** - Choose someone whose worldview/expertise differs from the last speaker
4. **Who can draw from relevant experience?** - Pick someone with concrete examples or stories to share
5. **Conversation dynamics** - Encourage variety in voices${turnTakingGuidance}

You're NOT just matching expertise to topic. You're creating an engaging debate. Sometimes the "wrong" expert asking a great question is better than the "right" expert giving another answer.

CRITICAL: You MUST respond with one of these exact agent names: ${agentNames.join(", ")}. Do NOT make up agent names or use variations.

Respond with ONLY a JSON object in this exact format, no markdown:
{"selectedAgent": "<agent name>", "reasoning": "<one sentence explanation>"}`;

        const response = await this.client.generate(
            this.model,
            systemPrompt,
            `Recent conversation:\n\n${recentTranscript}\n\nWhich agent should respond?`
        );

        try {
            const cleaned = response.replace(/```json\n?|\n?```/g, "").trim();
            const parsed = JSON.parse(cleaned) as AgentSelectionResult;
            
            // Validate that the selected agent is actually in our list
            if (!agentNames.includes(parsed.selectedAgent)) {
                console.warn(
                    `[SELECTOR] Selected agent "${parsed.selectedAgent}" not in available list: ${agentNames.join(", ")}. Falling back to first agent.`
                );
                return {
                    selectedAgent: agentNames[0],
                    reasoning: `Invalid selection corrected: ${parsed.reasoning}`,
                };
            }
            
            return parsed;
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

    /**
     * Detect if the user explicitly requested a specific agent by name
     * Returns the agent name if found, null otherwise
     */
    private detectExplicitAgentRequest(transcript: string, agentNames: string[]): string | null {
        const lowerTranscript = transcript.toLowerCase();
        
        // Check for explicit patterns like "Hey Dexter", "ask Judy", "let Alex respond", etc.
        for (const agentName of agentNames) {
            const lowerName = agentName.toLowerCase();
            // Check for patterns like "hey [name]", "ask [name]", "[name] can you", etc.
            const patterns = [
                new RegExp(`\\bhey\\s+${lowerName}\\b`, 'i'),
                new RegExp(`\\bask\\s+${lowerName}\\b`, 'i'),
                new RegExp(`\\b${lowerName}\\s+(can you|please|tell me|respond|answer)`, 'i'),
                new RegExp(`\\b(let|have)\\s+${lowerName}\\s+(respond|answer|speak|talk)`, 'i'),
                new RegExp(`\\b${lowerName}\\s+(how are you|tell me about)`, 'i'),
            ];
            
            for (const pattern of patterns) {
                if (pattern.test(lowerTranscript)) {
                    console.log(`[SELECTOR] 🎯 Detected explicit request for agent: ${agentName}`);
                    return agentName;
                }
            }
        }
        
        return null;
    }
}
