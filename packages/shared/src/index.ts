/**
 * Shared types and config contracts for Dialectic.
 */

export type PersonaId = string;

export interface PersonaConfig {
  id: PersonaId;
  name: string;
  systemPrompt: string;
  documentIds: string[];
}

export interface SessionConfig {
  sessionId: string;
  zoomLink: string;
  personaIds: PersonaId[];
}

export interface SessionCreateRequest {
  zoomLink: string;
  personaIds: PersonaId[];
}

export interface SessionCreateResponse {
  sessionId: string;
  status: 'created';
}

// --- Meeting transcript (STT output, used for post-meeting analysis) ---
//
// Format: each segment is "speaker indicated, then text from their speech."
// AI agents are not live participants; their turns are integrated into the
// transcript retroactively (e.g. after the meeting) with speakerRole: 'agent'.

export type SpeakerId = string;

export interface TranscriptSegment {
  /** Unique id for this segment (e.g. from STT) */
  id: string;
  /** Speaker label (e.g. student name or agent persona id). Indicated per segment, then text. */
  speakerId: SpeakerId;
  /** "student" | "agent" | "unknown". Agents are merged in retroactively. */
  speakerRole: 'student' | 'agent' | 'unknown';
  /** Plain text of what was said */
  text: string;
  /** Start time in seconds from meeting start (optional) */
  startTimeSeconds?: number;
  /** End time in seconds (optional) */
  endTimeSeconds?: number;
}

export interface MeetingTranscript {
  /** Session ID for progression across meetings */
  sessionId?: string;
  /** When the meeting occurred (ISO string) */
  recordedAt?: string;
  /** Ordered segments (chronological). Speaker indicated per segment; agents added retroactively. */
  segments: TranscriptSegment[];
}
