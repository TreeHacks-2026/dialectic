"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import type { HealthResponse, ApiResult } from "@/types/api";
import { StatusBadge } from "@/components/status-badge";
import { JsonViewer } from "@/components/json-viewer";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function HealthCheck() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResult<HealthResponse> | null>(null);

  async function handleCheck() {
    setLoading(true);
    const res = await apiFetch<HealthResponse>("/health");
    setResult(res);
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono text-xs">GET</Badge>
          <CardTitle className="text-lg">/health</CardTitle>
        </div>
        <CardDescription>Check Elasticsearch connectivity and cluster info.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleCheck} disabled={loading}>
          {loading ? "Checking…" : "Check Health"}
        </Button>

        {result && (
          <div className="space-y-4">
            <StatusBadge ok={result.ok} error={result.error} />

            {result.ok && result.data && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="font-medium">Status</span>
                <span>{result.data.status}</span>
                <span className="font-medium">Cluster Name</span>
                <span>{result.data.cluster_name}</span>
              </div>
            )}

            <JsonViewer data={result.data} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
