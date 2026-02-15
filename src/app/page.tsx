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
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { DEFAULT_AGENT_TEMPLATES, type DefaultAgentTemplate } from "@/lib/default-agents";
import { saveDialogueConfig } from "@/lib/dialogue-config";
import { X, Plus } from "lucide-react";

interface AgentConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  isCustom: boolean;
  heygen?: {
    avatar_id: string;
    voice_id: string;
    voice_name: string;
    preview_url: string;
  };
  customFiles?: string[];
  customMedia?: string[];
}

export default function Home() {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [meetingId, setMeetingId] = useState("");
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [showAddAgent, setShowAddAgent] = useState(false);
  const [showBuildAgent, setShowBuildAgent] = useState(false);
  const [newCustomAgent, setNewCustomAgent] = useState({
    name: "",
    description: "",
    supplementaryFiles: [] as string[],
    photos: [] as string[],
    videos: [] as string[],
  });

  const handleAddFromDefault = (template: DefaultAgentTemplate) => {
    const newAgent: AgentConfig = {
      id: template.id,
      name: template.name,
      description: template.description,
      enabled: true,
      isCustom: false,
      heygen: template.heygen,
    };
    setAgents([...agents, newAgent]);
    setShowAddAgent(false);
  };

  const handleBuildCustomAgent = () => {
    if (!newCustomAgent.name.trim() || !newCustomAgent.description.trim()) {
      return;
    }
    const newAgent: AgentConfig = {
      id: `custom-${Date.now()}`,
      name: newCustomAgent.name,
      description: newCustomAgent.description,
      enabled: true,
      isCustom: true,
      customFiles: newCustomAgent.supplementaryFiles,
      customMedia: [...newCustomAgent.photos, ...newCustomAgent.videos],
    };
    setAgents([...agents, newAgent]);
    setNewCustomAgent({ name: "", description: "", supplementaryFiles: [], photos: [], videos: [] });
    setShowBuildAgent(false);
  };

  const handleRemoveAgent = (id: string) => {
    setAgents(agents.filter((a) => a.id !== id));
  };

  const handleToggleAgent = (id: string) => {
    setAgents(
      agents.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
    );
  };

  const handleStartDialogue = async () => {
    // Filter to only enabled agents
    const enabledAgents = agents.filter(a => a.enabled);
    
    if (enabledAgents.length === 0) {
      alert("Please add and enable at least one agent to start a dialogue.");
      return;
    }

    // Prepare config for storage
    const config = {
      meetingId: meetingId || undefined,
      agents: enabledAgents.map(agent => ({
        id: agent.id,
        name: agent.name,
        description: agent.description,
        heygen: agent.heygen,
      })),
    };

    // Save config to session storage (frontend)
    saveDialogueConfig(config);
    
    // Generate a temporary session ID (will be replaced by actual RTMS session ID later)
    // For now, use a temp ID that will be updated when RTMS starts
    const tempSessionId = `temp-${Date.now()}`;
    
    // Store config on backend (will be associated with actual session ID when RTMS starts)
    try {
      const response = await fetch('/api/dialogue-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: tempSessionId,
          meetingId: config.meetingId,
          agents: config.agents,
        }),
      });

      if (!response.ok) {
        console.error('[Dialogue] Failed to store config on backend:', await response.text());
        // Continue anyway - frontend config is stored
      } else {
        console.log('[Dialogue] ✅ Stored config on backend for session:', tempSessionId);
      }
    } catch (error) {
      console.error('[Dialogue] Error storing config on backend:', error);
      // Continue anyway - frontend config is stored
    }
    
    console.log("Starting dialogue with config:", config);
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
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Dialogue Configuration</DialogTitle>
            <DialogDescription>
              Configure your meeting settings and agent preferences.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="meeting-id">Meeting ID (Optional)</Label>
              <Input
                id="meeting-id"
                placeholder="Enter meeting ID"
                value={meetingId}
                onChange={(e) => setMeetingId(e.target.value)}
              />
            </div>

            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <Label>Agents</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddAgent(!showAddAgent)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Agent
                  </Button>
                </div>
              </div>

              {showAddAgent && (
                <div className="border rounded-lg p-4 space-y-3 bg-muted/50">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Add Agent</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowAddAgent(false);
                        setShowBuildAgent(false);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowBuildAgent(false);
                      }}
                      className={!showBuildAgent ? "bg-primary text-primary-foreground" : ""}
                    >
                      From Defaults
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowBuildAgent(true);
                      }}
                      className={showBuildAgent ? "bg-primary text-primary-foreground" : ""}
                    >
                      Build Custom
                    </Button>
                  </div>

                  {!showBuildAgent ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {DEFAULT_AGENT_TEMPLATES.map((template) => (
                        <div
                          key={template.id}
                          className="border rounded p-3 cursor-pointer hover:bg-accent transition-colors"
                          onClick={() => handleAddFromDefault(template)}
                        >
                          <div className="font-medium text-sm">{template.name}</div>
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {template.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="custom-name" className="text-sm">Agent Name</Label>
                        <Input
                          id="custom-name"
                          placeholder="Enter agent name"
                          value={newCustomAgent.name}
                          onChange={(e) =>
                            setNewCustomAgent({ ...newCustomAgent, name: e.target.value })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="custom-description" className="text-sm">
                          Personality Description
                        </Label>
                        <Textarea
                          id="custom-description"
                          placeholder="Describe the agent's personality, expertise, and communication style..."
                          value={newCustomAgent.description}
                          onChange={(e) =>
                            setNewCustomAgent({ ...newCustomAgent, description: e.target.value })
                          }
                          className="mt-1"
                          rows={4}
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Supplementary Files (Optional)</Label>
                        <Input
                          type="file"
                          multiple
                          className="mt-1"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []).map((f) => f.name);
                            setNewCustomAgent({
                              ...newCustomAgent,
                              supplementaryFiles: files,
                            });
                          }}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Files will be processed later (not stored now)
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm">Photos/Videos (Optional)</Label>
                        <Input
                          type="file"
                          accept="image/*,video/*"
                          multiple
                          className="mt-1"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            const photos = files.filter((f) => f.type.startsWith("image/")).map((f) => f.name);
                            const videos = files.filter((f) => f.type.startsWith("video/")).map((f) => f.name);
                            setNewCustomAgent({
                              ...newCustomAgent,
                              photos,
                              videos,
                            });
                          }}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Media will be processed later (not stored now)
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleBuildCustomAgent}
                        disabled={!newCustomAgent.name.trim() || !newCustomAgent.description.trim()}
                      >
                        Add Custom Agent
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                {agents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No agents added. Click "Add Agent" to get started.
                  </p>
                ) : (
                  agents.map((agent) => (
                    <div
                      key={agent.id}
                      className="flex items-start gap-3 border rounded-lg p-3"
                    >
                      <input
                        type="checkbox"
                        checked={agent.enabled}
                        onChange={() => handleToggleAgent(agent.id)}
                        className="rounded mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Label className="font-medium text-sm">{agent.name}</Label>
                          {agent.isCustom && (
                            <span className="text-xs bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">
                              Custom
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {agent.description}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAgent(agent.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStartDialogue} disabled={agents.length === 0}>
              Start Dialogue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
