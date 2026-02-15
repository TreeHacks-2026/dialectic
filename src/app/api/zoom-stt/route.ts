import { NextRequest, NextResponse } from "next/server";

interface ZoomSttRequest {
  agent: string;
  speaker: string;
  text: string;
  timestamp?: string;
}

interface QueuedMessage {
  agent: string;
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
    const { agent, speaker, text, timestamp } = body;

    if (!agent || typeof agent !== "string" || agent.trim().length === 0) {
      return NextResponse.json(
        { error: "Agent is required and must be a non-empty string" },
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
      agent: agent.trim(),
      speaker: speaker.trim(),
      text: text.trim(),
      timestamp: timestamp ?? new Date().toISOString(),
    };

    messageQueue.push(entry);

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
