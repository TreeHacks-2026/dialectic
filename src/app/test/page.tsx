"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

interface ApiResult {
  status: number | null;
  data: unknown;
  error: string | null;
  duration: number | null;
}

function ResultDisplay({ result }: { result: ApiResult | null }) {
  if (!result) return null;

  const isSuccess = result.status !== null && result.status >= 200 && result.status < 300;

  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center gap-2">
        <Badge variant={isSuccess ? "default" : "destructive"}>
          {result.status ?? "Error"}
        </Badge>
        {result.duration !== null && (
          <span className="text-xs text-muted-foreground">
            {result.duration}ms
          </span>
        )}
      </div>
      {result.error && (
        <p className="text-sm text-destructive">{result.error}</p>
      )}
      <pre className="text-xs bg-muted rounded-lg p-3 overflow-auto max-h-80 whitespace-pre-wrap">
        {JSON.stringify(result.data, null, 2)}
      </pre>
    </div>
  );
}

async function apiCall(url: string, options?: RequestInit): Promise<ApiResult> {
  const start = Date.now();
  try {
    const res = await fetch(url, options);
    const duration = Date.now() - start;
    const data = await res.json().catch(() => null);
    return { status: res.status, data, error: null, duration };
  } catch (err) {
    const duration = Date.now() - start;
    return {
      status: null,
      data: null,
      error: err instanceof Error ? err.message : "Request failed",
      duration,
    };
  }
}

function ConnectionTab() {
  const [result, setResult] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setResult(null);
    const res = await apiCall("/api/courses");
    setResult(res);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Tests the Elasticsearch connection by calling GET /api/courses.
      </p>
      <Button onClick={testConnection} disabled={loading}>
        {loading ? "Testing..." : "Test ES Connection"}
      </Button>
      <ResultDisplay result={result} />
    </div>
  );
}

function IngestTab() {
  const [courseName, setCourseName] = useState("test-course");
  const [textContent, setTextContent] = useState(
    "Machine learning is a subset of artificial intelligence that focuses on building systems that learn from data. Supervised learning uses labeled training data to make predictions. Unsupervised learning finds hidden patterns in data without labels."
  );
  const [result, setResult] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);

  const testIngest = async () => {
    setLoading(true);
    setResult(null);

    const blob = new Blob([textContent], { type: "text/plain" });
    const file = new File([blob], "test-document.txt", { type: "text/plain" });

    const formData = new FormData();
    formData.append("file", file);
    formData.append("course_name", courseName);

    const res = await apiCall("/api/ingest", {
      method: "POST",
      body: formData,
    });
    setResult(res);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Creates a test text file and sends it to POST /api/ingest for chunking, embedding, and indexing.
      </p>
      <div className="space-y-3">
        <div>
          <Label htmlFor="course-name">Course Name</Label>
          <Input
            id="course-name"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            placeholder="test-course"
          />
        </div>
        <div>
          <Label htmlFor="text-content">Text Content</Label>
          <Textarea
            id="text-content"
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            rows={5}
            placeholder="Enter text to index..."
          />
        </div>
      </div>
      <Button onClick={testIngest} disabled={loading || !courseName || !textContent}>
        {loading ? "Indexing..." : "Index Test Document"}
      </Button>
      <ResultDisplay result={result} />
    </div>
  );
}

function SearchTab() {
  const [query, setQuery] = useState("machine learning");
  const [courseName, setCourseName] = useState("");
  const [result, setResult] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);

  const testSearch = async () => {
    setLoading(true);
    setResult(null);
    const res = await apiCall("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: query,
        course_name: courseName || undefined,
      }),
    });
    setResult(res);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Embeds the query via JINA, runs hybrid search (BM25 + KNN) on Elasticsearch via POST /api/chat.
      </p>
      <div className="space-y-3">
        <div>
          <Label htmlFor="search-query">Search Query</Label>
          <Input
            id="search-query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter search query..."
          />
        </div>
        <div>
          <Label htmlFor="search-course">Course Name (optional)</Label>
          <Input
            id="search-course"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            placeholder="Leave empty to search all courses"
          />
        </div>
      </div>
      <Button onClick={testSearch} disabled={loading || !query}>
        {loading ? "Searching..." : "Search"}
      </Button>
      <ResultDisplay result={result} />
    </div>
  );
}

function CoursesTab() {
  const [result, setResult] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCourses = async () => {
    setLoading(true);
    setResult(null);
    const res = await apiCall("/api/courses");
    setResult(res);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Fetches all courses and document counts from Elasticsearch via GET /api/courses.
      </p>
      <Button onClick={fetchCourses} disabled={loading}>
        {loading ? "Fetching..." : "Fetch Courses"}
      </Button>
      <ResultDisplay result={result} />
    </div>
  );
}

function HeyGenTab() {
  const [result, setResult] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);

  const testSession = async () => {
    setLoading(true);
    setResult(null);
    const res = await apiCall("/api/heygen/session", { method: "POST" });
    setResult(res);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Creates a HeyGen streaming session token via POST /api/heygen/session.
      </p>
      <Button onClick={testSession} disabled={loading}>
        {loading ? "Creating session..." : "Test HeyGen Session"}
      </Button>
      <ResultDisplay result={result} />
    </div>
  );
}

export default function TestPage() {
  return (
    <div className="min-h-screen font-[family-name:var(--font-geist-sans)]">
      <header className="flex items-center justify-between px-4 py-3 border-b">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight hover:opacity-80 transition-opacity"
        >
          Dialectic
        </Link>
        <div className="flex gap-2">
          <Link href="/tutor" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Avatar
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">API Testing Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Test each API endpoint to verify your services are connected and working.
          </p>
        </div>

        <Separator />

        <Tabs defaultValue="connection">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="connection">Connection</TabsTrigger>
            <TabsTrigger value="ingest">Ingest</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="heygen">HeyGen</TabsTrigger>
          </TabsList>

          <Card className="mt-4">
            <CardContent className="pt-6">
              <TabsContent value="connection" className="mt-0">
                <ConnectionTab />
              </TabsContent>
              <TabsContent value="ingest" className="mt-0">
                <IngestTab />
              </TabsContent>
              <TabsContent value="search" className="mt-0">
                <SearchTab />
              </TabsContent>
              <TabsContent value="courses" className="mt-0">
                <CoursesTab />
              </TabsContent>
              <TabsContent value="heygen" className="mt-0">
                <HeyGenTab />
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </div>
  );
}
