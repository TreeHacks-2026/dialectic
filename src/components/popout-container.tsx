"use client";

import { type ReactNode, useRef, useState, useEffect } from "react";
import { motion, useDragControls, useMotionValue } from "framer-motion";
import { GripHorizontal, Maximize2, Minimize2, MonitorUp, X } from "lucide-react";
import PopoutPlaceholder from "@/components/popout-placeholder";
import { cn } from "@/lib/utils";

interface PopoutContainerProps {
  children: ReactNode;
  label: string;
  isPopped: boolean;
  onTogglePopout: () => void;
  onRestore: () => void;
  colorAccent?: string;
  isSpeaking?: boolean;
  onRequestPiP?: () => void;
}

export default function PopoutContainer({
  children,
  label,
  isPopped,
  onTogglePopout,
  onRestore,
  colorAccent,
  isSpeaking,
  onRequestPiP,
}: PopoutContainerProps) {
  const dragControls = useDragControls();
  const constraintsRef = useRef<HTMLDivElement>(null);
  const [minimized, setMinimized] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Reset drag position and minimize state when restoring to grid
  useEffect(() => {
    if (!isPopped) {
      x.jump(0);
      y.jump(0);
      setMinimized(false);
    }
  }, [isPopped, x, y]);

  return (
    <>
      {/* Placeholder shown in grid when panel is popped out */}
      {isPopped && (
        <PopoutPlaceholder key="placeholder" label={label} onRestore={onRestore} />
      )}

      {/* Viewport-sized drag constraints */}
      {isPopped && (
        <div
          key="constraints"
          ref={constraintsRef}
          className="fixed inset-0 pointer-events-none z-[9998]"
        />
      )}

      {/* Panel wrapper -- key="panel" keeps React from ever unmounting this node */}
      <motion.div
        key="panel"
        drag={isPopped}
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        dragConstraints={isPopped ? constraintsRef : undefined}
        style={{ x, y }}
        animate={
          isPopped
            ? {
                scale: isSpeaking ? 1.03 : 1,
                boxShadow: isSpeaking
                  ? "0 8px 50px rgba(59,130,246,0.15), 0 2px 12px rgba(0,0,0,0.04)"
                  : "0 8px 40px rgba(0,0,0,0.08), 0 2px 12px rgba(0,0,0,0.04)",
              }
            : undefined
        }
        transition={{
          scale: { type: "spring", stiffness: 200, damping: 15 },
          boxShadow: { duration: 0.3 },
        }}
        className={cn(
          isPopped &&
            "fixed z-[9999] top-20 right-5 w-[400px] rounded-2xl border overflow-hidden bg-white/80 backdrop-blur-2xl border-white/40 shadow-[0_8px_40px_rgba(0,0,0,0.08),0_2px_12px_rgba(0,0,0,0.04)]",
          !isPopped && isSpeaking && "ring-2 ring-blue-400/40 ring-offset-1 rounded-2xl transition-shadow duration-300"
        )}
      >
        {/* Gradient accent line -- always in DOM, toggled via CSS */}
        <div
          className={cn(
            "absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl bg-gradient-to-r",
            colorAccent,
            isPopped ? "block" : "hidden"
          )}
        />

        {/* Drag-handle title bar -- always in DOM, toggled via CSS */}
        <div
          onPointerDown={(e) => {
            if (isPopped) dragControls.start(e);
          }}
          className={cn(
            "flex items-center justify-between px-3 py-2",
            "bg-white/60 backdrop-blur-sm border-b border-slate-200/40",
            "cursor-grab active:cursor-grabbing",
            isPopped ? "flex" : "hidden"
          )}
        >
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <GripHorizontal className="h-4 w-4" />
            <span className="font-medium truncate">{label}</span>
          </div>

          <div className="flex items-center gap-1">
            {onRequestPiP && (
              <button
                onClick={onRequestPiP}
                className="p-1 rounded-md transition-colors text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                title="Picture-in-Picture"
              >
                <MonitorUp className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => setMinimized((prev) => !prev)}
              className="p-1 rounded-md transition-colors text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              {minimized ? (
                <Maximize2 className="h-4 w-4" />
              ) : (
                <Minimize2 className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={onRestore}
              className="p-1 rounded-md transition-colors text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content wrapper -- animated height for minimize, children NEVER unmount */}
        <motion.div
          animate={{ height: isPopped && minimized ? 0 : "auto" }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          style={{ overflow: isPopped && minimized ? "hidden" : "visible" }}
        >
          {children}
        </motion.div>
      </motion.div>
    </>
  );
}
