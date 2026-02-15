import { NextRequest, NextResponse } from 'next/server';
// Import RTMSClient from source - Next.js will transpile it
import { RTMSClient } from '../../../../../packages/transcript-service/src/rtms-client';
import { meetingTranscriptManager } from '@/lib/meeting-transcript';

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

  // Listen for transcript events and process through full pipeline
  rtmsClient.on('transcript', async (event) => {
    if (event.is_final) {
      console.log(`[RTMS API] 📝 Transcript: ${event.speaker_name}: ${event.text}`);
      
      // Store transcript in queue
      transcriptQueue.push({
        speaker_name: event.speaker_name,
        text: event.text,
        timestamp: event.ts_ms,
        is_final: event.is_final,
      });

      // Add to meeting transcript manager
      const sessionId = rtmsClient?.getCurrentSessionId() || 'default-session';
      meetingTranscriptManager.addUserTranscript(
        sessionId,
        event.speaker_name,
        event.text,
        event.ts_ms
      );

      // Send to LLM processing layer
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 
                      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                      process.env.RENDER_EXTERNAL_URL || 
                      'http://localhost:3000');

        console.log(`[RTMS API] 🔄 Sending to LLM processing layer...`);

        // Call LLM processing endpoint
        const llmResponse = await fetch(`${appUrl}/api/llm/process`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transcript: event.text,
            speaker: event.speaker_name,
            timestamp: event.ts_ms,
          }),
        });

        if (!llmResponse.ok) {
          const errorText = await llmResponse.text();
          console.error(`[RTMS API] ❌ LLM processing failed: ${llmResponse.status} ${errorText}`);
          return;
        }

        const llmResult = await llmResponse.json() as {
          response: string;
          agent: 'agent1' | 'agent2' | 'agent3';
          processed_at: string;
        };
        
        console.log(`[RTMS API] ✅ LLM processed, assigned to ${llmResult.agent}`);

        // Forward LLM output to /api/zoom-stt queue for avatars
        const sttResponse = await fetch(`${appUrl}/api/zoom-stt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agent: llmResult.agent,
            speaker: 'AI Assistant',
            text: llmResult.response,
            timestamp: llmResult.processed_at,
          }),
        });

        if (!sttResponse.ok) {
          const errorText = await sttResponse.text();
          console.error(`[RTMS API] ❌ Failed to queue for avatar: ${sttResponse.status} ${errorText}`);
        } else {
          console.log(`[RTMS API] ✅ Queued LLM response for ${llmResult.agent} avatar`);
          
          // Add LLM response to meeting transcript
          const sessionId = rtmsClient?.getCurrentSessionId() || 'default-session';
          meetingTranscriptManager.addLLMResponse(
            sessionId,
            llmResult.agent,
            llmResult.response,
            llmResult.processed_at
          );
        }
      } catch (error) {
        console.error('[RTMS API] ❌ Error in LLM pipeline:', error);
      }
    }
  });

  // Listen for meeting start to initialize transcript tracking
  rtmsClient.on('connected', (streamId) => {
    console.log(`[RTMS API] 🔗 RTMS connected, stream ID: ${streamId}`);
    if (streamId) {
      meetingTranscriptManager.startSession(streamId);
    }
  });

  // Listen for meeting end to trigger analysis
  rtmsClient.on('disconnected', async (streamId) => {
    console.log(`[RTMS API] 🔌 RTMS disconnected, stream ID: ${streamId}`);
    if (streamId) {
      await triggerMeetingAnalysis(streamId);
      meetingTranscriptManager.endSession(streamId);
    }
  });

  rtmsClient.on('error', (error) => {
    console.error('[RTMS API] ❌ RTMS Error:', error.message);
  });

  return rtmsClient;
}

/**
 * Trigger analysis when meeting ends
 */
async function triggerMeetingAnalysis(sessionId: string): Promise<void> {
  try {
    const entryCount = meetingTranscriptManager.getEntryCount(sessionId);
    if (entryCount === 0) {
      console.log(`[RTMS API] ⚠️ No transcripts to analyze for session ${sessionId}`);
      return;
    }

    console.log(`[RTMS API] 🔍 Meeting ended. Analyzing ${entryCount} transcript entries...`);

    // Get transcript in plain text format (works with analyze API)
    const plainText = meetingTranscriptManager.getPlainTextTranscript(sessionId);
    
    if (!plainText || plainText.trim().length === 0) {
      console.log(`[RTMS API] ⚠️ Empty transcript for session ${sessionId}`);
      return;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 
                  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                  process.env.RENDER_EXTERNAL_URL || 
                  'http://localhost:3000');

    // Call analyze API
    const analyzeResponse = await fetch(`${appUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rawText: plainText,
        sessionId: sessionId,
      }),
    });

    if (!analyzeResponse.ok) {
      const errorText = await analyzeResponse.text();
      console.error(`[RTMS API] ❌ Analysis failed: ${analyzeResponse.status} ${errorText}`);
      return;
    }

    const analysisResult = await analyzeResponse.json();
    console.log(`[RTMS API] ✅ Analysis complete for session ${sessionId}`);
    console.log(`[RTMS API] 📊 Analyzed ${analysisResult.results?.length || 0} students`);

    // Store analysis result (you can extend this to save to database or notify users)
    // For now, we just log it. You could emit an event or store it.
    
  } catch (error) {
    console.error('[RTMS API] ❌ Error triggering analysis:', error);
  }
}

