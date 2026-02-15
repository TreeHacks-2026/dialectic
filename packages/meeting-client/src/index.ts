/**
 * Meeting connection layer: join Zoom (or LiveKit) as participant,
 * send/receive audio. Used by each agent runtime.
 */

export interface MeetingJoinConfig {
  meetingUrl: string;
  participantDisplayName: string;
}

export interface MeetingClient {
  join(config: MeetingJoinConfig): Promise<void>;
  leave(): Promise<void>;
  onAudioIn(cb: (audioChunk: ArrayBuffer) => void): void;
  sendAudio(audioChunk: ArrayBuffer): Promise<void>;
}

// Stub: implement with Zoom Meeting SDK or LiveKit.
export function createMeetingClient(): MeetingClient {
  return {
    async join() {
      console.warn('Meeting client stub: join not implemented');
    },
    async leave() {},
    onAudioIn() {},
    async sendAudio() {},
  };
}
