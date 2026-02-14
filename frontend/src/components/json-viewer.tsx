"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function JsonViewer({ data }: { data: unknown }) {
  const [open, setOpen] = useState(false);
  if (!data) return null;
  return (
    <div>
      <Button variant="link" size="sm" className="px-0" onClick={() => setOpen(!open)}>
        {open ? "Hide raw JSON" : "Show raw JSON"}
      </Button>
      {open && (
        <pre className="mt-2 max-h-96 overflow-auto rounded border bg-muted p-4 font-mono text-xs">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
