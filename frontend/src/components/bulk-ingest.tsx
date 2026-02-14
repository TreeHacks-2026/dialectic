"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import type { BulkIngestResponse, ApiResult } from "@/types/api";
import { StatusBadge } from "@/components/status-badge";
import { JsonViewer } from "@/components/json-viewer";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const PLACEHOLDER = `[
  {
    "transcript_text": "Example transcript text here",
    "meeting_id": "meeting-002",
    "meeting_title": "Team Standup",
    "meeting_date": "2026-02-01",
    "speaker": "Alice",
    "speakers_list": ["Alice", "Bob"],
    "timestamp_start": "00:00:00",
    "timestamp_end": "00:05:00",
    "chunk_index": 0,
    "duration_minutes": 30
  }
]`;

export function BulkIngest() {
  const [jsonString, setJsonString] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResult<BulkIngestResponse> | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  async function handleIngest() {
    setValidationError(null);

    const input = jsonString.trim();
    if (!input) {
      setValidationError("Please enter JSON data.");
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(input);
    } catch {
      setValidationError("Invalid JSON. Please check your syntax.");
      return;
    }

    if (!Array.isArray(parsed)) {
      setValidationError("JSON must be an array of documents.");
      return;
    }

    setLoading(true);
    const res = await apiFetch<BulkIngestResponse>("/ingest/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: input,
    });
    setResult(res);
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono text-xs">POST</Badge>
          <CardTitle className="text-lg">/ingest/bulk</CardTitle>
        </div>
        <CardDescription>Bulk ingest transcript documents into Elasticsearch.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder={PLACEHOLDER}
          value={jsonString}
          onChange={(e) => setJsonString(e.target.value)}
          rows={12}
          className="font-mono text-xs"
        />

        {validationError && (
          <p className="rounded border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
            {validationError}
          </p>
        )}

        <Button onClick={handleIngest} disabled={loading}>
          {loading ? "Ingesting\u2026" : "Ingest"}
        </Button>

        {result && (
          <div className="space-y-4">
            <StatusBadge ok={result.ok} error={result.error} />

            {result.ok && result.data && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="font-medium">Indexed</span>
                <span>{result.data.indexed}</span>
                <span className="font-medium">Errors</span>
                <span>{Array.isArray(result.data.errors) ? result.data.errors.length : result.data.errors}</span>
              </div>
            )}

            <JsonViewer data={result.data} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
