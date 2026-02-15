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
      "https://api.heygen.com/v1/streaming.create_token",
      {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("HeyGen API error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to create HeyGen session" },
        { status: response.status }
      );
    }

    const result = await response.json();
    const token = result.data?.token;

    if (!token) {
      return NextResponse.json(
        { error: "No token returned from HeyGen" },
        { status: 500 }
      );
    }

    return NextResponse.json({ access_token: token });
  } catch (error) {
    console.error("HeyGen session error:", error);
    return NextResponse.json(
      { error: "Internal server error creating HeyGen session" },
      { status: 500 }
    );
  }
}
