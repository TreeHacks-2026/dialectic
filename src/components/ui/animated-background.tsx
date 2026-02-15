"use client";

import React, { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export const DotPattern = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        "absolute inset-0 h-full w-full",
        className
      )}
      {...props}
    >
      <svg
        className="h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="dot-pattern"
            x="0"
            y="0"
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="2" r="1" fill="currentColor" opacity="0.15" />
          </pattern>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="url(#dot-pattern)"
        />
      </svg>
    </div>
  );
};

export const GridPattern = ({
  className,
  strokeDasharray = "0",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  strokeDasharray?: string;
}) => {
  return (
    <div
      className={cn(
        "absolute inset-0 h-full w-full",
        className
      )}
      {...props}
    >
      <svg
        className="h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="grid-pattern"
            width="32"
            height="32"
            patternUnits="userSpaceOnUse"
            x="0"
            y="0"
          >
            <path
              d="M0 32V.5H32"
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.06"
              strokeDasharray={strokeDasharray}
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-pattern)" />
      </svg>
    </div>
  );
};

export const AnimatedBeams = ({
  className,
}: {
  className?: string;
}) => {
  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      <div className="absolute left-0 top-0 h-px w-full animate-shimmer bg-gradient-to-r from-transparent via-purple-300/30 to-transparent" 
           style={{ animationDelay: "0s", animationDuration: "8s" }} />
      <div className="absolute left-0 top-1/4 h-px w-full animate-shimmer bg-gradient-to-r from-transparent via-blue-300/30 to-transparent"
           style={{ animationDelay: "2s", animationDuration: "10s" }} />
      <div className="absolute left-0 top-1/2 h-px w-full animate-shimmer bg-gradient-to-r from-transparent via-pink-300/30 to-transparent"
           style={{ animationDelay: "4s", animationDuration: "12s" }} />
      <div className="absolute left-0 top-3/4 h-px w-full animate-shimmer bg-gradient-to-r from-transparent via-purple-300/30 to-transparent"
           style={{ animationDelay: "6s", animationDuration: "9s" }} />
    </div>
  );
};

export const BackgroundGradientAnimation = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div className="absolute inset-0">
        <div className="absolute -left-1/4 -top-1/4 h-1/2 w-1/2 animate-blob rounded-full bg-purple-300 opacity-30 mix-blend-multiply blur-3xl" />
        <div className="animation-delay-2000 absolute -right-1/4 -top-1/4 h-1/2 w-1/2 animate-blob rounded-full bg-blue-300 opacity-30 mix-blend-multiply blur-3xl" />
        <div className="animation-delay-4000 absolute -bottom-1/4 left-1/4 h-1/2 w-1/2 animate-blob rounded-full bg-pink-300 opacity-30 mix-blend-multiply blur-3xl" />
      </div>
      {children}
    </div>
  );
};

export function AceternitBackground({
  children,
  className,
  interactive = true,
}: {
  children?: React.ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  const interactiveRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!interactive) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!interactiveRef.current) return;
      const rect = interactiveRef.current.getBoundingClientRect();
      interactiveRef.current.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
      interactiveRef.current.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
    };
    const el = interactiveRef.current;
    if (el) {
      el.addEventListener("mousemove", handleMouseMove);
      return () => el.removeEventListener("mousemove", handleMouseMove);
    }
  }, [interactive]);

  return (
    <div
      ref={interactiveRef}
      className={cn("absolute inset-0 overflow-hidden", className)}
    >
      <svg className="hidden">
        <defs>
          <filter id="blurMe">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8" result="goo" />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>
      <div
        className="h-full w-full blur-lg"
        style={{ filter: "url(#blurMe) blur(40px)" }}
      >
        {/* Cyan blob - moves vertically */}
        <div
          className="absolute animate-aceternity-vertical"
          style={{
            background: "radial-gradient(circle at center, rgba(6,182,212,0.5) 0, rgba(6,182,212,0) 50%) no-repeat",
            mixBlendMode: "hard-light",
            width: "80%",
            height: "80%",
            top: "calc(20% - 40%)",
            left: "calc(10% - 40%)",
          }}
        />
        {/* Blue blob - moves in circle reverse */}
        <div
          className="absolute animate-aceternity-circle-reverse"
          style={{
            background: "radial-gradient(circle at center, rgba(59,130,246,0.5) 0, rgba(59,130,246,0) 50%) no-repeat",
            mixBlendMode: "hard-light",
            width: "80%",
            height: "80%",
            top: "calc(60% - 40%)",
            left: "calc(80% - 40%)",
          }}
        />
        {/* Sky blob - moves in circle */}
        <div
          className="absolute animate-aceternity-circle"
          style={{
            background: "radial-gradient(circle at center, rgba(14,165,233,0.5) 0, rgba(14,165,233,0) 50%) no-repeat",
            mixBlendMode: "hard-light",
            width: "80%",
            height: "80%",
            top: "calc(70% - 40%)",
            left: "calc(20% - 40%)",
          }}
        />
        {/* Indigo blob - moves horizontally */}
        <div
          className="absolute animate-aceternity-horizontal"
          style={{
            background: "radial-gradient(circle at center, rgba(99,102,241,0.5) 0, rgba(99,102,241,0) 50%) no-repeat",
            mixBlendMode: "hard-light",
            width: "80%",
            height: "80%",
            top: "calc(30% - 40%)",
            left: "calc(60% - 40%)",
            opacity: 0.7,
          }}
        />
        {/* Cyan-400 blob - moves in circle */}
        <div
          className="absolute animate-aceternity-circle"
          style={{
            background: "radial-gradient(circle at center, rgba(34,211,238,0.5) 0, rgba(34,211,238,0) 50%) no-repeat",
            mixBlendMode: "hard-light",
            width: "80%",
            height: "80%",
            top: "calc(40% - 40%)",
            left: "calc(90% - 40%)",
          }}
        />
        {/* Interactive mouse-following blob */}
        {interactive && (
          <div
            className="absolute"
            style={{
              background: "radial-gradient(circle at center, rgba(56,189,248,0.4) 0, rgba(56,189,248,0) 50%) no-repeat",
              mixBlendMode: "hard-light",
              width: "100%",
              height: "100%",
              top: "calc(var(--mouse-y, 50%) - 50%)",
              left: "calc(var(--mouse-x, 50%) - 50%)",
              opacity: 0.5,
            }}
          />
        )}
      </div>
      {children}
    </div>
  );
}
