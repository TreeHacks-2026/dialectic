"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface ChatSource {
  filename: string;
  excerpt: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
}

interface ChatPanelProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

export default function ChatPanel({ messages, isLoading }: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Chat History</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto px-6 pb-4 space-y-4"
        >
          {messages.length === 0 && !isLoading && (
            <p className="text-sm text-muted-foreground text-center pt-8">
              Ask a question about your course materials to get started.
            </p>
          )}

          {messages.map((msg, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-start gap-2">
                <Badge
                  variant={msg.role === "user" ? "default" : "secondary"}
                  className="shrink-0 mt-0.5"
                >
                  {msg.role === "user" ? "You" : "Tutor"}
                </Badge>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </p>
              </div>

              {msg.sources && msg.sources.length > 0 && (
                <SourcesList sources={msg.sources} />
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-2">
              <Badge variant="secondary" className="shrink-0 mt-0.5">
                Tutor
              </Badge>
              <div className="flex gap-1 items-center pt-1">
                <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]" />
                <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]" />
                <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SourcesList({ sources }: { sources: ChatSource[] }) {
  return (
    <details className="ml-12 group">
      <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
        {sources.length} source{sources.length !== 1 ? "s" : ""} referenced
      </summary>
      <div className="mt-1 space-y-1.5">
        {sources.map((src, j) => (
          <div
            key={j}
            className="text-xs border rounded-md p-2 bg-muted/50 space-y-0.5"
          >
            <p className="font-medium">{src.filename}</p>
            <p className="text-muted-foreground line-clamp-2">{src.excerpt}</p>
          </div>
        ))}
      </div>
    </details>
  );
}
