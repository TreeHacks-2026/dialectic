import { AgentResponse } from "./src/types/types";

/**
 * Individual agent that processes queries
 */
export class Agent {
    private name: string;
    private acknowledgments: string[];
    private currentAckIndex: number = 0;

    constructor(name: string, acknowledgments: string[]) {
        this.name = name;
        this.acknowledgments = acknowledgments;
    }

    getName(): string {
        return this.name;
    }

    private getAcknowledgment(): string {
        const ack = this.acknowledgments[this.currentAckIndex];
        this.currentAckIndex =
            (this.currentAckIndex + 1) % this.acknowledgments.length;
        return ack;
    }

    async process(query: string, context: string): Promise<AgentResponse> {
        const acknowledgment = this.getAcknowledgment();

        // Simulate processing delay
        await this.sleep(500);

        const response = this.simulateProcessing(query, context);

        return {
            agent: this.name,
            response: `${acknowledgment} ${response}`,
            timestamp: new Date().toISOString(),
        };
    }

    private simulateProcessing(query: string, context: string): string {
        const wordCount = query.split(" ").length;

        const responses = [
            `Based on the context, I found ${wordCount} key points to address.`,
            `After analyzing the input, here's what I understand: ${query.substring(0, 50)}...`,
            `I've processed your query and cross-referenced it with our knowledge base.`,
            `The analysis shows interesting patterns in your recent inputs.`,
        ];

        const hash = this.simpleHash(query);
        const responseIndex = Math.abs(hash) % responses.length;
        return responses[responseIndex];
    }

    private simpleHash(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash;
        }
        return hash;
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
