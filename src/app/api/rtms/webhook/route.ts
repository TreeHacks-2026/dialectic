import { NextRequest, NextResponse } from 'next/server';
// Import RTMSClient from source - Next.js will transpile it
import { RTMSClient } from '../../../../../packages/transcript-service/src/rtms-client';
import { meetingTranscriptManager } from '@/lib/meeting-transcript';
import { triggerMeetingAnalysis } from '@/lib/meeting-analysis';

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
      // Get session ID with proper fallback chain
      const sessionId = rtmsClient?.getCurrentSessionId() 
        || meetingTranscriptManager.getCurrentSessionId()
        || 'default-session';
      
      // Auto-start session if not started yet (safety net)
      if (!meetingTranscriptManager.getCurrentSessionId() && sessionId !== 'default-session') {
        console.log(`[RTMS API] ⚠️ Auto-starting session from first transcript: ${sessionId}`);
        meetingTranscriptManager.startSession(sessionId);
      }
      
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
          // Note: LLM response is automatically added to transcript by /api/zoom-stt POST handler
        }
      } catch (error) {
        console.error('[RTMS API] ❌ Error in LLM pipeline:', error);
      }
    }
  });

  // Listen for RTMS client events as SECONDARY/backup triggers
  // (Primary source is webhook events, but these provide redundancy)
  rtmsClient.on('connected', (streamId) => {
    console.log(`[RTMS API] 🔗 RTMS client connected event, stream ID: ${streamId}`);
    if (streamId) {
      // Only start session if not already started (webhook is primary)
      const currentSession = meetingTranscriptManager.getCurrentSessionId();
      if (currentSession !== streamId) {
        console.log(`[RTMS API] 📝 Starting session from client event (backup): ${streamId}`);
        meetingTranscriptManager.startSession(streamId);
      } else {
        console.log(`[RTMS API] ✅ Session ${streamId} already started (from webhook)`);
      }
    }
  });

  // Listen for meeting end as backup trigger
  rtmsClient.on('disconnected', async (streamId) => {
    console.log(`[RTMS API] 🔌 RTMS client disconnected event, stream ID: ${streamId}`);
    if (streamId) {
      // Check if analysis was already triggered by webhook
      const sessionId = streamId || meetingTranscriptManager.getCurrentSessionId();
      if (sessionId) {
        console.log(`[RTMS API] 🔍 Backup: Triggering analysis from disconnected event for session: ${sessionId}`);
        // Trigger analysis asynchronously (don't block)
        triggerMeetingAnalysis(sessionId).catch((error) => {
          console.error('[RTMS API] ❌ Error in backup analysis trigger:', error);
        });
        meetingTranscriptManager.endSession(sessionId);
      }
    }
  });

  rtmsClient.on('error', (error) => {
    console.error('[RTMS API] ❌ RTMS Error:', error.message);
  });

  return rtmsClient;
}


/**
 * Extract session ID from webhook payload (most reliable source)
 */
function extractSessionIdFromWebhook(webhookData: any): string | null {
  const payload = webhookData.payload || {};
  
  // Try rtms_stream_id first (most specific)
  if (payload.rtms_stream_id) {
    return payload.rtms_stream_id as string;
  }
  
  // Fallback to meeting_uuid
  if (payload.meeting_uuid) {
    return payload.meeting_uuid as string;
  }
  
  return null;
}

