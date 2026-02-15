import { NextRequest, NextResponse } from "next/server";

interface AgentRecord {
  id: string;
  label: string;
  registeredAt: string;
}

const agentRegistry: Map<string, AgentRecord> = new Map();

// GET /api/agents — list all active agents
export async function GET() {
  try {
    const agents = Array.from(agentRegistry.values());
    return NextResponse.json({ agents });
  } catch (error: unknown) {
    console.error("Agent registry GET error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/agents — register agent { id, label }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, label } = body;

    if (!id || typeof id !== "string" || id.trim().length === 0) {
      return NextResponse.json({ error: "Agent id is required" }, { status: 400 });
    }
    if (!label || typeof label !== "string" || label.trim().length === 0) {
      return NextResponse.json({ error: "Agent label is required" }, { status: 400 });
    }

    const record: AgentRecord = {
      id: id.trim(),
      label: label.trim(),
      registeredAt: new Date().toISOString(),
    };
    agentRegistry.set(record.id, record);

    return NextResponse.json({ success: true, agent: record });
  } catch (error: unknown) {
    console.error("Agent registry POST error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/agents — unregister agent { id }
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Agent id is required" }, { status: 400 });
    }

    const existed = agentRegistry.delete(id.trim());
    return NextResponse.json({ success: true, removed: existed });
  } catch (error: unknown) {
    console.error("Agent registry DELETE error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
