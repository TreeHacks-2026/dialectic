import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 p-8 font-[family-name:var(--font-geist-sans)]">
      <div className="text-center space-y-3">
        <h1 className="text-6xl font-bold tracking-tight">Dialectic</h1>
        <p className="text-xl text-muted-foreground max-w-lg">
          AI Teaching Assistant with Avatar Office Hours
        </p>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Upload your course materials, then learn through conversation with an
          AI tutor backed by RAG-powered retrieval and a lifelike streaming
          avatar.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 max-w-2xl w-full">
        <Link href="/tutor" className="block">
          <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/40">
            <CardHeader>
              <CardTitle className="text-lg">AI Tutor</CardTitle>
              <CardDescription>
                Ask questions and get answers from your course materials through
                an interactive avatar powered by HeyGen.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/upload" className="block">
          <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/40">
            <CardHeader>
              <CardTitle className="text-lg">Upload Materials</CardTitle>
              <CardDescription>
                Upload PDFs, text files, and Markdown to build your course
                knowledge base with Elasticsearch and JINA embeddings.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      <div className="flex gap-4">
        <Button asChild size="lg">
          <Link href="/tutor">Start Learning</Link>
        </Button>
        <Button variant="outline" asChild size="lg">
          <Link href="/upload">Manage Courses</Link>
        </Button>
      </div>
    </main>
  );
}
