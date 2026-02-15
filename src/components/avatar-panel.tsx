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
import { X, PictureInPicture } from "lucide-react";
import { cn } from "@/lib/utils";

type AvatarStatus = "idle" | "connecting" | "connected" | "error";

export interface AvatarPanelHandle {
  speak: (text: string) => Promise<void>;
}

interface AvatarPanelProps {
  onReady?: () => void;
  avatarName?: string;
  label?: string;
  id?: string;
  onRemove?: () => void;
  onRequestPopout?: () => void;
  isPoppedOut?: boolean;
  colorAccent?: string;
}

const AvatarPanel = forwardRef<AvatarPanelHandle, AvatarPanelProps>(
  function AvatarPanel(
    {
      onReady,
      avatarName = "Wayne_20240711",
      label = "Avatar",
      onRemove,
      onRequestPopout,
      isPoppedOut,
      colorAccent = "from-blue-500 to-cyan-400",
    },
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
        const res = await fetch("/api/heygen/session", { method: "POST" });
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
    }, [avatarName, onReady]);

    const stopAvatar = useCallback(async () => {
      if (sessionRef.current) {
        await sessionRef.current.stop();
        sessionRef.current = null;
      }
      setStatus("idle");
    }, []);

    const handleRemove = useCallback(async () => {
      await stopAvatar();
      onRemove?.();
    }, [stopAvatar, onRemove]);

    useEffect(() => {
      return () => {
        sessionRef.current?.stop().catch(() => {});
      };
    }, []);

    return (
      <Card
        className={cn(
          "flex flex-col h-full relative group",
          "bg-white/5 backdrop-blur-xl border-white/10",
          "shadow-[0_8px_32px_rgba(0,0,0,0.3)]",
          "hover:border-white/20 transition-colors"
        )}
      >
        {/* Gradient accent line at top */}
        <div
          className={cn(
            "absolute top-0 left-0 right-0 h-[2px] rounded-t-xl bg-gradient-to-r",
            colorAccent
          )}
        />

        {/* Remove button */}
        {onRemove && (
          <button
            onClick={handleRemove}
            className={cn(
              "absolute top-2 right-2 z-10",
              "w-7 h-7 flex items-center justify-center",
              "rounded-full bg-black/40 backdrop-blur-sm",
              "text-white/60 hover:text-white hover:bg-red-500/80",
              "opacity-0 group-hover:opacity-100",
              "transition-all duration-200"
            )}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Popout button */}
        {onRequestPopout && status === "connected" && (
          <button
            onClick={onRequestPopout}
            className={cn(
              "absolute top-2 right-10 z-10",
              "w-7 h-7 flex items-center justify-center",
              "rounded-full bg-black/40 backdrop-blur-sm",
              "text-white/60 hover:text-white hover:bg-white/20",
              "opacity-0 group-hover:opacity-100",
              "transition-all duration-200"
            )}
          >
            <PictureInPicture className="w-3.5 h-3.5" />
          </button>
        )}

        <CardContent className="flex-1 flex flex-col items-center justify-center p-4 gap-3">
          <h3 className="text-sm font-medium text-white/60">{label}</h3>
          <div className="relative w-full aspect-video bg-black/30 rounded-lg overflow-hidden border border-white/5">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              autoPlay
            />

            {status === "idle" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40">
                <div className="text-4xl">🎓</div>
                <p className="text-sm text-white/40 text-center px-4">
                  Start the avatar to get a visual AI tutor experience
                </p>
                <Button
                  onClick={initAvatar}
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/10"
                >
                  Start Avatar
                </Button>
              </div>
            )}

            {status === "connecting" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/40 border-t-transparent" />
                <p className="text-sm text-white/40">
                  Connecting to avatar...
                </p>
              </div>
            )}

            {status === "error" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40">
                <p className="text-sm text-red-400 text-center px-4">
                  {errorMessage}
                </p>
                <Button
                  onClick={initAvatar}
                  variant="outline"
                  size="sm"
                  className="bg-white/5 hover:bg-white/10 text-white border-white/10"
                >
                  Retry
                </Button>
              </div>
            )}
          </div>

          {status === "connected" && (
            <Button
              onClick={stopAvatar}
              variant="outline"
              size="sm"
              className="bg-white/5 hover:bg-white/10 text-white border-white/10"
            >
              Stop Avatar
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }
);

export default AvatarPanel;
