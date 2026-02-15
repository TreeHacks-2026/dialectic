"use client";

import { PictureInPicture2, ArrowDownToLine } from "lucide-react";
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
        "bg-white/5 backdrop-blur-xl border-white/10"
      )}
    >
      <PictureInPicture2 className="h-8 w-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground text-center px-4">
        {label} is in picture-in-picture mode
      </p>
      <Button onClick={onRestore} variant="outline" size="sm" className="gap-2">
        <ArrowDownToLine className="h-4 w-4" />
        Restore to grid
      </Button>
    </div>
  );
}
