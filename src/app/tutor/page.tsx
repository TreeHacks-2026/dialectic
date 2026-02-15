"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import AvatarPanel, {
  type AvatarPanelHandle,
} from "@/components/avatar-panel";
import ChatPanel, { type ChatMessage } from "@/components/chat-panel";
import ChatInput from "@/components/chat-input";
import CourseSelector from "@/components/course-selector";
import { Separator } from "@/components/ui/separator";

export default function TutorPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const avatarPanelRef = useRef<AvatarPanelHandle>(null);

  const handleSend = useCallback(
    async (question: string) => {
      const userMsg: ChatMessage = { role: "user", content: question };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const chatHistory = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question,
            course_name: selectedCourse || undefined,
            chat_history: chatHistory,
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to get response");
        }

        const data = await res.json();
        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: data.answer,
          sources: data.sources,
        };

        setMessages((prev) => [...prev, assistantMsg]);

        // Make the avatar speak the response (fire-and-forget)
        avatarPanelRef.current?.speak(data.answer).catch(console.error);
      } catch (err) {
        console.error("Chat error:", err);
        const errorMsg: ChatMessage = {
          role: "assistant",
          content:
            "Sorry, I encountered an error processing your question. Please try again.",
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, selectedCourse]
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
        <CourseSelector
          selectedCourse={selectedCourse}
          onSelect={setSelectedCourse}
        />
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
