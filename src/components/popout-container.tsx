"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence } from "framer-motion";
import { useDocumentPiP } from "@/hooks/use-document-pip";
import FloatingPanel from "@/components/floating-panel";
import PopoutPlaceholder from "@/components/popout-placeholder";

interface PopoutContainerProps {
  children: ReactNode;
  label: string;
  isPopped: boolean;
  onTogglePopout: () => void;
  onRestore: () => void;
}

export default function PopoutContainer({
  children,
  label,
  isPopped,
  onTogglePopout,
  onRestore,
}: PopoutContainerProps) {
  const pip = useDocumentPiP();
  const hasOpened = useRef(false);

  // Open PiP window when isPopped becomes true
  useEffect(() => {
    if (!isPopped) {
      hasOpened.current = false;
      if (pip.isOpen) {
        pip.close();
      }
      return;
    }

    if (hasOpened.current) return;

    if (pip.isSupported) {
      hasOpened.current = true;
      pip.open(400, 300).then((win) => {
        if (!win) {
          // PiP failed to open — restore immediately
          onRestore();
        }
      });
    }
  }, [isPopped, pip.isSupported]);

  // Handle PiP window closed by user (pagehide fires, isOpen becomes false)
  useEffect(() => {
    if (isPopped && hasOpened.current && !pip.isOpen && pip.isSupported) {
      onRestore();
    }
  }, [pip.isOpen, isPopped, pip.isSupported, onRestore]);

  // Not popped — render children normally
  if (!isPopped) {
    return <>{children}</>;
  }

  // Popped + PiP supported + window open — portal into PiP window
  if (pip.isSupported && pip.pipWindow) {
    return (
      <>
        <PopoutPlaceholder label={label} onRestore={onRestore} />
        {createPortal(children, pip.pipWindow.document.body)}
      </>
    );
  }

  // Popped + PiP supported but window not yet open — show placeholder while opening
  if (pip.isSupported && !pip.pipWindow) {
    return <PopoutPlaceholder label={label} onRestore={onRestore} />;
  }

  // Popped + PiP not supported — use floating panel fallback
  return (
    <>
      <PopoutPlaceholder label={label} onRestore={onRestore} />
      <AnimatePresence>
        <FloatingPanel label={label} onClose={onRestore}>
          {children}
        </FloatingPanel>
      </AnimatePresence>
    </>
  );
}
