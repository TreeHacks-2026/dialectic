# Dialectic — Implementation Roadmap

## 48-hour build plan (MVP slice)

Goal: **One user, one agent, one Zoom join + one voice round-trip** (no multi-agent or turn coordinator yet).

---

### Phase 1 — Foundation (0–12h)

| # | Task | Output |
|---|------|--------|
| 1.1 | Monorepo setup (pnpm workspaces): `apps/web`, `apps/agent`, `packages/shared` | `package.json` workspaces, base TS configs |
| 1.2 | Next.js app: login placeholder, persona config form (name, system prompt) | `/configure` page |
| 1.3 | Document upload UI (PDF/TXT, max 3, 10MB) + store in blob/S3 or local disk | Upload + persistence |
| 1.4 | “Start Session” flow: input Zoom link, call backend to create session | Session creation API |
| 1.5 | Backend session API: accept Zoom link, create session record, return session ID | `POST /sessions` |

---

### Phase 2 — Meeting + voice (12–24h)

| # | Task | Output |
|---|------|--------|
| 2.1 | Meeting connection layer: headless Zoom join or LiveKit room using meeting link | One bot joins as participant |
| 2.2 | Inbound audio: capture meeting audio → pipe to STT | Transcript stream |
| 2.3 | STT integration (e.g. Deepgram / AssemblyAI / Whisper) | Text from user speech |
| 2.4 | Outbound audio: TTS (e.g. ElevenLabs / PlayHT) → stream into meeting | Agent “speaks” in Zoom |
| 2.5 | End-to-end: user speaks in Zoom → STT → (no LLM yet) → TTS → audio back into Zoom | Single voice round-trip |

---

### Phase 3 — Agent brain (24–36h)

| # | Task | Output |
|---|------|--------|
| 3.1 | Vector DB + ingest: chunk uploaded docs, embed, index (e.g. Pinecone / pgvector / Chroma) | RAG index per persona |
| 3.2 | RAG retrieval: on each user turn, semantic search → top-k chunks | Context for prompt |
| 3.3 | LLM integration: system prompt (persona) + RAG chunks + rolling transcript → reply | Agent reply text |
| 3.4 | Pipeline: STT → RAG + LLM → TTS → stream to meeting | Full agent loop |
| 3.5 | Turn detection: simple silence threshold (e.g. 1.2s) to trigger “user finished” | Turn boundaries |

---

### Phase 4 — Polish + multi-agent prep (36–48h)

| # | Task | Output |
|---|------|--------|
| 4.1 | Interruption: if meeting audio has speech while TTS playing → stop TTS, release “floor” | FR4.2 |
| 4.2 | Web search fallback: low RAG confidence or “current info” → call SerpAPI/Tavily, inject into prompt | FR3.3 |
| 4.3 | Turn Coordinator stub: in-memory queue; single agent for MVP, design for 2–3 agents | Ready for FR5 |
| 4.4 | “End Session”: leave meeting, cleanup session, optional post-session rating (1–5) | Session lifecycle |
| 4.5 | Basic error handling, env config, and docs for runbooks | Deploy-ready slice |

---

## Post-MVP (next sprints)

- **Multi-agent (2–3 personas):** Turn Coordinator arbitration, directed addressing (“Socrates, what do you think?”), interjection windows.
- **Scale / reliability:** Agent runtime as container per persona; reconnection and heartbeat; session completion metric.
- **Voice differentiation:** Per-persona TTS voices (tone, accent, depth) for NFR2.

---

## Dependencies to decide early

| Area | Options | Notes |
|------|--------|------|
| Zoom join | Zoom Meeting SDK (browser bot), Zoom App / headless, LiveKit + Zoom bridge | SDK may require app approval; LiveKit gives flexibility |
| STT | Deepgram, AssemblyAI, Whisper API | Latency + cost |
| TTS | ElevenLabs, PlayHT, OpenAI TTS | Distinct voices per persona |
| LLM | OpenAI, Anthropic, open-weight | Token limits for long context |
| Vector DB | Pinecone, pgvector, Chroma, Qdrant | Ease vs. self-host |
| Web search | SerpAPI, Tavily | Rate limits, API keys |

Once these are chosen, add `docs/ARCHITECTURE.md` with concrete service boundaries and data flow.