/**
 * POST handler for Zoom RTMS webhooks
 * Uses webhook events as PRIMARY source of truth for session lifecycle
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[RTMS API] 📥 Webhook request received');
    const webhookData = await request.json();
    const event = webhookData.event || 'unknown';
    const payload = webhookData.payload || {};
    
    console.log(`[RTMS API] 📥 Webhook event: ${event}`);
    console.log(`[RTMS API] 📥 Webhook payload keys:`, Object.keys(payload));
    
    // Extract session ID from webhook payload (most reliable)
    const sessionIdFromWebhook = extractSessionIdFromWebhook(webhookData);
    
    const client = getRTMSClient();
    
    // ============================================
    // PRIMARY: Handle meeting lifecycle via webhooks
    // ============================================
    
    if (event === 'meeting.rtms_started') {
      // Meeting started - start tracking session
      const sessionId = sessionIdFromWebhook || client.getCurrentSessionId() || 'unknown-session';
      
      console.log(`[RTMS API] 🟢 Meeting started - Session ID: ${sessionId}`);
      console.log(`[RTMS API] 📝 Starting transcript tracking for session: ${sessionId}`);
      
      // Clear any old data for this session (in case of restart)
      meetingTranscriptManager.clearSession(sessionId);
      
      // Start new session
      meetingTranscriptManager.startSession(sessionId);
      
      // Process webhook in RTMS client (establishes connection)
      client.handleWebhookEvent(webhookData);
      
      console.log(`[RTMS API] ✅ Session ${sessionId} initialized and ready for transcripts`);
    }
    else if (event === 'meeting.rtms_stopped') {
      // Meeting stopped - trigger analysis
      // Try multiple sources for session ID (in order of reliability)
      const sessionId = sessionIdFromWebhook 
        || client.getCurrentSessionId() 
        || meetingTranscriptManager.getCurrentSessionId()
        || null;
      
      if (sessionId) {
        console.log(`[RTMS API] 🔴 Meeting stopped - Session ID: ${sessionId}`);
        console.log(`[RTMS API] 🔍 Triggering analysis for session: ${sessionId}`);
        
        // Process webhook in RTMS client first (cleans up connections)
        client.handleWebhookEvent(webhookData);
        
        // Trigger analysis asynchronously (don't block webhook response)
        triggerMeetingAnalysis(sessionId).catch((error) => {
          console.error('[RTMS API] ❌ Error in async analysis:', error);
        });
      } else {
        console.warn('[RTMS API] ⚠️ Meeting stopped but no session ID found. Checking all active sessions...');
        
        // Fallback: analyze all active sessions
        const allSessions = meetingTranscriptManager.getAllActiveSessions();
        if (allSessions.length > 0) {
          console.log(`[RTMS API] 🔍 Found ${allSessions.length} active session(s), analyzing all...`);
          for (const sid of allSessions) {
            triggerMeetingAnalysis(sid).catch((error) => {
              console.error(`[RTMS API] ❌ Error analyzing session ${sid}:`, error);
            });
          }
        } else {
          console.warn('[RTMS API] ⚠️ No active sessions found to analyze');
        }
        
        // Still process webhook to clean up RTMS client
        client.handleWebhookEvent(webhookData);
      }
    }
    else {
      // Other events - just pass to RTMS client
      console.log(`[RTMS API] 📨 Processing non-lifecycle event: ${event}`);
      client.handleWebhookEvent(webhookData);
    }

    console.log(`[RTMS API] ✅ Webhook processed successfully`);
    return NextResponse.json({ 
      success: true,
      event,
      sessionId: sessionIdFromWebhook || client.getCurrentSessionId() || null
    });
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
    
    const currentSessionId = client.getCurrentSessionId() || meetingTranscriptManager.getCurrentSessionId();
    const activeSessions = meetingTranscriptManager.getAllActiveSessions();
    
    const status = {
      status: 'ok',
      rtms_configured: true,
      rtms_connected: client.isConnected(),
      session_id: currentSessionId,
      active_sessions: activeSessions,
      transcripts_received: transcriptQueue.length,
      transcript_entries: currentSessionId ? meetingTranscriptManager.getEntryCount(currentSessionId) : 0,
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
    const activeSessions = meetingTranscriptManager.getAllActiveSessions();
    
    const status = {
      status: 'ok',
      rtms_configured: false,
      rtms_connected: false,
      session_id: null,
      active_sessions: activeSessions,
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
