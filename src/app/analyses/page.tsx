'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface StoredAnalysis {
  id: string;
  sessionId: string;
  analyzedAt: string;
  transcript: string;
  results: Array<{
    studentId?: string;
    overallScore: number;
    overallSummary: string;
    [key: string]: unknown;
  }>;
  createdAt: string;
}

interface AnalysesResponse {
  count: number;
  analyses: StoredAnalysis[];
}

export default function AnalysesPage() {
  const [analyses, setAnalyses] = useState<StoredAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  const loadAnalyses = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/analyses');
      if (!res.ok) {
        throw new Error(`Failed to load analyses: ${res.status}`);
      }
      const data = (await res.json()) as AnalysesResponse;
      setAnalyses(data.analyses || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load analyses');
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to delete all stored analyses? This cannot be undone.')) {
      return;
    }

    try {
      setClearing(true);
      const res = await fetch('/api/analyses', { method: 'DELETE' });
      if (!res.ok) {
        throw new Error('Failed to clear analyses');
      }
      await loadAnalyses(); // Reload to show empty state
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to clear analyses');
    } finally {
      setClearing(false);
    }
  };

  useEffect(() => {
    loadAnalyses();
  }, []);

  function scoreColor(score: number) {
    if (score >= 4) return 'bg-green-100 text-green-800';
    if (score >= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  }

  return (
    <main className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Meeting Analyses</h1>
          <p className="text-muted-foreground mt-1">
            View and manage stored analysis results from past meetings
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadAnalyses} variant="outline" disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
          <Button
            onClick={handleClearAll}
            variant="destructive"
            disabled={clearing || analyses.length === 0}
          >
            {clearing ? 'Clearing...' : `Clear All (${analyses.length})`}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading analyses...</p>
        </div>
      ) : analyses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No analyses stored yet.</p>
            <p className="text-sm text-muted-foreground">
              Analyses will appear here automatically after meetings end.
            </p>
            <Link href="/dashboard" className="mt-4 inline-block">
              <Button variant="outline">Go to Analysis Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {analyses.map((analysis) => (
            <Card key={analysis.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      Session: {analysis.sessionId}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Analyzed: {new Date(analysis.analyzedAt).toLocaleString()}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">
                    {analysis.results.length} student{analysis.results.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.results.map((result, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-muted/50 rounded-lg border"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">
                          {result.studentId || `Student ${idx + 1}`}
                        </span>
                        <Badge className={scoreColor(result.overallScore)}>
                          Score: {result.overallScore}/5
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {result.overallSummary}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Link href={`/analyses/${analysis.id}`}>
                    <Button variant="outline" size="sm">
                      View Full Analysis
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-8 text-center">
        <Link href="/">
          <Button variant="ghost">← Back to Home</Button>
        </Link>
      </div>
    </main>
  );
}
