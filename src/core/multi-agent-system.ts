/**
 * Multi-Agent System — orchestrates agent selection and response
 */

import { MeetingConfig, AgentResponse } from "../types/types";
import { PerplexityClient } from "./perplexity-client";
import { ClaudeClient } from "./claude-client";
import { AgentSelector } from "./agent-selector";
import { Agent } from "./agent";
import { Transcript } from "./transcript";

export interface ApiKeys {
    claude: string;      // Used for agent selection
    perplexity: string;  // Paid — used for agent responses
}

export class MultiAgentSystem {
    private selector: AgentSelector;
    private agents: Map<string, Agent>;
    private transcript: Transcript;
    private config: MeetingConfig;

    constructor(config: MeetingConfig, keys: ApiKeys) {
        this.config = config;
        this.transcript = new Transcript();

        // Claude for agent selection
        const claudeClient = new ClaudeClient(keys.claude);
        this.selector = new AgentSelector(
            claudeClient,
            config.claude.selectionModel,
            config.agents
        );

        // Perplexity for agent responses (powerful)
        const perplexityClient = new PerplexityClient(keys.perplexity);
        this.agents = new Map();
        for (const agentConfig of config.agents) {
            this.agents.set(
                agentConfig.name,
                new Agent(agentConfig, perplexityClient, config.perplexity.responseModel)
            );
        }
    }

    /**
     * Add a human message to the transcript and trigger agent response
     */
    async addInput(speaker: string, text: string): Promise<AgentResponse> {
        // Record human input
        this.transcript.add(speaker, text);
        return this.selectAndRespond();
    }

    /**
     * Continue the conversation — lets another agent respond without new human input.
     * Used when humans "pass" or stay silent.
     */
    async continueConversation(): Promise<AgentResponse> {
        return this.selectAndRespond();
    }

    private async selectAndRespond(): Promise<AgentResponse> {
        // 1. Get recent context for selection
        const recentTranscript = this.transcript.getLastNText(10);
        const lastNSpeakers = this.transcript
            .getLast(5)
            .map((e) => e.speaker);

        // 2. Select agent (small model, recent context only)
        const selection = await this.selector.select(
            recentTranscript,
            lastNSpeakers
        );

        console.log(
            `[SELECTOR] Chose ${selection.selectedAgent}: ${selection.reasoning}`
        );

        // 3. Get agent instance
        const agent =
            this.agents.get(selection.selectedAgent) ??
            this.agents.values().next().value!;

        // 4. Build context for response
        const recentMessages = this.transcript.getLastNText(5);
        const transcriptSummary = this.buildTranscriptSummary();
        const conversationMeta = this.buildConversationMetadata();
        const lastSpeaker =
            this.transcript.getLast(1)[0]?.speaker || "unknown";

        // 5. Generate response (large model)
        const response = await agent.respond(
            recentMessages,
            transcriptSummary,
            conversationMeta,
            lastSpeaker
        );

        // Record agent response in transcript
        this.transcript.add(response.agent, response.response);

        return response;
    }

    getTranscript(): Transcript {
        return this.transcript;
    }

    getConfig(): MeetingConfig {
        return this.config;
    }

    private buildConversationMetadata(): string {
        const entries = this.transcript.getAll();
        const recentEntries = entries.slice(-10);

        // Track speaking frequency
        const speakerCounts = new Map<string, number>();
        recentEntries.forEach((e) => {
            speakerCounts.set(e.speaker, (speakerCounts.get(e.speaker) || 0) + 1);
        });

        // Identify current topic (last human speaker)
        const lastHumanEntry = [...entries]
            .reverse()
            .find((e) => this.config.humans.some((h) => h.name === e.speaker));

        // Get last speaker
        const lastSpeaker = entries[entries.length - 1]?.speaker || "unknown";

        return `[CONVERSATION STATE]
Recent speakers: ${Array.from(speakerCounts.entries())
                .map(([name, count]) => `${name} (${count})`)
                .join(", ")}
Last speaker: ${lastSpeaker}${lastHumanEntry
                ? `\nLast human question/input from: ${lastHumanEntry.speaker}`
                : ""
            }`;
    }

    private buildTranscriptSummary(): string {
        const entries = this.transcript.getAll();
        if (entries.length <= 5) {
            return this.transcript.getFullText();
        }

        // For longer transcripts, return first few + note about middle + last few
        const firstFew = entries
            .slice(0, 3)
            .map((e) => `${e.speaker}: ${e.text}`)
            .join("\n");
        const lastFew = entries
            .slice(-3)
            .map((e) => `${e.speaker}: ${e.text}`)
            .join("\n");

        return `[Beginning of conversation]\n${firstFew}\n\n[... ${entries.length - 6} messages omitted ...]\n\n[Recent]\n${lastFew}`;
    }
}
