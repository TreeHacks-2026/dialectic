/**
 * Type definitions for the Multi-Agent System
 */

export interface AgentConfig {
    name: string;
    description: string;
}

export interface HumanConfig {
    name: string;
}

export interface PerplexityConfig {
    responseModel: string;
}

export interface ClaudeConfig {
    selectionModel: string;
}

export interface MeetingConfig {
    agents: AgentConfig[];
    humans: HumanConfig[];
    perplexity: PerplexityConfig;
    claude: ClaudeConfig;
}

export interface TranscriptEntry {
    speaker: string;
    text: string;
    timestamp: string;
}

export interface AgentSelectionResult {
    selectedAgent: string;
    reasoning: string;
}

export interface AgentResponse {
    agent: string;
    response: string;
    timestamp: string;
}
