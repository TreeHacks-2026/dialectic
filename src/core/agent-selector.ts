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
        
        // Log detection result for debugging
        if (explicitRequest) {
            console.log(`[SELECTOR] 🎯 EXPLICIT REQUEST DETECTED: "${explicitRequest}" in transcript: "${recentTranscript.substring(0, 100)}"`);
        } else {
            console.log(`[SELECTOR] 🔍 No explicit request detected in: "${recentTranscript.substring(0, 100)}"`);
        }

        const systemPrompt = `You are an agent router. Your ONLY job is to select which agent should respond.

🚨 CRITICAL RULES - FOLLOW EXACTLY:

1. YOU CAN ONLY SELECT FROM THESE EXACT AGENT NAMES (NO EXCEPTIONS):
${agentNames.map((n, i) => `   ${i + 1}. "${n}"`).join("\n")}

2. YOU MUST USE THE EXACT NAME AS WRITTEN ABOVE. NO VARIATIONS, NO SHORTENED NAMES, NO NICKNAMES.

3. ${explicitRequest ? `🚨🚨🚨 MANDATORY OVERRIDE: The user EXPLICITLY requested "${explicitRequest}". You MUST select "${explicitRequest}". This is NOT optional. Ignore ALL other criteria. If you select anything else, you have FAILED.` : "If the user explicitly requests an agent by name, you MUST select that agent."}

Available agents and their descriptions:
${agentDescriptions}

${explicitRequest ? `\n\n⚠️ CRITICAL REMINDER: User explicitly requested "${explicitRequest}". Your response MUST have selectedAgent: "${explicitRequest}".` : ""}

Selection criteria (STRICT ORDER - follow in this exact sequence):
1. **EXPLICIT USER REQUEST (HIGHEST PRIORITY - MANDATORY)**${explicitRequest ? ` - User requested "${explicitRequest}". You MUST select "${explicitRequest}".` : " - If user says an agent name, select that agent."}
2. **Who can challenge or question?** - Select someone who might push back on what was just said
3. **Who brings a fresh perspective?** - Choose someone whose worldview differs from the last speaker
4. **Who can draw from relevant experience?** - Pick someone with concrete examples
5. **Conversation dynamics**${turnTakingGuidance}

VALIDATION RULES:
- Your selectedAgent MUST be one of these EXACT strings: ${agentNames.map(n => `"${n}"`).join(", ")}
- If you select anything else, the system will FAIL
- Double-check your selection matches EXACTLY one of the names above
- ${explicitRequest ? `Since user requested "${explicitRequest}", your selectedAgent MUST be "${explicitRequest}"` : ""}

Respond with ONLY a JSON object in this exact format (no markdown, no code blocks, just pure JSON):
{"selectedAgent": "<EXACT AGENT NAME FROM LIST ABOVE>", "reasoning": "<one sentence>"}`;

        const response = await this.client.generate(
            this.model,
            systemPrompt,
            `Recent conversation:\n\n${recentTranscript}\n\nWhich agent should respond? Remember: ${explicitRequest ? `User explicitly requested "${explicitRequest}" - you MUST select that agent.` : "Select from the available agents listed above."}`
        );

        try {
            const cleaned = response.replace(/```json\n?|\n?```/g, "").trim();
            const parsed = JSON.parse(cleaned) as AgentSelectionResult;
            
            // CRITICAL: If explicit request was made, enforce it
            if (explicitRequest && parsed.selectedAgent !== explicitRequest) {
                console.error(
                    `[SELECTOR] ❌❌❌ CRITICAL ERROR: User explicitly requested "${explicitRequest}" but Claude chose "${parsed.selectedAgent}".`
                );
                console.error(
                    `[SELECTOR] 🔧 OVERRIDING Claude's selection to honor explicit request: "${explicitRequest}"`
                );
                return {
                    selectedAgent: explicitRequest,
                    reasoning: `User explicitly requested ${explicitRequest} (Claude's selection was overridden)`,
                };
            }
            
            // Log successful selection
            if (explicitRequest && parsed.selectedAgent === explicitRequest) {
                console.log(`[SELECTOR] ✅ Claude correctly honored explicit request for "${explicitRequest}"`);
            }
            
            // Validate that the selected agent is actually in our list
            if (!agentNames.includes(parsed.selectedAgent)) {
                console.warn(
                    `[SELECTOR] ❌ Selected agent "${parsed.selectedAgent}" not in available list: ${agentNames.join(", ")}. Falling back to ${explicitRequest || agentNames[0]}.`
                );
                return {
                    selectedAgent: explicitRequest || agentNames[0],
                    reasoning: `Invalid selection corrected: ${parsed.reasoning}`,
                };
            }
            
            return parsed;
        } catch {
            console.warn(
                `[SELECTOR] Failed to parse selection response, falling back to ${explicitRequest || this.agents[0].name}`
            );
            console.warn(`[SELECTOR] Raw response: ${response}`);
            return {
                selectedAgent: explicitRequest || this.agents[0].name,
                reasoning: explicitRequest ? `User explicitly requested ${explicitRequest}` : "Fallback due to parse error",
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
            const firstName = lowerName.split(' ')[0]; // "dexter" from "dexter lawyer"
            const lastName = lowerName.split(' ').slice(1).join(' '); // "lawyer" from "dexter lawyer"
            
            // Escape special regex characters in names
            const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const escapedFirstName = escapeRegex(firstName);
            const escapedLastName = escapeRegex(lastName);
            const escapedFullName = escapeRegex(lowerName);
            
            // Comprehensive patterns for explicit requests
            const patterns = [
                // Direct address at start: "Judy, ..." or "Hey Judy, ..."
                new RegExp(`^\\s*${escapedFirstName}\\s*,`, 'i'),
                new RegExp(`^\\s*hey\\s+${escapedFirstName}\\b`, 'i'),
                
                // Full name at start: "Dexter Lawyer, ..."
                new RegExp(`^\\s*${escapedFullName}\\s*,`, 'i'),
                new RegExp(`^\\s*hey\\s+${escapedFullName}\\b`, 'i'),
                
                // After greeting: "Hello, Dexter," or "Hi, Judy," or "Hey, Alex,"
                new RegExp(`\\b(hello|hi|hey|greetings)\\s*,\\s*${escapedFirstName}\\s*,`, 'i'),
                new RegExp(`\\b(hello|hi|hey|greetings)\\s*,\\s*${escapedFullName}\\s*,`, 'i'),
                
                // "[name]," anywhere in sentence (common direct address)
                new RegExp(`\\b${escapedFirstName}\\s*,`, 'i'),
                new RegExp(`\\b${escapedFullName}\\s*,`, 'i'),
                
                // "ask [name]" or "[name] can you"
                new RegExp(`\\bask\\s+${escapedFirstName}\\b`, 'i'),
                new RegExp(`\\bask\\s+${escapedFullName}\\b`, 'i'),
                new RegExp(`\\b${escapedFirstName}\\s+(can you|please|tell me|respond|answer|what do you think|reply|what|do you)`, 'i'),
                new RegExp(`\\b${escapedFullName}\\s+(can you|please|tell me|respond|answer|what do you think|reply)`, 'i'),
                
                // "let [name]" or "have [name]"
                new RegExp(`\\b(let|have)\\s+${escapedFirstName}\\s+(respond|answer|speak|talk|reply)`, 'i'),
                new RegExp(`\\b(let|have)\\s+${escapedFullName}\\s+(respond|answer|speak|talk|reply)`, 'i'),
                
                // "[name] how are you" or "[name] tell me about"
                new RegExp(`\\b${escapedFirstName}\\s+(how are you|tell me about|tell me)`, 'i'),
                new RegExp(`\\b${escapedFullName}\\s+(how are you|tell me about|tell me)`, 'i'),
                
                // Direct questions: "[name], what..." or "[name], do you..."
                new RegExp(`\\b${escapedFirstName}\\s*,\\s*(what|do you|can you)`, 'i'),
                new RegExp(`\\b${escapedFullName}\\s*,\\s*(what|do you|can you)`, 'i'),
                
                // "[name] can you reply back" or "[name] reply"
                new RegExp(`\\b${escapedFirstName}\\s+(can you\\s+)?reply`, 'i'),
                new RegExp(`\\b${escapedFullName}\\s+(can you\\s+)?reply`, 'i'),
            ];
            
            for (const pattern of patterns) {
                if (pattern.test(lowerTranscript)) {
                    console.log(`[SELECTOR] 🎯 Pattern matched! Detected explicit request for agent: ${agentName}`);
                    console.log(`[SELECTOR] 📝 Matched pattern: ${pattern.source} against: "${lowerTranscript.substring(0, 100)}"`);
                    return agentName;
                }
            }
        }
        
        console.log(`[SELECTOR] ❌ No explicit request patterns matched for transcript: "${lowerTranscript.substring(0, 100)}"`);
        return null;
    }
}
