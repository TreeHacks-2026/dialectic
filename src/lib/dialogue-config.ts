/**
 * Dialogue Configuration Storage
 * Manages storing and retrieving dialogue configuration (agents, meeting ID, etc.)
 */

export interface DialogueConfig {
  meetingId?: string;
  agents: Array<{
    id: string;
    name: string;
    description: string;
    heygen?: {
      avatar_id: string;
      voice_id: string;
      voice_name: string;
      preview_url?: string;
    };
  }>;
  createdAt: string;
}

const CONFIG_KEY = 'dialogueConfig';

/**
 * Save dialogue configuration to session storage
 */
export function saveDialogueConfig(config: Omit<DialogueConfig, 'createdAt'>): void {
  if (typeof window === 'undefined') {
    console.warn('[Dialogue Config] Cannot save config: window is undefined (server-side)');
    return;
  }

  const configWithTimestamp: DialogueConfig = {
    ...config,
    createdAt: new Date().toISOString(),
  };

  try {
    sessionStorage.setItem(CONFIG_KEY, JSON.stringify(configWithTimestamp));
    console.log('[Dialogue Config] ✅ Saved config with', config.agents.length, 'agents');
  } catch (error) {
    console.error('[Dialogue Config] ❌ Error saving config:', error);
  }
}

/**
 * Get dialogue configuration from session storage
 */
export function getDialogueConfig(): DialogueConfig | null {
  if (typeof window === 'undefined') {
    console.warn('[Dialogue Config] Cannot get config: window is undefined (server-side)');
    return null;
  }

  try {
    const stored = sessionStorage.getItem(CONFIG_KEY);
    if (!stored) {
      return null;
    }

    const config = JSON.parse(stored) as DialogueConfig;
    console.log('[Dialogue Config] ✅ Retrieved config with', config.agents.length, 'agents');
    return config;
  } catch (error) {
    console.error('[Dialogue Config] ❌ Error reading config:', error);
    return null;
  }
}

/**
 * Clear dialogue configuration from session storage
 */
export function clearDialogueConfig(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    sessionStorage.removeItem(CONFIG_KEY);
    console.log('[Dialogue Config] 🗑️ Cleared config');
  } catch (error) {
    console.error('[Dialogue Config] ❌ Error clearing config:', error);
  }
}
