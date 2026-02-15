import { EventEmitter } from 'events';
import { WebSocket } from 'ws';
import crypto from 'crypto';
import type { TranscriptEvent } from '../../shared/events.js';

interface RTMSConfig {
  clientId: string;
  clientSecret: string;
}

interface WebhookData {
  event: string;
  payload: {
    meeting_uuid?: string;
    rtms_stream_id?: string;
    server_urls?: {
      signaling?: string;
      transcript?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
}

/**
 * RTMS Client using raw WebSocket connections (matching exact implementation)
 * Connects via signaling WebSocket, then media WebSocket for transcripts
 */
export class RTMSClientWrapper extends EventEmitter {
  private rtmsConfig: RTMSConfig | null = null;
  private signalingWs: WebSocket | null = null;
  private mediaWs: WebSocket | null = null;
  private currentStreamId: string | null = null;
  private currentMeetingUuid: string | null = null;
  private connectionStatusCallback: ((message: {
    type: 'meeting_started' | 'meeting_stopped';
    streamId?: string;
    message: string;
  }) => void) | null = null;
  
  // Transcript buffer for 3-second timeout processing
  private transcriptBuffer: Map<string, {
    text: string;
    speaker: string;
    speakerId: string;
    timestamp: number;
    timeout: NodeJS.Timeout;
  }> = new Map();

  /**
   * Initialize RTMS client with credentials
   */
  initialize(config: RTMSConfig): void {
    this.rtmsConfig = config;
  }

  /**
   * Set callback for connection status updates
   */
  setConnectionStatusCallback(callback: (message: {
    type: 'meeting_started' | 'meeting_stopped';
    streamId?: string;
    message: string;
  }) => void): void {
    this.connectionStatusCallback = callback;
  }

  /**
   * Generate signature for RTMS authentication (exact implementation)
   */
  private generateSignature(meetingUuid: string, rtmsStreamId: string): string {
    if (!this.rtmsConfig) {
      throw new Error('RTMS client not initialized');
    }

    const message = `${this.rtmsConfig.clientId},${meetingUuid},${rtmsStreamId}`;
    const signature = crypto
      .createHmac('sha256', this.rtmsConfig.clientSecret)
      .update(message)
      .digest('hex');

    // Signature generation logged only in debug mode
    if (process.env.RTMS_DEBUG === 'true') {
      console.log(`[RTMS] Generated signature: ${signature}`);
    }
    return signature;
  }

  /**
   * Connect to media WebSocket for receiving transcript data (exact implementation)
   */
  private connectToMediaWebSocket(
    mediaUrl: string,
    meetingUuid: string,
    rtmsStreamId: string,
    signalingSocket: WebSocket
  ): void {
    const mediaWs = new WebSocket(mediaUrl);

    mediaWs.on('open', () => {
      const handshakeMsg = {
        msg_type: 3, // DATA_HAND_SHAKE_REQ
        protocol_version: 1,
        sequence: 0,
        meeting_uuid: meetingUuid,
        rtms_stream_id: rtmsStreamId,
        signature: this.generateSignature(meetingUuid, rtmsStreamId),
        media_type: 8 // TRANSCRIPT only
      };
      if (process.env.RTMS_DEBUG === 'true') {
        console.log('[RTMS] Sending transcript handshake:', JSON.stringify(handshakeMsg, null, 2));
      }
      mediaWs.send(JSON.stringify(handshakeMsg));
    });

    mediaWs.on('message', (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString());
        
        // Handle media handshake response
        if (msg.msg_type === 4 && msg.status_code === 0) {
          signalingSocket.send(JSON.stringify({
            msg_type: 7, // CLIENT_READY_ACK
            rtms_stream_id: rtmsStreamId
          }));
        }
        
        // Handle transcript data
        else if (msg.msg_type === 17) { // MEDIA_DATA_TRANSCRIPT
          const transcriptText = msg.content?.data || '';
          const speakerName = msg.content?.user_name || 'Unknown';
          const timestamp = msg.timestamp || Date.now();
          const speakerId = msg.content?.user_id || 'unknown';
          
          // Use Zoom's is_final if available, otherwise default to false for interim
          const isFinal = msg.content?.is_final ?? false;
          
          // Create a unique key for this speaker's current utterance
          const bufferKey = `${rtmsStreamId}-${speakerId}`;
          
          if (isFinal) {
            // If Zoom says it's final, process immediately
            // Clear any pending timeout for this speaker
            const existing = this.transcriptBuffer.get(bufferKey);
            if (existing) {
              clearTimeout(existing.timeout);
              this.transcriptBuffer.delete(bufferKey);
            }
            
            const transcriptEvent: TranscriptEvent = {
              session_id: rtmsStreamId,
              speaker_id: speakerId,
              speaker_name: speakerName,
              text: transcriptText,
              ts_ms: timestamp,
              is_final: true,
            };
            
            console.log(`[RTMS] ✅ Final transcript: ${speakerName}: ${transcriptText.substring(0, 50)}...`);
            this.emit('transcript', transcriptEvent);
          } else {
            // For interim transcripts, process immediately but mark as interim
            // Clear any pending timeout
            const existing = this.transcriptBuffer.get(bufferKey);
            if (existing) {
              clearTimeout(existing.timeout);
            }
            
            // Process interim transcript immediately
            const transcriptEvent: TranscriptEvent = {
              session_id: rtmsStreamId,
              speaker_id: speakerId,
              speaker_name: speakerName,
              text: transcriptText,
              ts_ms: timestamp,
              is_final: false,
            };
            
            console.log(`[RTMS] 📝 Interim transcript: ${speakerName}: ${transcriptText.substring(0, 50)}...`);
            this.emit('transcript', transcriptEvent);
            
            // Also buffer it with a short timeout (1 second) in case we need to process as final
            // if no final transcript arrives
            this.transcriptBuffer.set(bufferKey, {
              text: transcriptText,
              speaker: speakerName,
              speakerId: speakerId,
              timestamp: timestamp,
              timeout: setTimeout(() => {
                // After 1 second of no updates, process as final (fallback)
                const buffered = this.transcriptBuffer.get(bufferKey);
                if (buffered) {
                  const finalEvent: TranscriptEvent = {
                    session_id: rtmsStreamId,
                    speaker_id: buffered.speakerId,
                    speaker_name: buffered.speaker,
                    text: buffered.text,
                    ts_ms: buffered.timestamp,
                    is_final: true,
                  };
                  
                  console.log(`[RTMS] ⏱️ Processing buffered transcript as final after 1s: ${buffered.speaker}: ${buffered.text.substring(0, 50)}...`);
                  this.emit('transcript', finalEvent);
                  this.transcriptBuffer.delete(bufferKey);
                }
              }, 1000) // 1 second timeout (reduced from 3s)
            });
          }
        }
        
        // Handle keep-alive
        else if (msg.msg_type === 12) { // KEEP_ALIVE_REQ
              // Handle keep-alive silently
          mediaWs.send(JSON.stringify({
            msg_type: 13, // KEEP_ALIVE_ACK
            timestamp: msg.timestamp
          }));
        }
      } catch (error) {
        console.error('[RTMS] Error parsing media message:', error);
      }
    });

    mediaWs.on('error', (error) => {
      console.error('[RTMS] Media WebSocket error:', error);
      this.emit('error', error);
    });

    mediaWs.on('close', () => {
      this.mediaWs = null;
    });

    this.mediaWs = mediaWs;
  }

