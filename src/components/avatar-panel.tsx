"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  LiveAvatarSession,
  SessionEvent,
} from "@heygen/liveavatar-web-sdk";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type AvatarStatus = "idle" | "connecting" | "connected" | "error";

export interface AvatarPanelHandle {
  speak: (text: string) => Promise<void>;
}

interface AvatarPanelProps {
  onReady?: () => void;
  avatarName?: string;
  label?: string;
  avatarId?: string;
  voiceId?: string;
}

const AvatarPanel = forwardRef<AvatarPanelHandle, AvatarPanelProps>(
  function AvatarPanel(
    { onReady, avatarName = "Wayne_20240711", label = "Avatar", avatarId, voiceId },
    ref
  ) {
    const [status, setStatus] = useState<AvatarStatus>("idle");
    const [errorMessage, setErrorMessage] = useState("");
    const sessionRef = useRef<LiveAvatarSession | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    useImperativeHandle(ref, () => ({
      async speak(text: string) {
        if (!sessionRef.current) return;
        try {
          sessionRef.current.repeat(text);
        } catch (err) {
          console.error("Avatar speak error:", err);
        }
      },
    }));

    const initAvatar = useCallback(async () => {
      setStatus("connecting");
      setErrorMessage("");

      try {
        // Pass avatar_id and voice_id to session API if provided
        const res = await fetch("/api/heygen/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            avatar_id: avatarId,
            voice_id: voiceId,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to create session");
        }
        const { session_token } = await res.json();

        const session = new LiveAvatarSession(session_token, {
          voiceChat: false,
        });
        sessionRef.current = session;

        session.on(SessionEvent.SESSION_STREAM_READY, () => {
          console.log("[AvatarPanel] SESSION_STREAM_READY fired");
          if (videoRef.current) {
            session.attach(videoRef.current);
          }
          setStatus("connected");
          onReady?.();
        });

        session.on(SessionEvent.SESSION_DISCONNECTED, () => {
          setStatus("idle");
          sessionRef.current = null;
        });

        await session.start();
      } catch (err) {
        console.error("Avatar init error:", err);
        setErrorMessage(
          err instanceof Error ? err.message : "Failed to connect to avatar"
        );
        setStatus("error");
      }
    }, [avatarName, avatarId, voiceId, onReady]);

    const stopAvatar = useCallback(async () => {
      if (sessionRef.current) {
        await sessionRef.current.stop();
        sessionRef.current = null;
      }
      setStatus("idle");
    }, []);

    useEffect(() => {
      return () => {
        sessionRef.current?.stop().catch(() => {});
      };
    }, []);

    return (
      <Card className="flex flex-col h-full">
        <CardContent className="flex-1 flex flex-col items-center justify-center p-4 gap-3">
          <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
          <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              autoPlay
            />

            {status === "idle" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted">
                <div className="text-4xl">🎓</div>
                <p className="text-sm text-muted-foreground text-center px-4">
                  Start the avatar to get a visual AI tutor experience
                </p>
                <Button onClick={initAvatar} size="sm">
                  Start Avatar
                </Button>
              </div>
            )}

            {status === "connecting" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/80">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">
                  Connecting to avatar...
                </p>
              </div>
            )}

            {status === "error" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted">
                <p className="text-sm text-destructive text-center px-4">
                  {errorMessage}
                </p>
                <Button onClick={initAvatar} variant="outline" size="sm">
                  Retry
                </Button>
              </div>
            )}
          </div>

          {status === "connected" && (
            <Button onClick={stopAvatar} variant="outline" size="sm">
              Stop Avatar
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }
);

export default AvatarPanel;
