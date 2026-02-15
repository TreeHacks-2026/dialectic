import { NextRequest, NextResponse } from 'next/server';
import { MultiAgentSystem, ApiKeys } from '@/core/multi-agent-system';
import { MeetingConfig, AgentConfig } from '@/types/types';
import configData from '@/config/config.json';

interface LLMProcessRequest {
  transcript: string;
  speaker: string;
  timestamp: number;
  sessionId?: string; // Session identifier for per-session systems
  agentConfigs?: Array<{ // Dynamic agent configurations
    id: string;
    name: string;
    description: string;
  }>;
  // Optional: full conversation history for context
  conversationHistory?: Array<{ speaker: string; text: string; timestamp: number }>;
}

interface LLMProcessResponse {
  response: string;
  agentId: string; // Changed from agent: 'agent1' | 'agent2' | 'agent3'
  agentName: string; // Agent's actual name
  processed_at: string;
}

/**
 * Session-based MultiAgentSystem storage
 * Each session gets its own system instance with its own agent configuration
 */
interface SessionSystem {
  config: MeetingConfig;
  system: MultiAgentSystem;
  agentIdMap: Map<string, string>; // Maps agent name -> agent ID
  createdAt: number;
}

const sessionSystems = new Map<string, SessionSystem>();

// Cleanup old sessions (older than 1 hour)
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of sessionSystems.entries()) {
    if (now - session.createdAt > 3600000) { // 1 hour
      sessionSystems.delete(sessionId);
      console.log(`[LLM] 🗑️ Cleaned up expired session: ${sessionId}`);
    }
  }
}, 60000); // Run cleanup every minute

/**
 * Get or create multi-agent system for a specific session
 */
function getMultiAgentSystemForSession(
  sessionId: string,
  agentConfigs: Array<{ id: string; name: string; description: string }>
): SessionSystem {
  // Check if session exists
  if (sessionSystems.has(sessionId)) {
    return sessionSystems.get(sessionId)!;
  }

  // Get API keys from environment
  const claudeKey = process.env.CLAUDE_API_KEY || '';
  const perplexityKey = process.env.PERPLEXITY_API_KEY || '';

  if (!claudeKey || !perplexityKey) {
    throw new Error('CLAUDE_API_KEY and PERPLEXITY_API_KEY must be set');
  }

  const keys: ApiKeys = {
    claude: claudeKey,
    perplexity: perplexityKey,
  };

  // Create MeetingConfig from agentConfigs
  const agentConfigsForSystem: AgentConfig[] = agentConfigs.map(a => ({
    name: a.name,
    description: a.description,
  }));

  const meetingConfig: MeetingConfig = {
    agents: agentConfigsForSystem,
    humans: [], // Can be populated from meeting participants if needed
    claude: { selectionModel: "claude-4-5-haiku-20241022" },
    perplexity: { responseModel: "sonar-pro" },
  };

  // Create agent name -> ID mapping
  const agentIdMap = new Map<string, string>();
  agentConfigs.forEach(a => {
    agentIdMap.set(a.name, a.id);
  });

  // Create new MultiAgentSystem
  const system = new MultiAgentSystem(meetingConfig, keys);

  const sessionSystem: SessionSystem = {
    config: meetingConfig,
    system,
    agentIdMap,
    createdAt: Date.now(),
  };

  sessionSystems.set(sessionId, sessionSystem);

  console.log(`[LLM] ✅ Created new multi-agent system for session: ${sessionId}`);
  console.log(`[LLM] Agents: ${meetingConfig.agents.map(a => a.name).join(', ')}`);

  return sessionSystem;
}

/**
 * Get default multi-agent system (fallback for sessions without config)
 */
function getDefaultMultiAgentSystem(): MultiAgentSystem {
  const claudeKey = process.env.CLAUDE_API_KEY || '';
  const perplexityKey = process.env.PERPLEXITY_API_KEY || '';

  if (!claudeKey || !perplexityKey) {
    throw new Error('CLAUDE_API_KEY and PERPLEXITY_API_KEY must be set');
  }

  const keys: ApiKeys = {
    claude: claudeKey,
    perplexity: perplexityKey,
  };

  const meetingConfig = configData as MeetingConfig;
  const system = new MultiAgentSystem(meetingConfig, keys);

  console.log('[LLM] ✅ Using default multi-agent system');
  console.log(`[LLM] Agents: ${meetingConfig.agents.map(a => a.name).join(', ')}`);

  return system;
}

/**
 * Real LLM processing endpoint using multi-agent system
 * Uses Claude for agent selection and Perplexity for responses
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LLMProcessRequest;
    const { transcript, speaker, timestamp, sessionId, agentConfigs, conversationHistory } = body;

    if (!transcript || !speaker) {
      return NextResponse.json(
        { error: 'Transcript and speaker are required' },
        { status: 400 }
      );
    }

    console.log(`[LLM] 📝 Processing transcript from ${speaker}: ${transcript.substring(0, 50)}...`);

    // Get multi-agent system (session-based or default)
    let system: MultiAgentSystem;
    let agentIdMap: Map<string, string> | null = null;

    if (sessionId && agentConfigs && agentConfigs.length > 0) {
      // Use session-specific system
      const sessionSystem = getMultiAgentSystemForSession(sessionId, agentConfigs);
      system = sessionSystem.system;
      agentIdMap = sessionSystem.agentIdMap;
      console.log(`[LLM] Using session-specific system for: ${sessionId}`);
    } else {
      // Fallback to default system
      system = getDefaultMultiAgentSystem();
      console.log('[LLM] Using default system (no session config provided)');
    }

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

    // Map agent name to agent ID
    let agentId: string;
    if (agentIdMap) {
      // Use session-specific mapping
      agentId = agentIdMap.get(agentResponse.agent) || agentResponse.agent;
      console.log(`[LLM] 🔄 Mapped agent name "${agentResponse.agent}" to ID "${agentId}" (session-specific)`);
      if (!agentIdMap.has(agentResponse.agent)) {
        console.warn(`[LLM] ⚠️ Agent name "${agentResponse.agent}" not found in session agentIdMap. Available: ${Array.from(agentIdMap.keys()).join(', ')}`);
      }
    } else {
      // Fallback: map agent names to default agent IDs from default-agents.ts
      const defaultAgentNameToId: Record<string, string> = {
        'Dexter Lawyer': 'dexter-lawyer',
        'Judy Lawyer': 'judy-lawyer-professional',
        'Alex Young': 'young-passionate-lawyer',
      };
      agentId = defaultAgentNameToId[agentResponse.agent] || agentResponse.agent;
      console.log(`[LLM] 🔄 Mapped agent name "${agentResponse.agent}" to ID "${agentId}" (default mapping)`);
      if (!defaultAgentNameToId[agentResponse.agent]) {
        console.warn(`[LLM] ⚠️ Agent name "${agentResponse.agent}" not found in default mapping. Using name as ID.`);
      }
    }

    const response: LLMProcessResponse = {
      response: agentResponse.response,
      agentId: agentId,
      agentName: agentResponse.agent,
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
