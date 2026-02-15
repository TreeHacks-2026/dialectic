"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import AvatarPanel, {
  type AvatarPanelHandle,
} from "@/components/avatar-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SttMessage {
  agent: "agent1" | "agent2" | "agent3";
  speaker: string;
  text: string;
  timestamp: string;
}

export default function TutorPage() {
  const agent1Ref = useRef<AvatarPanelHandle>(null);
  const agent2Ref = useRef<AvatarPanelHandle>(null);
  const agent3Ref = useRef<AvatarPanelHandle>(null);
  const [log, setLog] = useState<SttMessage[]>([]);
  const [polling, setPolling] = useState(true); // Automatically enabled
  const logEndRef = useRef<HTMLDivElement>(null);

  const agentRefs: Record<string, React.RefObject<AvatarPanelHandle | null>> = {
    agent1: agent1Ref,
    agent2: agent2Ref,
    agent3: agent3Ref,
  };

  // Auto-scroll the log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  // Polling loop
  useEffect(() => {
    if (!polling) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/zoom-stt");
        if (!res.ok) return;
        const data = await res.json();
        const messages: SttMessage[] = data.messages ?? [];

        if (messages.length === 0) return;

        setLog((prev) => [...prev, ...messages]);

        for (const msg of messages) {
          const ref = agentRefs[msg.agent];
          ref?.current?.speak(msg.text);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [polling]);

  const agentBadgeColor = (agent: string) => {
    switch (agent) {
      case "agent1":
        return "default";
      case "agent2":
        return "secondary";
      case "agent3":
        return "outline";
      default:
        return "default";
    }
  };

  return (
    <div className="flex flex-col h-screen font-[family-name:var(--font-geist-sans)]">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-3 border-b">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight hover:opacity-80 transition-opacity"
        >
          Dialectic
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Poll Zoom STT: Enabled
          </span>
        </div>
      </header>

      {/* Avatars grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
        <AvatarPanel ref={agent1Ref} label="Agent 1" />
        <AvatarPanel ref={agent2Ref} label="Agent 2" />
        <AvatarPanel ref={agent3Ref} label="Agent 3" />
      </div>

      {/* Message log */}
      <div className="flex-1 overflow-hidden px-4 pb-4">
        <Card className="flex flex-col h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Message Log</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <div className="h-full overflow-y-auto px-6 pb-4 space-y-3">
              {log.length === 0 && (
                <p className="text-sm text-muted-foreground text-center pt-8">
                  Enable polling and send messages via the Zoom STT API to see
                  them here.
                </p>
              )}

              {log.map((msg, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Badge
                    variant={agentBadgeColor(msg.agent) as "default" | "secondary" | "outline"}
                    className="shrink-0 mt-0.5"
                  >
                    {msg.agent}
                  </Badge>
                  <div className="text-sm">
                    <span className="font-medium">{msg.speaker}:</span>{" "}
                    <span className="text-muted-foreground">{msg.text}</span>
                  </div>
                </div>
              ))}

              <div ref={logEndRef} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
