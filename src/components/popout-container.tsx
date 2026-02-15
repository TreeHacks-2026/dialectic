"use client";

import { type ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import FloatingPanel from "@/components/floating-panel";
import PopoutPlaceholder from "@/components/popout-placeholder";

interface PopoutContainerProps {
  children: ReactNode;
  label: string;
  isPopped: boolean;
  onTogglePopout: () => void;
  onRestore: () => void;
  colorAccent?: string;
}

export default function PopoutContainer({
  children,
  label,
  isPopped,
  onTogglePopout,
  onRestore,
  colorAccent,
}: PopoutContainerProps) {
  if (!isPopped) {
    return <>{children}</>;
  }

  return (
    <>
      <PopoutPlaceholder label={label} onRestore={onRestore} />
      <AnimatePresence>
        <FloatingPanel label={label} onClose={onRestore} colorAccent={colorAccent}>
          {children}
        </FloatingPanel>
      </AnimatePresence>
    </>
  );
}
