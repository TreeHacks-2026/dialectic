import { NextRequest, NextResponse } from "next/server";

interface ZoomSttRequest {
  speaker: string;
  text: string;
  timestamp?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ZoomSttRequest;
    const { speaker, text, timestamp } = body;

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

    return NextResponse.json({
      success: true,
      received: {
        speaker: speaker.trim(),
        text: text.trim(),
        timestamp: timestamp ?? new Date().toISOString(),
      },
      message: "Zoom STT payload received successfully",
    });
  } catch (error: unknown) {
    console.error("Zoom STT error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error during Zoom STT processing";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