/**
 * POST handler for Zoom RTMS webhooks
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[RTMS API] 📥 Webhook request received');
    const webhookData = await request.json();
    console.log(`[RTMS API] 📥 Webhook event: ${webhookData.event || 'unknown'}`);
    console.log(`[RTMS API] 📥 Webhook payload keys:`, Object.keys(webhookData.payload || {}));

    const client = getRTMSClient();
    const event = webhookData.event || 'unknown';
    
    // Handle meeting stopped event to trigger analysis
    if (event === 'meeting.rtms_stopped') {
      const sessionId = client.getCurrentSessionId();
      if (sessionId) {
        console.log(`[RTMS API] 🏁 Meeting stopped, triggering analysis for session: ${sessionId}`);
        // Trigger analysis asynchronously (don't wait for it)
        triggerMeetingAnalysis(sessionId).catch((error) => {
          console.error('[RTMS API] ❌ Error in async analysis:', error);
        });
      }
    }
    
    client.handleWebhookEvent(webhookData);

    console.log(`[RTMS API] ✅ Webhook processed successfully`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[RTMS API] ❌ Error processing webhook:', error);
    console.error('[RTMS API] ❌ Error stack:', error instanceof Error ? error.stack : 'No stack');
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
    console.log('[RTMS API] 📊 Status check requested');
    const client = getRTMSClient();
    
    const status = {
      status: 'ok',
      rtms_configured: true,
      rtms_connected: client.isConnected(),
      session_id: client.getCurrentSessionId(),
      transcripts_received: transcriptQueue.length,
      recent_transcripts: transcriptQueue.slice(-10), // Last 10 transcripts
      webhook_url: process.env.NEXT_PUBLIC_APP_URL || 
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                   process.env.RENDER_EXTERNAL_URL || 
                   'http://localhost:3000') + '/api/rtms/webhook',
    };
    
    console.log('[RTMS API] 📊 Status:', JSON.stringify(status, null, 2));
    return NextResponse.json(status);
  } catch (error) {
    // Return 200 for health check even if RTMS isn't configured
    // This allows the service to be marked as healthy
    const status = {
      status: 'ok',
      rtms_configured: false,
      rtms_connected: false,
      session_id: null,
      transcripts_received: transcriptQueue.length,
      recent_transcripts: [],
      message: error instanceof Error ? error.message : 'RTMS not configured',
      webhook_url: process.env.NEXT_PUBLIC_APP_URL || 
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                   process.env.RENDER_EXTERNAL_URL || 
                   'http://localhost:3000') + '/api/rtms/webhook',
    };
    console.log('[RTMS API] 📊 Status (not configured):', JSON.stringify(status, null, 2));
    return NextResponse.json(status);
  }
}
