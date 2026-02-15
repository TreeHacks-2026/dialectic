"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [meetingId, setMeetingId] = useState("");
  const [agentConfigs, setAgentConfigs] = useState({
    agent1: { name: "Dr. Thesis", enabled: true },
    agent2: { name: "Dev", enabled: true },
    agent3: { name: "Sage", enabled: true },
  });

  const handleStartDialogue = () => {
    // For now, just navigate to tutor page with dummy config
    // Config values are stored in state but not used yet
    console.log("Starting dialogue with config:", { meetingId, agentConfigs });
    setDialogOpen(false);
    router.push("/tutor");
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 p-8 font-[family-name:var(--font-geist-sans)]">
      <div className="text-center space-y-3">
        <h1 className="text-6xl font-bold tracking-tight">Dialectic</h1>
        <p className="text-xl text-muted-foreground max-w-lg">
          AI Teaching Assistant with Avatar Office Hours
        </p>
      </div>

      <div className="flex flex-col gap-6 w-full max-w-md">
        <Button
          onClick={() => setDialogOpen(true)}
          size="lg"
          className="w-full"
        >
          New Dialogue
        </Button>

        <Button asChild size="lg" variant="outline" className="w-full">
          <Link href="/analyses">View Analytics</Link>
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>New Dialogue Configuration</DialogTitle>
            <DialogDescription>
              Configure your meeting settings and agent preferences.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="meeting-id">Meeting ID</Label>
              <Input
                id="meeting-id"
                placeholder="Enter meeting ID (optional)"
                value={meetingId}
                onChange={(e) => setMeetingId(e.target.value)}
              />
            </div>
            <div className="grid gap-3">
              <Label>Agent Configuration</Label>
              <div className="space-y-3">
                {Object.entries(agentConfigs).map(([key, config]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={config.enabled}
                        onChange={(e) =>
                          setAgentConfigs({
                            ...agentConfigs,
                            [key]: { ...config, enabled: e.target.checked },
                          })
                        }
                        className="rounded"
                      />
                      <Label htmlFor={key} className="font-normal">
                        {config.name} ({key})
                      </Label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStartDialogue}>Start Dialogue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
