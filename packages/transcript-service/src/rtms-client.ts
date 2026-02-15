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

  /**
   * Initialize RTMS client with credentials
   */
  initialize(config: RTMSConfig): void {
    this.rtmsConfig = config;
    console.log('[RTMS] Client initialized with credentials');
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

    console.log(`[RTMS] Generated signature: ${signature}`);
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
    console.log(`[RTMS] Connecting to media WebSocket: ${mediaUrl}`);
    const mediaWs = new WebSocket(mediaUrl);

    mediaWs.on('open', () => {
      console.log('[RTMS] Media WebSocket connected');
      const handshakeMsg = {
        msg_type: 3, // DATA_HAND_SHAKE_REQ
        protocol_version: 1,
        sequence: 0,
        meeting_uuid: meetingUuid,
        rtms_stream_id: rtmsStreamId,
        signature: this.generateSignature(meetingUuid, rtmsStreamId),
        media_type: 8 // TRANSCRIPT only
      };
      console.log('[RTMS] Sending transcript handshake:', JSON.stringify(handshakeMsg, null, 2));
      mediaWs.send(JSON.stringify(handshakeMsg));
    });

    mediaWs.on('message', (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString());
        
        // Handle media handshake response
        if (msg.msg_type === 4 && msg.status_code === 0) {
          console.log('[RTMS] ✅ Media handshake successful, sending CLIENT_READY_ACK');
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

          // Print to terminal (exact implementation)
          console.log(`\n💬 [${speakerName}]: ${transcriptText}\n`);

          // Emit transcript event
          const transcriptEvent: TranscriptEvent = {
            session_id: rtmsStreamId,
            speaker_id: msg.content?.user_id || 'unknown',
            speaker_name: speakerName,
            text: transcriptText,
            ts_ms: timestamp,
            is_final: true,
          };

          this.emit('transcript', transcriptEvent);
        }
        
        // Handle keep-alive
        else if (msg.msg_type === 12) { // KEEP_ALIVE_REQ
          console.log('[RTMS] Received KEEP_ALIVE_REQ, responding with KEEP_ALIVE_ACK');
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

    mediaWs.on('close', (code, reason) => {
      console.log(`[RTMS] Media WebSocket closed: ${code} ${reason}`);
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

    console.log(`[RTMS] Connecting to signaling WebSocket for meeting ${meetingUuid}`);
    const signalingWs = new WebSocket(serverUrls.signaling);

    signalingWs.on('open', () => {
      console.log(`[RTMS] Signaling WebSocket opened for meeting ${meetingUuid}`);

      const signature = this.generateSignature(meetingUuid, rtmsStreamId);

      const handshakeMsg = {
        msg_type: 1, // SIGNALING_HAND_SHAKE_REQ
        meeting_uuid: meetingUuid,
        rtms_stream_id: rtmsStreamId,
        signature
      };

      console.log('[RTMS] Sending handshake message:', JSON.stringify(handshakeMsg, null, 2));
      signalingWs.send(JSON.stringify(handshakeMsg));
    });

    signalingWs.on('message', (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString());
        
        // Handle signaling handshake response
        if (msg.msg_type === 2 && msg.status_code === 0) {
          console.log('[RTMS] ✅ Signaling handshake successful');
          const transcriptUrl = msg.media_server?.server_urls?.transcript;
          if (transcriptUrl) {
            this.connectToMediaWebSocket(transcriptUrl, meetingUuid, rtmsStreamId, signalingWs);
          } else {
            console.error('[RTMS] No transcript URL in media_server response');
          }
        }
        
        // Handle keep-alive requests
        else if (msg.msg_type === 12) { // KEEP_ALIVE_REQ
          console.log('[RTMS] Received KEEP_ALIVE_REQ, responding with KEEP_ALIVE_RESP');
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

    signalingWs.on('close', (code, reason) => {
      console.log(`[RTMS] Signaling WebSocket closed: ${code} ${reason}`);
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

    // Only log RTMS-related events
    if (event === 'meeting.rtms_started' || event === 'meeting.rtms_stopped') {
      console.log(`[RTMS] 🔍 Processing webhook event: ${event}`);
    }

    // Handle RTMS stopped
    if (event === 'meeting.rtms_stopped') {
      const meetingUuid = payload.meeting_uuid as string | undefined;
      console.log(`[RTMS] Stopping RTMS for meeting ${meetingUuid}`);

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
      console.log(`[RTMS] Disconnected from stream`);

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
      return;
    }

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
      // If it's a string, use it directly as the signaling URL
      console.log('[RTMS] server_urls is a string, using as signaling URL:', serverUrlsRaw);
      serverUrls = { signaling: serverUrlsRaw };
    } else if (serverUrlsRaw && typeof serverUrlsRaw === 'object') {
      serverUrls = serverUrlsRaw;
    } else {
      console.error('[RTMS] Invalid server_urls format:', serverUrlsRaw);
      return;
    }

    console.log(`[RTMS] Starting RTMS for meeting ${meetingUuid}, stream ${rtmsStreamId}`);

    this.currentStreamId = rtmsStreamId;
    this.currentMeetingUuid = meetingUuid;

    // Connect to signaling WebSocket to establish RTMS connection
    this.connectToSignalingWebSocket(meetingUuid, rtmsStreamId, serverUrls);

    this.emit('connected', rtmsStreamId);
    console.log(`[RTMS] ✅ Joining meeting with stream ID: ${rtmsStreamId}`);

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
    console.log(`[RTMS] Disconnected from stream: ${streamId}`);
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
