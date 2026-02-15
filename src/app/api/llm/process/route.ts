import { NextRequest, NextResponse } from 'next/server';

interface LLMProcessRequest {
  transcript: string;
  speaker: string;
  timestamp: number;
}

interface LLMProcessResponse {
  response: string;
  agent: 'agent1' | 'agent2' | 'agent3';
  processed_at: string;
}

/**
 * Mock LLM processing endpoint
 * In production, this would call your actual LLM service
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LLMProcessRequest;
    const { transcript, speaker } = body;

    if (!transcript || !speaker) {
      return NextResponse.json(
        { error: 'Transcript and speaker are required' },
        { status: 400 }
      );
    }

    // Mock LLM processing - simulate thinking time
    await new Promise(resolve => setTimeout(resolve, 500));

    // Determine which agent to use (round-robin based on speaker)
    const agents: Array<'agent1' | 'agent2' | 'agent3'> = ['agent1', 'agent2', 'agent3'];
    const agentIndex = speaker.charCodeAt(0) % agents.length;
    const agent = agents[agentIndex];

    // Mock LLM response - in production, this would be actual LLM call
    const mockResponse = `I heard "${transcript}" from ${speaker}. This is a mock LLM response that will be spoken by the avatar.`;

    const response: LLMProcessResponse = {
      response: mockResponse,
      agent,
      processed_at: new Date().toISOString(),
    };

    console.log(`[LLM Mock] Processed transcript from ${speaker}: ${transcript.substring(0, 50)}...`);
    console.log(`[LLM Mock] Assigned to ${agent}, response: ${mockResponse.substring(0, 50)}...`);

    return NextResponse.json(response);
  } catch (error) {
    console.error('[LLM Mock] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
