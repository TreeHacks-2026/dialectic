import { NextResponse } from "next/server";

export async function POST() {
  const apiKey = process.env.HEYGEN_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "HEYGEN_API_KEY is not configured" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      "https://api.liveavatar.com/v1/sessions/token",
      {
        method: "POST",
        headers: {
          "X-API-KEY": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "FULL",
          avatar_id: "b6c94c07-e4e5-483e-8bec-e838d5910b7d",
          is_sandbox: false,
          avatar_persona: {
            voice_id: "4f3b1e99-b580-4f05-9b67-a5f585be0232",
            language: "en",
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("LiveAvatar API error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to create LiveAvatar session" },
        { status: response.status }
      );
    }

    const result = await response.json();
    const sessionToken = result.data?.session_token;
    const sessionId = result.data?.session_id;

    if (!sessionToken || !sessionId) {
      return NextResponse.json(
        { error: "No session token returned from LiveAvatar" },
        { status: 500 }
      );
    }

    return NextResponse.json({ session_token: sessionToken, session_id: sessionId });
  } catch (error) {
    console.error("LiveAvatar session error:", error);
    return NextResponse.json(
      { error: "Internal server error creating LiveAvatar session" },
      { status: 500 }
    );
  }
}
