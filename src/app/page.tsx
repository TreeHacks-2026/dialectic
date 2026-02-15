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
      </div>

      <div className="grid gap-6 sm:grid-cols-2 max-w-3xl w-full">
        <Link href="/tutor" className="block">
          <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/40">
            <CardHeader>
              <CardTitle className="text-lg">HeyGen Avatar</CardTitle>
              <CardDescription>
                Type text and have the HeyGen streaming avatar speak it back to
                you in real-time.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/test" className="block">
          <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/40">
            <CardHeader>
              <CardTitle className="text-lg">API Testing</CardTitle>
              <CardDescription>
                Test Elasticsearch connection, document ingestion, hybrid search,
                and course listing APIs.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/dashboard" className="block">
          <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/40">
            <CardHeader>
              <CardTitle className="text-lg">Debate Analysis</CardTitle>
              <CardDescription>
                Analyze meeting transcripts and get detailed feedback on student
                debate performance with rubric-based scoring.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      <Button asChild size="lg">
        <Link href="/tutor">Start Avatar</Link>
      </Button>
    </main>
  );
}
