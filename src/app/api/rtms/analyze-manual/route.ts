import { NextRequest, NextResponse } from 'next/server';
import { meetingTranscriptManager } from '@/lib/meeting-transcript';
import { triggerMeetingAnalysis } from '@/lib/meeting-analysis';

/**
 * Manual trigger endpoint for testing analysis
 * POST /api/rtms/analyze-manual
 * Body: { sessionId?: string } (optional - will analyze current session if not provided)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const sessionId = body.sessionId || meetingTranscriptManager.getCurrentSessionId();

    if (!sessionId) {
      const allSessions = meetingTranscriptManager.getAllActiveSessions();
      if (allSessions.length === 0) {
        return NextResponse.json(
          { error: 'No active sessions found. Start a meeting first.' },
          { status: 404 }
        );
      }
      
      // If no session ID provided and multiple sessions exist, return list
      return NextResponse.json({
        error: 'No session ID provided and no current session',
        availableSessions: allSessions,
        message: 'Provide a sessionId in the request body, or use one of the available sessions',
      }, { status: 400 });
    }

    const entryCount = meetingTranscriptManager.getEntryCount(sessionId);
    if (entryCount === 0) {
      return NextResponse.json(
        { error: `No transcripts found for session ${sessionId}` },
        { status: 404 }
      );
    }

    console.log(`[Manual Analysis] 🔍 Manually triggering analysis for session: ${sessionId}`);
    console.log(`[Manual Analysis] 📊 Session has ${entryCount} transcript entries`);

    // Trigger analysis
    await triggerMeetingAnalysis(sessionId);

    return NextResponse.json({
      success: true,
      message: `Analysis triggered for session ${sessionId}`,
      sessionId,
      entryCount,
    });
  } catch (error) {
    console.error('[Manual Analysis] ❌ Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET handler - list all active sessions
 */
export async function GET() {
  try {
    const allSessions = meetingTranscriptManager.getAllActiveSessions();
    const sessionsInfo = allSessions.map(sessionId => ({
      sessionId,
      entryCount: meetingTranscriptManager.getEntryCount(sessionId),
      currentSession: meetingTranscriptManager.getCurrentSessionId() === sessionId,
    }));

    return NextResponse.json({
      activeSessions: sessionsInfo,
      currentSession: meetingTranscriptManager.getCurrentSessionId(),
    });
  } catch (error) {
    console.error('[Manual Analysis] ❌ Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
