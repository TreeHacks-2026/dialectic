import { NextRequest, NextResponse } from 'next/server';
import { RTMSClient } from '@dialectic/transcript-service';

// Singleton RTMS client
let rtmsClient: RTMSClient | null = null;

// In-memory storage for transcripts (you'll replace this with a database later)
const transcriptQueue: Array<{
  speaker_name: string;
  text: string;
  timestamp: number;
  is_final: boolean;
}> = [];

/**
 * Get or create RTMS client
 */
function getRTMSClient(): RTMSClient {
  if (rtmsClient) {
    return rtmsClient;
  }

  const clientId = process.env.ZM_RTMS_CLIENT || process.env.ZOOM_CLIENT_ID || '';
  const clientSecret = process.env.ZM_RTMS_SECRET || process.env.ZOOM_CLIENT_SECRET || '';

  if (!clientId || !clientSecret) {
    throw new Error('RTMS credentials not configured');
  }

  rtmsClient = new RTMSClient();
  rtmsClient.initialize({ clientId, clientSecret });

  console.log('[RTMS API] ✅ RTMS client initialized');

  // Listen for transcript events and store them
  rtmsClient.on('transcript', (event) => {
    if (event.is_final) {
      console.log(`[RTMS API] 📝 Transcript: ${event.speaker_name}: ${event.text}`);
      
      // Store transcript in queue (for future LLM processing)
      transcriptQueue.push({
        speaker_name: event.speaker_name,
        text: event.text,
        timestamp: event.ts_ms,
        is_final: event.is_final,
      });

      // TODO: Later, send to LLM processing layer here
      // For now, just store it
    }
  });

  rtmsClient.on('error', (error) => {
    console.error('[RTMS API] ❌ RTMS Error:', error.message);
  });

  return rtmsClient;
}

/**
 * POST handler for Zoom RTMS webhooks
 */
export async function POST(request: NextRequest) {
  try {
    const webhookData = await request.json();
    console.log(`[RTMS API] 📥 Webhook: ${webhookData.event || 'unknown'}`);

    const client = getRTMSClient();
    client.handleWebhookEvent(webhookData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[RTMS API] ❌ Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET handler - check RTMS status and view transcripts
 */
export async function GET() {
  try {
    const client = getRTMSClient();
    
    return NextResponse.json({
      status: 'ok',
      rtms_connected: client.isConnected(),
      session_id: client.getCurrentSessionId(),
      transcripts_received: transcriptQueue.length,
      recent_transcripts: transcriptQueue.slice(-10), // Last 10 transcripts
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
