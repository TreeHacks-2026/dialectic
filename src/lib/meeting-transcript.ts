/**
 * Meeting Transcript Manager
 * Collects all meeting transcripts (user speech + LLM responses) in chronological order
 */

export interface MeetingTranscriptEntry {
  id: string;
  speakerId: string;
  speakerRole: 'student' | 'agent' | 'unknown';
  text: string;
  timestamp: number; // Unix timestamp in milliseconds
  sessionId?: string;
}

class MeetingTranscriptManager {
  private transcripts: Map<string, MeetingTranscriptEntry[]> = new Map(); // sessionId -> entries
  private currentSessionId: string | null = null;

  /**
   * Start tracking a new meeting session
   */
  startSession(sessionId: string): void {
    this.currentSessionId = sessionId;
    if (!this.transcripts.has(sessionId)) {
      this.transcripts.set(sessionId, []);
    }
    console.log(`[Transcript Manager] 📝 Started tracking session: ${sessionId}`);
  }

  /**
   * Add a user transcript (from RTMS)
   */
  addUserTranscript(sessionId: string, speakerName: string, text: string, timestamp: number): void {
    const entry: MeetingTranscriptEntry = {
      id: `user-${Date.now()}-${Math.random()}`,
      speakerId: speakerName,
      speakerRole: 'student',
      text: text.trim(),
      timestamp,
      sessionId,
    };

    const entries = this.transcripts.get(sessionId) || [];
    entries.push(entry);
    // Sort by timestamp to maintain chronological order
    entries.sort((a, b) => a.timestamp - b.timestamp);
    this.transcripts.set(sessionId, entries);

    console.log(`[Transcript Manager] 📝 Added user transcript: ${speakerName}: ${text.substring(0, 50)}...`);
  }

  /**
   * Add an LLM response (from zoom-stt queue)
   */
  addLLMResponse(sessionId: string, agent: string, text: string, timestamp: string | number): void {
    // Convert timestamp to number if it's a string
    const ts = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp;

    const entry: MeetingTranscriptEntry = {
      id: `llm-${Date.now()}-${Math.random()}`,
      speakerId: `${agent} (AI)`, // Format: "agent1 (AI)" so analyze API detects it as agent
      speakerRole: 'agent',
      text: text.trim(),
      timestamp: ts,
      sessionId,
    };

    const entries = this.transcripts.get(sessionId) || [];
    entries.push(entry);
    // Sort by timestamp to maintain chronological order
    entries.sort((a, b) => a.timestamp - b.timestamp);
    this.transcripts.set(sessionId, entries);

    console.log(`[Transcript Manager] 📝 Added LLM response: ${agent}: ${text.substring(0, 50)}...`);
  }

  /**
   * Get full transcript for a session in plain text format (for analyze API)
   */
  getPlainTextTranscript(sessionId: string): string {
    const entries = this.transcripts.get(sessionId) || [];
    return entries
      .map((entry) => `${entry.speakerId}: ${entry.text}`)
      .join('\n');
  }

  /**
   * Get full transcript in structured format (for analyze API JSON)
   */
  getStructuredTranscript(sessionId: string): {
    sessionId: string;
    segments: Array<{
      id: string;
      speakerId: string;
      speakerRole: 'student' | 'agent' | 'unknown';
      text: string;
      startTimeSeconds?: number;
    }>;
  } {
    const entries = this.transcripts.get(sessionId) || [];
    const startTime = entries.length > 0 ? entries[0].timestamp : Date.now();

    return {
      sessionId,
      segments: entries.map((entry, index) => ({
        id: entry.id,
        speakerId: entry.speakerId,
        speakerRole: entry.speakerRole,
        text: entry.text,
        startTimeSeconds: Math.floor((entry.timestamp - startTime) / 1000),
      })),
    };
  }

  /**
   * Get current session ID
   */
  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  /**
   * End a session (cleanup, but keep transcript for analysis)
   */
  endSession(sessionId: string): void {
    const entryCount = this.transcripts.get(sessionId)?.length || 0;
    console.log(`[Transcript Manager] 📝 Ended session: ${sessionId} (${entryCount} entries)`);
    
    if (this.currentSessionId === sessionId) {
      this.currentSessionId = null;
    }
    // Keep transcripts for analysis, don't delete
  }

  /**
   * Get transcript count for a session
   */
  getEntryCount(sessionId: string): number {
    return this.transcripts.get(sessionId)?.length || 0;
  }

  /**
   * Clear old sessions (optional cleanup)
   */
  clearSession(sessionId: string): void {
    this.transcripts.delete(sessionId);
    console.log(`[Transcript Manager] 🗑️ Cleared session: ${sessionId}`);
  }
}

// Singleton instance
export const meetingTranscriptManager = new MeetingTranscriptManager();
