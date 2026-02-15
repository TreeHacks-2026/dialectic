/**
 * Session Configuration Storage (Server-side)
 * Stores agent configurations per session ID
 * This allows the backend to access agent configs when processing RTMS events
 */

export interface SessionAgentConfig {
  id: string;
  name: string;
  description: string;
  heygen?: {
    avatar_id: string;
    voice_id: string;
    voice_name: string;
    preview_url?: string;
  };
}

export interface SessionConfig {
  sessionId: string;
  meetingId?: string;
  agents: SessionAgentConfig[];
  createdAt: number;
  isPending?: boolean; // True for temp configs waiting for RTMS session ID
}

// In-memory storage (can be migrated to database later)
const sessionConfigs = new Map<string, SessionConfig>();

// Cleanup old sessions (older than 2 hours)
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, config] of sessionConfigs.entries()) {
    if (now - config.createdAt > 7200000) { // 2 hours
      sessionConfigs.delete(sessionId);
      console.log(`[Session Config] 🗑️ Cleaned up expired session config: ${sessionId}`);
    }
  }
}, 60000); // Run cleanup every minute

/**
 * Store agent configuration for a session
 */
export function storeSessionConfig(
  sessionId: string,
  meetingId: string | undefined,
  agents: SessionAgentConfig[],
  isPending: boolean = false
): void {
  sessionConfigs.set(sessionId, {
    sessionId,
    meetingId,
    agents,
    createdAt: Date.now(),
    isPending,
  });
  console.log(`[Session Config] 💾 Stored config for session: ${sessionId} with ${agents.length} agents${isPending ? ' (pending)' : ''}`);
}

/**
 * Find and migrate a pending config to a real session ID
 */
export function migratePendingConfigToSession(rtmsSessionId: string, meetingId?: string): SessionConfig | null {
  // Find most recent pending config
  let pendingConfig: SessionConfig | null = null;
  let latestTime = 0;
  const allPendingConfigs: SessionConfig[] = [];

  // First, collect all pending configs for logging
  for (const config of sessionConfigs.values()) {
    if (config.isPending) {
      allPendingConfigs.push(config);
      if (config.createdAt > latestTime) {
        // If meetingId provided, try to match it
        if (!meetingId || config.meetingId === meetingId) {
          pendingConfig = config;
          latestTime = config.createdAt;
        }
      }
    }
  }

  // Log what we found
  if (allPendingConfigs.length > 0) {
    console.log(`[Session Config] 🔍 Found ${allPendingConfigs.length} pending config(s):`);
    allPendingConfigs.forEach(c => {
      console.log(`[Session Config]   - ${c.sessionId} (created: ${new Date(c.createdAt).toISOString()}, agents: ${c.agents.length}, meetingId: ${c.meetingId || 'none'})`);
    });
  } else {
    console.log(`[Session Config] ⚠️ No pending configs found in storage`);
  }

  // If no match with meetingId, use most recent pending config anyway (within last 5 minutes)
  if (!pendingConfig && allPendingConfigs.length > 0) {
    const now = Date.now();
    const recentConfigs = allPendingConfigs
      .filter(c => now - c.createdAt < 300000) // Last 5 minutes
      .sort((a, b) => b.createdAt - a.createdAt);
    
    if (recentConfigs.length > 0) {
      pendingConfig = recentConfigs[0];
      console.log(`[Session Config] 📌 Using most recent pending config (within 5 min): ${pendingConfig.sessionId}`);
    }
  }

  if (pendingConfig) {
    // Remove old pending config
    sessionConfigs.delete(pendingConfig.sessionId);

    // Create new config with RTMS session ID
    const newConfig: SessionConfig = {
      sessionId: rtmsSessionId,
      meetingId: pendingConfig.meetingId || meetingId,
      agents: pendingConfig.agents,
      createdAt: pendingConfig.createdAt,
      isPending: false,
    };

    sessionConfigs.set(rtmsSessionId, newConfig);
    console.log(`[Session Config] 🔄 Migrated pending config to RTMS session: ${rtmsSessionId}`);
    console.log(`[Session Config] 📋 Migrated agents: ${newConfig.agents.map(a => a.name).join(', ')}`);
    return newConfig;
  }

  console.log(`[Session Config] ❌ No suitable pending config found to migrate`);
  return null;
}

/**
 * Get agent configuration for a session
 */
export function getSessionConfig(sessionId: string): SessionConfig | null {
  const config = sessionConfigs.get(sessionId);
  if (config) {
    console.log(`[Session Config] ✅ Retrieved config for session: ${sessionId}`);
  } else {
    console.log(`[Session Config] ⚠️ No config found for session: ${sessionId}`);
  }
  return config || null;
}

/**
 * Clear configuration for a session
 */
export function clearSessionConfig(sessionId: string): void {
  sessionConfigs.delete(sessionId);
  console.log(`[Session Config] 🗑️ Cleared config for session: ${sessionId}`);
}
