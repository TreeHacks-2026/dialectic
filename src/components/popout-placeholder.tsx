"use client";

import { Layers, ArrowDownToLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PopoutPlaceholderProps {
  label: string;
  onRestore: () => void;
}

export default function PopoutPlaceholder({
  label,
  onRestore,
}: PopoutPlaceholderProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        "aspect-video rounded-xl border",
        "bg-white/60 backdrop-blur-xl border-slate-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
      )}
    >
      <Layers className="h-8 w-8 text-slate-400" />
      <p className="text-sm text-slate-500 text-center px-4">
        {label} is in floating overlay
      </p>
      <Button onClick={onRestore} variant="outline" size="sm" className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-50">
        <ArrowDownToLine className="h-4 w-4" />
        Restore to grid
      </Button>
    </div>
  );
}
