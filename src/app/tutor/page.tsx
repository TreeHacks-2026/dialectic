"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AvatarPanel, {
  type AvatarPanelHandle,
} from "@/components/avatar-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDialogueConfig, clearDialogueConfig, type DialogueConfig } from "@/lib/dialogue-config";

interface SttMessage {
  agentId: string; // Changed from agent: "agent1" | "agent2" | "agent3"
  speaker: string;
  text: string;
  timestamp: string;
}

export default function TutorPage() {
  const router = useRouter();
  const [config, setConfig] = useState<DialogueConfig | null>(null);
  const agentRefsMap = useRef<Map<string, React.RefObject<AvatarPanelHandle>>>(new Map());
  const [log, setLog] = useState<SttMessage[]>([]);
  const [polling, setPolling] = useState(true); // Automatically enabled
  const logEndRef = useRef<HTMLDivElement>(null);
  const [refsReady, setRefsReady] = useState(false);

  // Load configuration on mount
  useEffect(() => {
    const loadedConfig = getDialogueConfig();
    
    if (!loadedConfig || !loadedConfig.agents || loadedConfig.agents.length === 0) {
      console.warn('[Tutor] No dialogue config found, redirecting to home');
      router.push('/');
      return;
    }

    console.log('[Tutor] Loaded config with', loadedConfig.agents.length, 'agents');
    setConfig(loadedConfig);

    // Create refs dynamically for each agent
    const refs = new Map<string, React.RefObject<AvatarPanelHandle>>();
    loadedConfig.agents.forEach((agent) => {
      const ref = { current: null } as React.RefObject<AvatarPanelHandle>;
      refs.set(agent.id, ref);
    });
    agentRefsMap.current = refs;
    setRefsReady(true);
  }, [router]);

  // Auto-scroll the log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  // Polling loop
  useEffect(() => {
    if (!polling || !config || !refsReady) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/zoom-stt");
        if (!res.ok) return;
        const data = await res.json();
        const messages: SttMessage[] = data.messages ?? [];

        if (messages.length === 0) return;

        setLog((prev) => [...prev, ...messages]);

        // Route messages to correct avatar panels using agent IDs
        for (const msg of messages) {
          console.log(`[Tutor] 📨 Routing message to agent ID: "${msg.agentId}"`);
          console.log(`[Tutor] 📋 Available agent IDs in refs: ${Array.from(agentRefsMap.current.keys()).join(', ')}`);
          const ref = agentRefsMap.current.get(msg.agentId);
          if (ref?.current) {
            console.log(`[Tutor] ✅ Found ref for agent ID "${msg.agentId}", speaking: "${msg.text.substring(0, 50)}..."`);
            ref.current.speak(msg.text);
          } else {
            console.error(`[Tutor] ❌ No ref found for agent ID: "${msg.agentId}"`);
            console.error(`[Tutor] 🔍 Config agents: ${config?.agents.map(a => `${a.name} (${a.id})`).join(', ')}`);
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [polling, config, refsReady]);

  const agentBadgeColor = (agentId: string, index: number) => {
    const colors: Array<"default" | "secondary" | "outline"> = ["default", "secondary", "outline"];
    return colors[index % colors.length];
  };

  const getAgentName = (agentId: string): string => {
    return config?.agents.find(a => a.id === agentId)?.name || agentId;
  };

  const handleEndSession = () => {
    // Clear frontend session config to allow fresh start with different avatars
    clearDialogueConfig();
    console.log('[Tutor] 🗑️ Cleared dialogue config, returning to home');
    // Navigate back to home page
    router.push('/');
  };

  if (!config) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dialogue configuration...</p>
        </div>
      </div>
    );
  }

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
          <Button
            onClick={handleEndSession}
            variant="outline"
            size="sm"
          >
            End Session
          </Button>
        </div>
      </header>

      {/* Avatars grid - dynamically rendered */}
      <div className={`grid gap-4 p-4 ${
        config.agents.length === 1 ? 'grid-cols-1' :
        config.agents.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
        'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      }`}>
        {config.agents.map((agent) => {
          const ref = agentRefsMap.current.get(agent.id);
          return (
            <AvatarPanel
              key={agent.id}
              ref={ref || undefined}
              label={agent.name}
              avatarId={agent.heygen?.avatar_id}
              voiceId={agent.heygen?.voice_id}
            />
          );
        })}
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
                    variant={agentBadgeColor(msg.agentId, i) as "default" | "secondary" | "outline"}
                    className="shrink-0 mt-0.5"
                  >
                    {getAgentName(msg.agentId)}
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
