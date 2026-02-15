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
        "border border-dashed border-slate-200/60",
        "bg-white/40 backdrop-blur-sm",
        "transition-all duration-300 ease-out",
        !disabled && [
          "hover:border-slate-300/80 hover:bg-white/70",
          "hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]",
          "hover:scale-[1.01] active:scale-[0.99]",
          "cursor-pointer group",
        ],
        disabled && "opacity-40 cursor-not-allowed"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center w-14 h-14 rounded-full",
          "bg-slate-100/60 border border-slate-200/60",
          "transition-all duration-300",
          !disabled && "group-hover:bg-slate-100 group-hover:border-slate-300/80 group-hover:scale-110"
        )}
      >
        <Plus className="w-6 h-6 text-slate-400 group-hover:text-slate-600 transition-colors duration-300" />
      </div>
      <span className="text-sm font-medium text-slate-400 group-hover:text-slate-600 transition-colors duration-300">
        Add Agent
      </span>
    </button>
  );
}
