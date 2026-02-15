"use client";

import { type ReactNode, useRef, useState } from "react";
import { motion, useDragControls } from "framer-motion";
import { GripHorizontal, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingPanelProps {
  children: ReactNode;
  label: string;
  onClose: () => void;
  colorAccent?: string;
  defaultPosition?: { x: number; y: number };
}

export default function FloatingPanel({
  children,
  label,
  onClose,
  colorAccent,
  defaultPosition = { x: 100, y: 100 },
}: FloatingPanelProps) {
  const dragControls = useDragControls();
  const constraintsRef = useRef<HTMLDivElement>(null);
  const [minimized, setMinimized] = useState(false);

  return (
    <>
      {/* Viewport-sized drag constraints container */}
      <div
        ref={constraintsRef}
        className="fixed inset-0 pointer-events-none z-[9998]"
      />

      <motion.div
        drag
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        dragConstraints={constraintsRef}
        initial={{
          opacity: 0,
          scale: 0.9,
          y: 20,
          x: defaultPosition.x,
        }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className={cn(
          "fixed z-[9999] w-[400px] rounded-2xl border overflow-hidden",
          "bg-white/80 backdrop-blur-2xl border-white/40",
          "shadow-[0_8px_40px_rgba(0,0,0,0.08),0_2px_12px_rgba(0,0,0,0.04)]"
        )}
        style={{ top: defaultPosition.y, left: 0 }}
      >
        {/* Gradient accent line */}
        {colorAccent && (
          <div
            className={cn(
              "absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl bg-gradient-to-r",
              colorAccent
            )}
          />
        )}

        {/* Drag handle title bar */}
        <div
          onPointerDown={(e) => dragControls.start(e)}
          className={cn(
            "flex items-center justify-between px-3 py-2",
            "bg-white/60 backdrop-blur-sm border-b border-slate-200/40",
            "cursor-grab active:cursor-grabbing"
          )}
        >
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <GripHorizontal className="h-4 w-4" />
            <span className="font-medium truncate">{label}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setMinimized((prev) => !prev)}
              className={cn(
                "p-1 rounded-md transition-colors",
                "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              )}
            >
              {minimized ? (
                <Maximize2 className="h-4 w-4" />
              ) : (
                <Minimize2 className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Collapsible content area */}
        <motion.div
          animate={{ height: minimized ? 0 : "auto" }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          style={{ overflow: "hidden" }}
        >
          {children}
        </motion.div>
      </motion.div>
    </>
  );
}
