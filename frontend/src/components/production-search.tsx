"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import type { SearchResponse, SearchRequest, SearchFilters, ApiResult } from "@/types/api";
import { StatusBadge } from "@/components/status-badge";
import { JsonViewer } from "@/components/json-viewer";
import { ResultCard } from "@/components/result-card";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

export function ProductionSearch() {
  const [query, setQuery] = useState("");
  const [speaker, setSpeaker] = useState("");
  const [meetingId, setMeetingId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [size, setSize] = useState(10);
  const [useReranking, setUseReranking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResult<SearchResponse> | null>(null);

  async function handleSearch() {
    if (!query.trim()) return;

    const filters: SearchFilters = {};
    if (speaker.trim()) filters.speaker = speaker.trim();
    if (meetingId.trim()) filters.meeting_id = meetingId.trim();
    if (dateFrom) filters.date_from = dateFrom;
    if (dateTo) filters.date_to = dateTo;

    const body: SearchRequest = {
      query: query.trim(),
      size,
      use_reranking: useReranking,
    };

    if (Object.keys(filters).length > 0) {
      body.filters = filters;
    }

    setLoading(true);
    const res = await apiFetch<SearchResponse>("/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setResult(res);
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono text-xs">POST</Badge>
          <CardTitle className="text-lg">/search</CardTitle>
        </div>
        <CardDescription>Production search with filters and optional reranking.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="prod-query">Query (required)</Label>
            <Input
              id="prod-query"
              placeholder="Enter search query..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prod-speaker">Speaker</Label>
              <Input
                id="prod-speaker"
                placeholder="e.g. Alice"
                value={speaker}
                onChange={(e) => setSpeaker(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prod-meeting-id">Meeting ID</Label>
              <Input
                id="prod-meeting-id"
                placeholder="e.g. meeting-001"
                value={meetingId}
                onChange={(e) => setMeetingId(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prod-date-from">Date From</Label>
              <Input
                id="prod-date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prod-date-to">Date To</Label>
              <Input
                id="prod-date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prod-size">Size</Label>
              <Input
                id="prod-size"
                type="number"
                min={1}
                max={100}
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
              />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Switch
                id="prod-reranking"
                checked={useReranking}
                onCheckedChange={setUseReranking}
              />
              <Label htmlFor="prod-reranking">Use Reranking</Label>
            </div>
          </div>
        </div>

        <Button onClick={handleSearch} disabled={loading || !query.trim()}>
          {loading ? "Searching\u2026" : "Search"}
        </Button>

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
