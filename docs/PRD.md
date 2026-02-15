# Dialectic — AI Persona Seminar Platform (MVP)

## Executive Summary

- **Product Name:** Dialectic (Working Title)
- **Product Goal:** Enable students to invite AI-powered Agent Personas into a Zoom meeting for educational, Socratic-style discussions.

**MVP must demonstrate:**
- Configure a persona with documents
- Persona joins a live Zoom conversation
- Contextually relevant responses from knowledge base + ongoing dialogue

---

## Target Users (MVP Focus)

| User | Use Case |
|------|----------|
| **Student** | Debate historical figures; prepare for technical interviews with expert personas |
| **Educator** | Simulate roundtables with historical figures; supplement lectures with immersive roleplay |

---

## Problem Statement

Educational roleplay today requires either another human (logistically hard) or a static chatbot (not integrated into live voice). Users need **immersive, voice-based conversations with knowledgeable entities** inside Zoom.

---

## Functional Requirements

### FR1 — Meeting Participation (Connection Layer)
- **FR1.1** User provides Zoom meeting link (or ID/passcode) via Dialectic web UI.
- **FR1.2** Platform spawns one runtime per selected agent; each joins as a distinct participant (e.g. "Socrates (AI)").
- **FR1.3** Each agent streams TTS into the meeting and receives meeting audio mix.
- **Principle:** No master agent; each persona is autonomous; platform provides orchestration only.

### FR2 — Persona Configuration (Identity Layer)
- **FR2.1** Name + system prompt (e.g. "You are Socrates. You question assumptions aggressively.").
- **FR2.2** Document upload: PDF, TXT; max 3 docs per persona; 10MB total cap.
- **FR2.3** User selects 1–3 configured agents to join the meeting.

### FR3 — Context Awareness (Memory Layer)
- **FR3.1** Live transcript ingestion (Zoom transcript or real-time STT); rolling conversation context.
- **FR3.2** RAG: semantic search across persona documents; top chunks injected into prompt.
- **FR3.3** Web search fallback when document confidence is low or query needs current info (e.g. SerpAPI, Tavily).

### FR4 — Dialogue Management (Turn Logic)
- **FR4.1** Turn detection: silence threshold = end-of-user speech.
- **FR4.2** Interruption: if user speaks while agent talks → halt TTS, release speaking lock.
- **FR4.3** Listening mode: agents always listening unless one holds the floor.

### FR5 — Multi-Agent Dialogue (Seminar Mode)
- **FR5.1** Directed addressing: detect "Socrates, what do you think?" → route to that agent.
- **FR5.2** Agent interjections after pause window, based on persona traits.
- **FR5.3** Turn Coordinator (non-LLM): single speaker; arbitration by persona urgency or round-robin; manages silence + queue.

---

## Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR1 | Latency: &lt; 3s from user speech end to agent reply start |
| NFR2 | Voice clarity: distinct, intelligible voices per agent |
| NFR3 | Reliability: agents stay connected for full session; no mid-session crashes/disconnects |

---

## MVP User Flow

1. **Setup** — User logs into Dialectic web app.
2. **Configure** — Creates personas (e.g. Socrates + The Republic .txt; Einstein + biography PDF).
3. **Launch** — Starts Zoom meeting; pastes link into Dialectic; clicks "Start Session."
4. **Join** — Socrates_Bot and Einstein_Bot join as participants.
5. **Discussion** — User: "Socrates, what do you think of Einstein's theory?" → RAG + optional web search → Socrates replies via TTS; Einstein may interject.
6. **End** — User clicks "End Session"; bots leave.

---

## Technical Architecture (High-Level)

| Layer | Stack |
|-------|--------|
| **Frontend** | React / Next.js — persona config UI |
| **Session Manager** | Receives Zoom link; spawns agent runtimes |
| **Agent Runtime** (per persona) | STT, LLM + RAG, vector DB, web search, TTS |
| **Turn Coordinator** | Redis or in-memory queue; floor access; single-speaker constraint |
| **Meeting Connection** | WebRTC (e.g. LiveKit) or headless Zoom Web client |

---

## MVP Success Metrics

- **Session completion rate** — Sessions &gt; 5 min without disconnect
- **Context adherence** — Agent references uploaded docs correctly
- **User rating** — Post-session realism (1–5)

---

## Out of Scope (Future)

- Persistent memory across sessions
- Video avatars
- Multi-user rooms
- Knowledge graph editor
- Native Zoom Marketplace listing
