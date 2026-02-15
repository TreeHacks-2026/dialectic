"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AvatarPanel, {
  type AvatarPanelHandle,
} from "@/components/avatar-panel";
import { Button } from "@/components/ui/button";
import { getDialogueConfig, clearDialogueConfig, type DialogueConfig } from "@/lib/dialogue-config";

interface SttMessage {
  agentId: string;
  speaker: string;
  text: string;
  timestamp: string;
}

export default function TutorPage() {
  const router = useRouter();
  const [config, setConfig] = useState<DialogueConfig | null>(null);
  const agentRefsMap = useRef<Map<string, React.RefObject<AvatarPanelHandle>>>(new Map());
  const [polling, setPolling] = useState(true); // Automatically enabled
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

      {/* Avatars grid - dynamically rendered, takes full remaining space */}
      <div className={`flex-1 grid gap-4 p-4 ${
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
    </div>
  );
}
