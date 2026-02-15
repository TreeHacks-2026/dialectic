'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    criteria?: Array<{
      criterionId: string;
      score: number;
      feedback: string;
      examples: Array<{
        quote: string;
        isStrength: boolean;
        context?: string;
      }>;
    }>;
    strengths?: string[];
    areasForImprovement?: string[];
    suggestedNextSteps?: string[];
    [key: string]: unknown;
  }>;
  createdAt: string;
}

const CRITERIA: Record<string, { label: string; icon: string }> = {
  chain_of_reasoning: { label: 'Chain of reasoning', icon: '🔗' },
  sound_evidence: { label: 'Sound evidence', icon: '📚' },
  clarity_of_response: { label: 'Clarity of response', icon: '💬' },
  logical_consistency: { label: 'Logical consistency', icon: '🧩' },
  engagement_and_civility: { label: 'Engagement & civility', icon: '🤝' },
  relevance_and_focus: { label: 'Relevance & focus', icon: '🎯' },
  critical_thinking: { label: 'Critical thinking', icon: '🧠' },
};

function scoreColor(score: number) {
  if (score >= 4) return 'text-green-600 bg-green-50';
  if (score >= 3) return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
}

export default function AnalysisDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [analysis, setAnalysis] = useState<StoredAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStudent, setActiveStudent] = useState(0);

  useEffect(() => {
    const loadAnalysis = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/analyses?id=${id}`);
        if (!res.ok) {
          throw new Error('Analysis not found');
        }
        const data = (await res.json()) as StoredAnalysis;
        setAnalysis(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load analysis');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadAnalysis();
    }
  }, [id]);

  if (loading) {
    return (
      <main className="container mx-auto py-8 px-4">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading analysis...</p>
        </div>
      </main>
    );
  }

  if (error || !analysis) {
    return (
      <main className="container mx-auto py-8 px-4">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error || 'Analysis not found'}</p>
          <Link href="/analyses">
            <Button>Back to Analyses</Button>
          </Link>
        </div>
      </main>
    );
  }

  const result = analysis.results[activeStudent];

  return (
    <main className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <Link href="/analyses">
          <Button variant="ghost" className="mb-4">← Back to Analyses</Button>
        </Link>
        <h1 className="text-3xl font-bold">Analysis Details</h1>
        <p className="text-muted-foreground mt-1">
          Session: {analysis.sessionId} · {new Date(analysis.analyzedAt).toLocaleString()}
        </p>
      </div>

      {analysis.results.length > 1 && (
        <div className="mb-6 flex gap-2">
          {analysis.results.map((r, idx) => (
            <Button
              key={idx}
              variant={activeStudent === idx ? 'default' : 'outline'}
              onClick={() => setActiveStudent(idx)}
            >
              {r.studentId || `Student ${idx + 1}`} ({r.overallScore}/5)
            </Button>
          ))}
        </div>
      )}

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {result.studentId || `Student ${activeStudent + 1}`}
            </CardTitle>
            <Badge className={scoreColor(result.overallScore)}>
              Overall: {result.overallScore}/5
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{result.overallSummary}</p>

          {result.criteria && result.criteria.length > 0 && (
            <div className="space-y-3 mb-4">
              <h3 className="font-semibold text-sm uppercase text-muted-foreground">
                Rubric Scores
              </h3>
              {result.criteria.map((criterion) => {
                const meta = CRITERIA[criterion.criterionId];
                return (
                  <details key={criterion.criterionId} className="border rounded-lg p-3">
                    <summary className="cursor-pointer font-medium flex items-center gap-2">
                      <span>{meta?.icon || '•'}</span>
                      <span>{meta?.label || criterion.criterionId}</span>
                      <Badge className={`ml-auto ${scoreColor(criterion.score)}`}>
                        {criterion.score}/5
                      </Badge>
                    </summary>
                    <div className="mt-3 pl-6">
                      <p className="text-sm text-muted-foreground mb-2">
                        {criterion.feedback}
                      </p>
                      {criterion.examples && criterion.examples.length > 0 && (
                        <div className="space-y-2">
                          {criterion.examples.map((ex, i) => (
                            <div
                              key={i}
                              className={`text-xs p-2 rounded border-l-2 ${
                                ex.isStrength
                                  ? 'bg-green-50 border-green-300'
                                  : 'bg-yellow-50 border-yellow-300'
                              }`}
                            >
                              <p className="italic">&ldquo;{ex.quote}&rdquo;</p>
                              {ex.context && (
                                <p className="text-muted-foreground mt-1">
                                  {ex.isStrength ? '✓' : '△'} {ex.context}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </details>
                );
              })}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            {result.strengths && result.strengths.length > 0 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2 text-sm uppercase">
                  Strengths
                </h4>
                <ul className="space-y-1 text-sm">
                  {result.strengths.map((s, i) => (
                    <li key={i} className="text-muted-foreground">
                      • {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.areasForImprovement && result.areasForImprovement.length > 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2 text-sm uppercase">
                  Areas for Improvement
                </h4>
                <ul className="space-y-1 text-sm">
                  {result.areasForImprovement.map((a, i) => (
                    <li key={i} className="text-muted-foreground">
                      • {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {result.suggestedNextSteps && result.suggestedNextSteps.length > 0 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2 text-sm uppercase">
                Suggested Next Steps
              </h4>
              <ol className="space-y-1 text-sm list-decimal list-inside">
                {result.suggestedNextSteps.map((s, i) => (
                  <li key={i} className="text-muted-foreground">
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Full Transcript</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-96 whitespace-pre-wrap font-mono">
            {analysis.transcript}
          </pre>
        </CardContent>
      </Card>
    </main>
  );
}
