import { NextRequest, NextResponse } from 'next/server';
import { storeSessionConfig, getSessionConfig, clearSessionConfig, migratePendingConfigToSession } from '@/lib/session-config-storage';

/**
 * POST: Store dialogue configuration for a session
 * Body: { sessionId: string, meetingId?: string, agents: Array<{...}> }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, meetingId, agents } = body;

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json(
        { error: 'sessionId is required and must be a string' },
        { status: 400 }
      );
    }

    if (!agents || !Array.isArray(agents) || agents.length === 0) {
      return NextResponse.json(
        { error: 'agents is required and must be a non-empty array' },
        { status: 400 }
      );
    }

    // Check if this is a pending config (temp session ID)
    const isPending = sessionId.startsWith('temp-');
    storeSessionConfig(sessionId, meetingId, agents, isPending);

    return NextResponse.json({
      success: true,
      message: `Configuration stored for session ${sessionId}`,
      sessionId,
      agentCount: agents.length,
    });
  } catch (error) {
    console.error('[Dialogue Config API] ❌ Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET: Retrieve dialogue configuration for a session
 * Query: ?sessionId=...
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId query parameter is required' },
        { status: 400 }
      );
    }

    const config = getSessionConfig(sessionId);

    if (!config) {
      return NextResponse.json(
        { error: `No configuration found for session ${sessionId}` },
        { status: 404 }
      );
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('[Dialogue Config API] ❌ Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Clear dialogue configuration for a session
 * Query: ?sessionId=...
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId query parameter is required' },
        { status: 400 }
      );
    }

    clearSessionConfig(sessionId);

    return NextResponse.json({
      success: true,
      message: `Configuration cleared for session ${sessionId}`,
    });
  } catch (error) {
    console.error('[Dialogue Config API] ❌ Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
