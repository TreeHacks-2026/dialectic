"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddAgentCardProps {
  onClick: () => void;
  disabled?: boolean;
}

export default function AddAgentCard({ onClick, disabled }: AddAgentCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        "aspect-video w-full rounded-2xl",
        "border border-dashed border-white/[0.08]",
        "bg-white/[0.02] backdrop-blur-sm",
        "transition-all duration-300 ease-out",
        !disabled && [
          "hover:border-white/20 hover:bg-white/[0.05]",
          "hover:shadow-[0_0_30px_rgba(59,130,246,0.08)]",
          "hover:scale-[1.01] active:scale-[0.99]",
          "cursor-pointer group",
        ],
        disabled && "opacity-40 cursor-not-allowed"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center w-14 h-14 rounded-full",
          "bg-white/[0.04] border border-white/[0.08]",
          "transition-all duration-300",
          !disabled && "group-hover:bg-white/[0.08] group-hover:border-white/15 group-hover:scale-110"
        )}
      >
        <Plus className="w-6 h-6 text-white/30 group-hover:text-white/60 transition-colors duration-300" />
      </div>
      <span className="text-sm font-medium text-white/30 group-hover:text-white/50 transition-colors duration-300">
        Add Agent
      </span>
    </button>
  );
}
