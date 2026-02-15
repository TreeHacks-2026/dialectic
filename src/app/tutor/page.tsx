"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import AvatarPanel, {
  type AvatarPanelHandle,
} from "@/components/avatar-panel";
import AddAgentCard from "@/components/add-agent-card";
import PopoutContainer from "@/components/popout-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const MAX_AGENTS = 6;

const BADGE_PALETTE = [
  { accent: "from-blue-500 to-cyan-400", badge: "bg-blue-50 text-blue-700 border-blue-200" },
  { accent: "from-purple-500 to-pink-400", badge: "bg-purple-50 text-purple-700 border-purple-200" },
  { accent: "from-emerald-500 to-teal-400", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { accent: "from-orange-500 to-amber-400", badge: "bg-orange-50 text-orange-700 border-orange-200" },
  { accent: "from-rose-500 to-red-400", badge: "bg-rose-50 text-rose-700 border-rose-200" },
];

interface AgentEntry {
  id: string;
  label: string;
  colorIndex: number;
}

interface SttMessage {
  agent: string;
  speaker: string;
  text: string;
  timestamp: string;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function TutorPage() {
  const [agents, setAgents] = useState<AgentEntry[]>([]);
  const agentRefsMap = useRef<Map<string, AvatarPanelHandle | null>>(new Map());
  const nextAgentNumber = useRef(1);
  const [poppedAgents, setPoppedAgents] = useState<Record<string, boolean>>({});
  const [speakingAgents, setSpeakingAgents] = useState<Record<string, boolean>>({});
  const [log, setLog] = useState<SttMessage[]>([]);
  const [polling, setPolling] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  const anySpeaking = useMemo(
    () => Object.values(speakingAgents).some(Boolean),
    [speakingAgents]
  );

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
          const handle = agentRefsMap.current.get(msg.agent);
          handle?.speak(msg.text);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [polling]);

  // Register / unregister agents with the API
  const registeredIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    for (const agent of agents) {
      if (!registeredIds.current.has(agent.id)) {
        registeredIds.current.add(agent.id);
        fetch("/api/agents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: agent.id, label: agent.label }),
        }).catch((err) => console.error("Failed to register agent:", err));
      }
    }
  }, [agents]);

  const addAgent = useCallback(() => {
    setAgents((prev) => {
      if (prev.length >= MAX_AGENTS) return prev;
      const num = nextAgentNumber.current++;
      return [
        ...prev,
        {
          id: generateId(),
          label: `Agent ${num}`,
          colorIndex: (num - 1) % BADGE_PALETTE.length,
        },
      ];
    });
  }, []);

  const removeAgent = useCallback((id: string) => {
    agentRefsMap.current.delete(id);
    registeredIds.current.delete(id);
    setPoppedAgents((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setAgents((prev) => prev.filter((a) => a.id !== id));

    fetch("/api/agents", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch((err) => console.error("Failed to unregister agent:", err));
  }, []);

  const togglePopout = useCallback((id: string) => {
    setPoppedAgents((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const restoreAgent = useCallback((id: string) => {
    setPoppedAgents((prev) => ({ ...prev, [id]: false }));
  }, []);

  const handleSpeakingChange = useCallback((agentId: string, speaking: boolean) => {
    setSpeakingAgents((prev) => ({ ...prev, [agentId]: speaking }));
  }, []);

  const handleRequestPiP = useCallback((agentId: string) => {
    const handle = agentRefsMap.current.get(agentId);
    handle?.requestPiP();
  }, []);

  const getAgentBadgeClass = (agentId: string): string => {
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) return BADGE_PALETTE[0].badge;
    return BADGE_PALETTE[agent.colorIndex % BADGE_PALETTE.length].badge;
  };

  const getAgentLabel = (agentId: string): string => {
    const agent = agents.find((a) => a.id === agentId);
    return agent?.label ?? agentId;
  };

  // Responsive grid columns based on visible (non-popped) items
  const visibleInGrid = agents.filter((a) => !poppedAgents[a.id]).length;
  const totalSlots = visibleInGrid + (agents.length < MAX_AGENTS ? 1 : 0);

  const gridColsClass = useMemo(() => {
    if (totalSlots <= 1) return "grid-cols-1 max-w-md mx-auto";
    if (totalSlots <= 2) return "grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto";
    if (totalSlots <= 4) return "grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto";
    return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
  }, [totalSlots]);

  return (
    <div className="flex flex-col h-screen font-[family-name:var(--font-geist-sans)] bg-gradient-to-br from-slate-50 via-white to-blue-50/30 text-slate-900 overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-blue-200/30 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-1/3 -right-32 w-[400px] h-[400px] bg-purple-200/20 rounded-full blur-[100px]" />
        <div className="absolute -bottom-32 left-1/3 w-[350px] h-[350px] bg-cyan-200/25 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-200/15 rounded-full blur-[150px]" />
      </div>

      {/* Top bar */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 flex items-center justify-between px-6 py-3.5 border-b border-slate-200/60 bg-white/60 backdrop-blur-2xl"
      >
        <Link
          href="/"
          className="text-lg font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent hover:from-slate-800 hover:to-slate-500 transition-all"
        >
          Dialectic
        </Link>
        <div className="flex items-center gap-5">
          <label className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors cursor-pointer">
            <input
              type="checkbox"
              checked={polling}
              onChange={(e) => setPolling(e.target.checked)}
              className="rounded bg-slate-100 border-slate-300 accent-blue-500"
            />
            Poll Zoom STT
          </label>
          <Link
            href="/test"
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            API Testing
          </Link>
        </div>
      </motion.header>

      {/* Avatars grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className={cn("relative z-10 grid gap-4 p-5", gridColsClass)}
      >
        <AnimatePresence mode="popLayout">
          {agents.map((agent) => {
            const isFocused = !!speakingAgents[agent.id];
            const isDimmed = anySpeaking && !isFocused && !poppedAgents[agent.id];

            return (
              <motion.div
                key={agent.id}
                layout
                initial={{ opacity: 0, scale: 0.85, y: 20 }}
                animate={{
                  opacity: isDimmed ? 0.5 : 1,
                  scale: isFocused ? 1.04 : isDimmed ? 0.96 : 1,
                  y: 0,
                  zIndex: isFocused ? 10 : 1,
                }}
                exit={{ opacity: 0, scale: 0.85, y: -10 }}
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                className={cn(
                  "relative",
                  isFocused && "z-10"
                )}
              >
                <AnimatePresence>
                  {isFocused && !poppedAgents[agent.id] && (
                    <motion.div
                      key="speaking-indicator"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-1.5 mb-2"
                    >
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
                      </span>
                      <span className="text-xs font-medium text-blue-600">Speaking...</span>
                    </motion.div>
                  )}
                </AnimatePresence>
                <PopoutContainer
                  label={agent.label}
                  isPopped={!!poppedAgents[agent.id]}
                  onTogglePopout={() => togglePopout(agent.id)}
                  onRestore={() => restoreAgent(agent.id)}
                  colorAccent={BADGE_PALETTE[agent.colorIndex % BADGE_PALETTE.length].accent}
                  isSpeaking={!!speakingAgents[agent.id]}
                  onRequestPiP={() => handleRequestPiP(agent.id)}
                >
                  <AvatarPanel
                    ref={(handle) => {
                      if (handle) agentRefsMap.current.set(agent.id, handle);
                      else agentRefsMap.current.delete(agent.id);
                    }}
                    id={agent.id}
                    label={agent.label}
                    colorAccent={BADGE_PALETTE[agent.colorIndex % BADGE_PALETTE.length].accent}
                    onRemove={() => removeAgent(agent.id)}
                    onRequestPopout={() => togglePopout(agent.id)}
                    isPoppedOut={!!poppedAgents[agent.id]}
                    onSpeakingChange={(speaking) => handleSpeakingChange(agent.id, speaking)}
                  />
                </PopoutContainer>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {agents.length < MAX_AGENTS && (
          <motion.div
            layout
            animate={{
              opacity: anySpeaking ? 0.4 : 1,
              scale: anySpeaking ? 0.96 : 1,
            }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
          >
            <AddAgentCard
              onClick={addAgent}
              disabled={agents.length >= MAX_AGENTS}
            />
          </motion.div>
        )}
      </motion.div>

      {/* Message log */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="relative z-10 flex-1 overflow-hidden px-5 pb-5"
      >
        <Card className="flex flex-col h-full bg-white/60 backdrop-blur-2xl border-slate-200/60 shadow-[0_8px_40px_rgba(0,0,0,0.06)] rounded-2xl">
          <CardHeader className="pb-3 px-5 pt-4">
            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Message Log</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <div className="h-full overflow-y-auto px-5 pb-4 space-y-2.5">
              {log.length === 0 && (
                <p className="text-sm text-slate-400 text-center pt-10">
                  Enable polling and send messages via the Zoom STT API to see
                  them here.
                </p>
              )}

              {log.map((msg, i) => {
                const isActiveSpeaker = !!speakingAgents[msg.agent];
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      "flex items-start gap-2.5 py-1.5 px-2 rounded-lg transition-colors duration-300",
                      isActiveSpeaker && "bg-blue-50/60"
                    )}
                  >
                    <span
                      className={cn(
                        "shrink-0 mt-0.5 px-2.5 py-0.5 text-xs font-medium rounded-full border",
                        getAgentBadgeClass(msg.agent)
                      )}
                    >
                      {getAgentLabel(msg.agent)}
                    </span>
                    <div className="text-sm">
                      <span className="font-medium text-slate-700">{msg.speaker}:</span>{" "}
                      <span className="text-slate-500">{msg.text}</span>
                    </div>
                  </motion.div>
                );
              })}

              <div ref={logEndRef} />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
