"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { GripHorizontal, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingPanelProps {
  children: ReactNode;
  label: string;
  onClose: () => void;
  defaultPosition?: { x: number; y: number };
}

export default function FloatingPanel({
  children,
  label,
  onClose,
  defaultPosition = { x: 100, y: 100 },
}: FloatingPanelProps) {
  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0.8, x: defaultPosition.x, y: defaultPosition.y }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={cn(
        "fixed z-[9999] w-[360px] shadow-2xl rounded-xl border overflow-hidden",
        "bg-white/90 backdrop-blur-xl border-slate-200/60"
      )}
      style={{ top: 0, left: 0 }}
    >
      {/* Drag handle title bar */}
      <div
        className={cn(
          "flex items-center justify-between px-3 py-2",
          "bg-slate-50/80 border-b border-slate-200/60 cursor-grab active:cursor-grabbing"
        )}
      >
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <GripHorizontal className="h-4 w-4" />
          <span className="font-medium truncate">{label}</span>
        </div>
        <button
          onClick={onClose}
          className={cn(
            "p-1 rounded-md transition-colors",
            "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          )}
        >
          <Minimize2 className="h-4 w-4" />
        </button>
      </div>

      {/* Content area */}
      <div className="aspect-video">{children}</div>
    </motion.div>
  );
}
