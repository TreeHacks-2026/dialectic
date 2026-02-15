import { NextRequest, NextResponse } from "next/server";
import { meetingTranscriptManager } from "@/lib/meeting-transcript";

interface ZoomSttRequest {
  agentId: string; // Changed from agent: "agent1" | "agent2" | "agent3"
  speaker: string;
  text: string;
  timestamp?: string;
}

interface QueuedMessage {
  agentId: string; // Changed from agent: "agent1" | "agent2" | "agent3"
  speaker: string;
  text: string;
  timestamp: string;
}

const messageQueue: QueuedMessage[] = [];

export async function GET() {
  try {
    const messages = [...messageQueue];
    messageQueue.length = 0;
    return NextResponse.json({ messages });
  } catch (error: unknown) {
    console.error("Zoom STT GET error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error fetching Zoom STT messages";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ZoomSttRequest;
    const { agentId, speaker, text, timestamp } = body;

    if (!agentId || typeof agentId !== "string" || agentId.trim().length === 0) {
      return NextResponse.json(
        { error: "agentId is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    if (!speaker || typeof speaker !== "string" || speaker.trim().length === 0) {
      return NextResponse.json(
        { error: "Speaker is required" },
        { status: 400 }
      );
    }

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    const entry: QueuedMessage = {
      agentId: agentId.trim(),
      speaker: speaker.trim(),
      text: text.trim(),
      timestamp: timestamp ?? new Date().toISOString(),
    };

    messageQueue.push(entry);

    // Also add to meeting transcript manager
    // Try to get current session ID from RTMS, or use a default
    const sessionId = meetingTranscriptManager.getCurrentSessionId() || 'default-session';
    // Use agentId as the agent identifier for transcript
    meetingTranscriptManager.addLLMResponse(sessionId, agentId, text, entry.timestamp);

    console.log(`[Zoom STT] ✅ Queued message for agent ID: ${agentId}`);

    return NextResponse.json({
      success: true,
      received: entry,
      message: "Zoom STT payload received successfully",
    });
  } catch (error: unknown) {
    console.error("Zoom STT error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error during Zoom STT processing";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
