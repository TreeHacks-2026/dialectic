export interface TranscriptEvent {
  session_id: string;
  speaker_id: string;
  speaker_name: string;
  text: string;
  ts_ms: number;
  is_final: boolean;
}
