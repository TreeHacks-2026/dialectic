"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import type { TestIndexResponse, ApiResult } from "@/types/api";
import { StatusBadge } from "@/components/status-badge";
import { JsonViewer } from "@/components/json-viewer";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function TestIndex() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResult<TestIndexResponse> | null>(null);

  async function handleIndex() {
    setLoading(true);
    const res = await apiFetch<TestIndexResponse>("/test/index", { method: "POST" });
    setResult(res);
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono text-xs">POST</Badge>
          <CardTitle className="text-lg">/test/index</CardTitle>
        </div>
        <CardDescription>Index a sample document into Elasticsearch.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleIndex} disabled={loading}>
          {loading ? "Indexing…" : "Index Sample Document"}
        </Button>

        {result && (
          <div className="space-y-4">
            <StatusBadge ok={result.ok} error={result.error} />

            {result.ok && result.data && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="font-medium">Result</span>
                <span>{result.data.result}</span>
                <span className="font-medium">Document ID</span>
                <span className="font-mono text-xs">{result.data.id}</span>
              </div>
            )}

            <JsonViewer data={result.data} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
