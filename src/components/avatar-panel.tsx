"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
} from "@heygen/streaming-avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type AvatarStatus = "idle" | "connecting" | "connected" | "error";

export interface AvatarPanelHandle {
  speak: (text: string) => Promise<void>;
}

interface AvatarPanelProps {
  onReady?: () => void;
}

const AvatarPanel = forwardRef<AvatarPanelHandle, AvatarPanelProps>(
  function AvatarPanel({ onReady }, ref) {
    const [status, setStatus] = useState<AvatarStatus>("idle");
    const [errorMessage, setErrorMessage] = useState("");
    const avatarRef = useRef<StreamingAvatar | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    useImperativeHandle(ref, () => ({
      async speak(text: string) {
        if (!avatarRef.current) return;
        try {
          await avatarRef.current.speak({ text });
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
        const { access_token } = await res.json();

        const avatar = new StreamingAvatar({ token: access_token });
        avatarRef.current = avatar;

        avatar.on(StreamingEvents.STREAM_READY, (event: unknown) => {
          const detail = (event as CustomEvent)?.detail;
          if (detail && videoRef.current) {
            videoRef.current.srcObject = detail as MediaStream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play().catch(console.error);
            };
          }
          setStatus("connected");
          onReady?.();
        });

        avatar.on(StreamingEvents.STREAM_DISCONNECTED, () => {
          setStatus("idle");
          if (videoRef.current) {
            videoRef.current.srcObject = null;
          }
        });

        await avatar.createStartAvatar({
          quality: AvatarQuality.Medium,
          avatarName: "Wayne_20240711",
        });
      } catch (err) {
        console.error("Avatar init error:", err);
        setErrorMessage(
          err instanceof Error ? err.message : "Failed to connect to avatar"
        );
        setStatus("error");
      }
    }, [onReady]);

    const stopAvatar = useCallback(async () => {
      if (avatarRef.current) {
        await avatarRef.current.stopAvatar();
        avatarRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setStatus("idle");
    }, []);

    useEffect(() => {
      return () => {
        avatarRef.current?.stopAvatar().catch(() => {});
      };
    }, []);

    return (
      <Card className="flex flex-col h-full">
        <CardContent className="flex-1 flex flex-col items-center justify-center p-4 gap-3">
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