  /**
   * Connect to signaling WebSocket (exact implementation)
   */
  private connectToSignalingWebSocket(
    meetingUuid: string,
    rtmsStreamId: string,
    serverUrls: { signaling?: string; [key: string]: unknown }
  ): void {
    if (!serverUrls.signaling) {
      console.error('[RTMS] No signaling URL provided');
      return;
    }

    const signalingWs = new WebSocket(serverUrls.signaling);

    signalingWs.on('open', () => {

      const signature = this.generateSignature(meetingUuid, rtmsStreamId);

      const handshakeMsg = {
        msg_type: 1, // SIGNALING_HAND_SHAKE_REQ
        meeting_uuid: meetingUuid,
        rtms_stream_id: rtmsStreamId,
        signature
      };

      if (process.env.RTMS_DEBUG === 'true') {
        console.log('[RTMS] Sending handshake message:', JSON.stringify(handshakeMsg, null, 2));
      }
      signalingWs.send(JSON.stringify(handshakeMsg));
    });

    signalingWs.on('message', (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString());
        
        // Handle signaling handshake response
        if (msg.msg_type === 2 && msg.status_code === 0) {
          const transcriptUrl = msg.media_server?.server_urls?.transcript;
          if (transcriptUrl) {
            this.connectToMediaWebSocket(transcriptUrl, meetingUuid, rtmsStreamId, signalingWs);
          } else {
            console.error('[RTMS] No transcript URL in media_server response');
          }
        }
        
        // Handle keep-alive requests
        else if (msg.msg_type === 12) { // KEEP_ALIVE_REQ
          // Handle keep-alive silently
          signalingWs.send(JSON.stringify({
            msg_type: 13, // KEEP_ALIVE_RESP
            timestamp: msg.timestamp
          }));
        }
      } catch (error) {
        console.error('[RTMS] Error parsing signaling message:', error);
      }
    });

    signalingWs.on('error', (error) => {
      console.error('[RTMS] Signaling WebSocket error:', error);
      this.emit('error', error);
    });

    signalingWs.on('close', () => {
      this.signalingWs = null;
    });

    this.signalingWs = signalingWs;
  }

  /**
   * Handle webhook events (exact implementation)
   */
  handleWebhookEvent(webhookData: WebhookData): void {
    const event = webhookData.event;
    const payload = webhookData.payload;

    // Handle RTMS stopped
    if (event === 'meeting.rtms_stopped') {
      const meetingUuid = payload.meeting_uuid as string | undefined;

      // Close connections
      if (this.mediaWs) {
        this.mediaWs.close();
        this.mediaWs = null;
      }
      if (this.signalingWs) {
        this.signalingWs.close();
        this.signalingWs = null;
      }

      this.currentStreamId = null;
      this.currentMeetingUuid = null;

      this.emit('disconnected', this.currentStreamId);

      // Notify frontend
      const stoppedStreamId = this.currentStreamId;
      if (this.connectionStatusCallback) {
        this.connectionStatusCallback({
          type: 'meeting_stopped',
          streamId: stoppedStreamId || undefined,
          message: 'Meeting RTMS stream has stopped',
        });
      }
      return;
    }

    // Handle RTMS started - ignore non-RTMS events
    if (event !== 'meeting.rtms_started') {
      console.log(`[RTMS] Ignoring non-RTMS event: ${event}`);
      return;
    }
    
    console.log(`[RTMS] 🔍 Processing meeting.rtms_started event`);

    // Check if credentials are initialized
    if (!this.rtmsConfig) {
      console.error('[RTMS] Client not initialized with credentials. Call initialize() first.');
      return;
    }

    const meetingUuid = payload.meeting_uuid as string | undefined;
    const rtmsStreamId = payload.rtms_stream_id as string | undefined;
    const serverUrlsRaw = payload.server_urls as string | { signaling?: string; [key: string]: unknown } | undefined;

    if (!meetingUuid || !rtmsStreamId || !serverUrlsRaw) {
      console.error('[RTMS] Missing required fields in webhook payload:', {
        meeting_uuid: meetingUuid,
        rtms_stream_id: rtmsStreamId,
        server_urls: serverUrlsRaw
      });
      return;
    }

    // Handle server_urls as either string or object (Zoom sends it as string)
    let serverUrls: { signaling?: string; [key: string]: unknown };
    if (typeof serverUrlsRaw === 'string') {
      serverUrls = { signaling: serverUrlsRaw };
    } else if (serverUrlsRaw && typeof serverUrlsRaw === 'object') {
      serverUrls = serverUrlsRaw;
    } else {
      console.error('[RTMS] Invalid server_urls format:', serverUrlsRaw);
      return;
    }

    this.currentStreamId = rtmsStreamId;
    this.currentMeetingUuid = meetingUuid;

    console.log(`[RTMS] 🔗 Connecting to RTMS for meeting ${meetingUuid}, stream ${rtmsStreamId}`);
    
    // Connect to signaling WebSocket to establish RTMS connection
    this.connectToSignalingWebSocket(meetingUuid, rtmsStreamId, serverUrls);

    this.emit('connected', rtmsStreamId);
    console.log(`[RTMS] ✅ Connection initiated`);

    // Notify frontend
    if (this.connectionStatusCallback) {
      this.connectionStatusCallback({
        type: 'meeting_started',
        streamId: rtmsStreamId,
        message: 'Meeting RTMS stream has started',
      });
    }
  }

  /**
   * Disconnect from RTMS session
   */
  disconnect(streamId: string): void {
    // Clear any pending transcript timeouts for this stream
    for (const [key, buffered] of this.transcriptBuffer.entries()) {
      if (key.startsWith(`${streamId}-`)) {
        clearTimeout(buffered.timeout);
        this.transcriptBuffer.delete(key);
      }
    }
    
    if (this.mediaWs) {
      this.mediaWs.close();
      this.mediaWs = null;
    }
    if (this.signalingWs) {
      this.signalingWs.close();
      this.signalingWs = null;
    }
    if (this.currentStreamId === streamId) {
      this.currentStreamId = null;
      this.currentMeetingUuid = null;
    }
  }

  /**
   * Check if connected to RTMS
   */
  isConnected(): boolean {
    return this.currentStreamId !== null && this.signalingWs !== null;
  }

  /**
   * Get current session ID
   */
  getCurrentSessionId(): string | null {
    return this.currentStreamId;
  }
}

// Export as RTMSClient for backward compatibility
export { RTMSClientWrapper as RTMSClient };
