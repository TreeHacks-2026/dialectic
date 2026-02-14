"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import type { SearchResponse, ApiResult } from "@/types/api";
import { StatusBadge } from "@/components/status-badge";
import { JsonViewer } from "@/components/json-viewer";
import { ResultCard } from "@/components/result-card";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function TestSearch() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResult<SearchResponse> | null>(null);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    const res = await apiFetch<SearchResponse>("/test/search?q=" + encodeURIComponent(query));
    setResult(res);
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono text-xs">GET</Badge>
          <CardTitle className="text-lg">/test/search</CardTitle>
        </div>
        <CardDescription>Run a basic search query against Elasticsearch.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter search query..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={loading || !query.trim()}>
            {loading ? "Searching\u2026" : "Search"}
          </Button>
        </div>

        {result && (
          <div className="space-y-4">
            <StatusBadge ok={result.ok} error={result.error} />

            {result.ok && result.data && (
              <>
                <p className="text-sm text-muted-foreground">
                  Total hits: <strong>{result.data.total}</strong>
                </p>
                <div className="space-y-3">
                  {result.data.hits.map((hit, i) => (
                    <ResultCard key={hit.id} hit={hit} rank={i + 1} />
                  ))}
                </div>
              </>
            )}

            <JsonViewer data={result.data} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
