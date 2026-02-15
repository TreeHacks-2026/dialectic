"use client";

import React from "react";
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
