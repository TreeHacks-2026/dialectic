import { ApiTester } from "@/components/api-tester";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-bold tracking-tight">
            <span className="text-primary">Meeting Brain</span>{" "}API Tester
          </h1>
          <code className="rounded border bg-muted px-2 py-1 text-xs text-muted-foreground">
            {process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}
          </code>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-8">
        <ApiTester />
      </main>
    </div>
  );
}
