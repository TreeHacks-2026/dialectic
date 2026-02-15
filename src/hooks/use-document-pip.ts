"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseDocumentPiPReturn {
  isSupported: boolean;
  isOpen: boolean;
  pipWindow: Window | null;
  open: (width?: number, height?: number) => Promise<Window | null>;
  close: () => void;
}

function copyStyles(sourceDoc: Document, targetDoc: Document) {
  // Copy all stylesheets
  for (const sheet of Array.from(sourceDoc.styleSheets)) {
    try {
      if (sheet.cssRules) {
        const style = targetDoc.createElement("style");
        for (const rule of Array.from(sheet.cssRules)) {
          style.appendChild(targetDoc.createTextNode(rule.cssText));
        }
        targetDoc.head.appendChild(style);
      }
    } catch {
      // External stylesheets may throw SecurityError — copy via link instead
      if (sheet.href) {
        const link = targetDoc.createElement("link");
        link.rel = "stylesheet";
        link.href = sheet.href;
        targetDoc.head.appendChild(link);
      }
    }
  }

  // Copy :root CSS custom properties
  const rootStyles = sourceDoc.documentElement.style;
  if (rootStyles.length > 0) {
    const style = targetDoc.createElement("style");
    let css = ":root {";
    for (let i = 0; i < rootStyles.length; i++) {
      const prop = rootStyles[i];
      css += `${prop}: ${rootStyles.getPropertyValue(prop)};`;
    }
    css += "}";
    style.appendChild(targetDoc.createTextNode(css));
    targetDoc.head.appendChild(style);
  }

  // Also copy computed CSS custom properties from :root
  const computed = getComputedStyle(sourceDoc.documentElement);
  const customProps: string[] = [];
  for (let i = 0; i < computed.length; i++) {
    if (computed[i].startsWith("--")) {
      customProps.push(computed[i]);
    }
  }
  if (customProps.length > 0) {
    const style = targetDoc.createElement("style");
    let css = ":root {";
    for (const prop of customProps) {
      css += `${prop}: ${computed.getPropertyValue(prop)};`;
    }
    css += "}";
    style.appendChild(targetDoc.createTextNode(css));
    targetDoc.head.appendChild(style);
  }
}

export function useDocumentPiP(): UseDocumentPiPReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const pipWindowRef = useRef<Window | null>(null);

  useEffect(() => {
    setIsSupported("documentPictureInPicture" in window);
  }, []);

  const close = useCallback(() => {
    if (pipWindowRef.current) {
      pipWindowRef.current.close();
      pipWindowRef.current = null;
    }
    setPipWindow(null);
    setIsOpen(false);
  }, []);

  const open = useCallback(
    async (width = 400, height = 300): Promise<Window | null> => {
      if (!window.documentPictureInPicture) return null;

      // Close existing PiP window if open
      if (pipWindowRef.current) {
        pipWindowRef.current.close();
      }

      try {
        const win = await window.documentPictureInPicture!.requestWindow({
          width,
          height,
        });

        copyStyles(document, win.document);

        // Listen for user closing the PiP window
        win.addEventListener("pagehide", () => {
          pipWindowRef.current = null;
          setPipWindow(null);
          setIsOpen(false);
        });

        pipWindowRef.current = win;
        setPipWindow(win);
        setIsOpen(true);

        return win;
      } catch (err) {
        console.error("Failed to open Document PiP window:", err);
        return null;
      }
    },
    []
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pipWindowRef.current) {
        pipWindowRef.current.close();
        pipWindowRef.current = null;
      }
    };
  }, []);

  return { isSupported, isOpen, pipWindow, open, close };
}
