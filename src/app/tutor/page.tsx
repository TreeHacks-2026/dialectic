"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import AvatarPanel, {
  type AvatarPanelHandle,
} from "@/components/avatar-panel";
import ChatPanel, { type ChatMessage } from "@/components/chat-panel";
import ChatInput from "@/components/chat-input";
import { Separator } from "@/components/ui/separator";

export default function TutorPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const avatarPanelRef = useRef<AvatarPanelHandle>(null);

  const handleSend = useCallback(
    async (text: string) => {
      const userMsg: ChatMessage = { role: "user", content: text };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        await avatarPanelRef.current?.speak(text);
        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: `(Avatar spoke): "${text}"`,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        console.error("Avatar speak error:", err);
        const errorMsg: ChatMessage = {
          role: "assistant",
          content: "Avatar is not connected. Click 'Start Avatar' first.",
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

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
        <div className="flex gap-2">
          <Link href="/test" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            API Testing
          </Link>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden">
        {/* Left: Avatar */}
        <div className="p-4 flex flex-col overflow-hidden border-r">
          <AvatarPanel ref={avatarPanelRef} />
        </div>

        {/* Right: Chat history */}
        <div className="flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden p-4 pb-0">
            <ChatPanel messages={messages} isLoading={isLoading} />
          </div>
        </div>
      </div>

      {/* Bottom: Input */}
      <Separator />
      <div className="p-4">
        <ChatInput onSend={handleSend} disabled={isLoading} />
      </div>
    </div>
  );
}
