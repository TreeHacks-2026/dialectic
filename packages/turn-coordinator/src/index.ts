/**
 * Turn Coordinator: floor arbitration, single speaker, silence/queue.
 * Non-LLM; used by agent runtimes to request/release floor.
 */

export type AgentId = string;

export interface TurnCoordinator {
  requestFloor(agentId: AgentId): Promise<boolean>;
  releaseFloor(agentId: AgentId): void;
  getCurrentSpeaker(): AgentId | null;
}

// In-memory MVP implementation.
export function createTurnCoordinator(agentIds: AgentId[]): TurnCoordinator {
  let current: AgentId | null = null;
  const queue: AgentId[] = [];

  return {
    async requestFloor(agentId: AgentId): Promise<boolean> {
      if (!current) {
        current = agentId;
        return true;
      }
      if (current === agentId) return true;
      if (!queue.includes(agentId)) queue.push(agentId);
      return false;
    },
    releaseFloor(agentId: AgentId): void {
      if (current === agentId) {
        current = queue.shift() ?? null;
      }
    },
    getCurrentSpeaker(): AgentId | null {
      return current;
    },
  };
}
