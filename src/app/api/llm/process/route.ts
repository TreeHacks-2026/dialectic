import { NextRequest, NextResponse } from 'next/server';
import { MultiAgentSystem, ApiKeys } from '@/core/multi-agent-system';
import { MeetingConfig } from '@/types/types';
import configData from '../../../config.json';

interface LLMProcessRequest {
  transcript: string;
  speaker: string;
  timestamp: number;
  // Optional: full conversation history for context
  conversationHistory?: Array<{ speaker: string; text: string; timestamp: number }>;
}

interface LLMProcessResponse {
  response: string;
  agent: 'agent1' | 'agent2' | 'agent3';
  processed_at: string;
}

// Singleton multi-agent system instance
let multiAgentSystem: MultiAgentSystem | null = null;

/**
 * Get or create multi-agent system instance
 */
function getMultiAgentSystem(): MultiAgentSystem {
  if (multiAgentSystem) {
    return multiAgentSystem;
  }

  // Get API keys from environment
  const geminiKey = process.env.GEMINI_API_KEY || '';
  const perplexityKey = process.env.PERPLEXITY_API_KEY || '';

  if (!geminiKey || !perplexityKey) {
    throw new Error('GEMINI_API_KEY and PERPLEXITY_API_KEY must be set');
  }

  const keys: ApiKeys = {
    gemini: geminiKey,
    perplexity: perplexityKey,
  };

  const meetingConfig = configData as MeetingConfig;
  multiAgentSystem = new MultiAgentSystem(meetingConfig, keys);

  console.log('[LLM] ✅ Multi-agent system initialized');
  console.log(`[LLM] Agents: ${meetingConfig.agents.map(a => a.name).join(', ')}`);

  return multiAgentSystem;
}

/**
 * Map agent name to avatar agent ID
 * Maps: Dr. Thesis -> agent1, Dev -> agent2, Sage -> agent3
 */
function mapAgentToAvatar(agentName: string): 'agent1' | 'agent2' | 'agent3' {
  const agentMap: Record<string, 'agent1' | 'agent2' | 'agent3'> = {
    'Dr. Thesis': 'agent1',
    'Dev': 'agent2',
    'Sage': 'agent3',
  };

  return agentMap[agentName] || 'agent1'; // Default to agent1 if unknown
}

/**
 * Real LLM processing endpoint using multi-agent system
 * Uses Gemini for agent selection and Perplexity for responses
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LLMProcessRequest;
    const { transcript, speaker, conversationHistory } = body;

    if (!transcript || !speaker) {
      return NextResponse.json(
        { error: 'Transcript and speaker are required' },
        { status: 400 }
      );
    }

    console.log(`[LLM] 📝 Processing transcript from ${speaker}: ${transcript.substring(0, 50)}...`);

    // Get multi-agent system
    const system = getMultiAgentSystem();

    // If we have conversation history, add it to the transcript first
    if (conversationHistory && conversationHistory.length > 0) {
      for (const entry of conversationHistory) {
        system.getTranscript().add(entry.speaker, entry.text);
      }
    }

    // Add the new human input and get agent response
    const agentResponse = await system.addInput(speaker, transcript);

    console.log(`[LLM] ✅ Agent ${agentResponse.agent} responded`);
    console.log(`[LLM] 📄 Response: ${agentResponse.response.substring(0, 100)}...`);

    // Map agent name to avatar ID
    const avatarAgent = mapAgentToAvatar(agentResponse.agent);

    const response: LLMProcessResponse = {
      response: agentResponse.response,
      agent: avatarAgent,
      processed_at: agentResponse.timestamp,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[LLM] ❌ Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
