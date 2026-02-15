/**
 * Agent runtime: STT → RAG + LLM → TTS.
 * One instance per persona; joins meeting as independent participant.
 */

import type { PersonaConfig } from '@dialectic/shared';

// Placeholder: load persona config from env or session manager.
function getPersonaConfig(): PersonaConfig | null {
  const raw = process.env.PERSONA_CONFIG;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PersonaConfig;
  } catch {
    return null;
  }
}

async function main() {
  const persona = getPersonaConfig();
  if (!persona) {
    console.warn('No PERSONA_CONFIG; agent idle.');
    return;
  }
  console.info(`Agent runtime started: ${persona.name}`);
  // TODO: connect to meeting, STT, RAG, LLM, TTS loop.
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
