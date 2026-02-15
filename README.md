# Dialectic

**AI Persona Seminar Platform (MVP)** — Invite AI-powered agent personas into Zoom for Socratic-style educational discussions.

- **Configure** personas with names, prompts, and documents (PDF/TXT).
- **Join** a Zoom meeting with 1–3 agents as distinct participants.
- **Discuss** via voice; agents use RAG + live transcript and optional web search.

See [docs/PRD.md](docs/PRD.md) for full product requirements and [docs/ROADMAP.md](docs/ROADMAP.md) for the implementation roadmap.

## Repo structure (target)

```
dialectic/
├── apps/
│   ├── web/          # Next.js — persona config, Zoom link, session control
│   └── agent/        # Agent runtime (STT, LLM, RAG, TTS) per persona
├── packages/
│   ├── turn-coordinator/   # Floor / single-speaker arbitration
│   ├── meeting-client/     # Zoom/WebRTC join + audio stream
│   ├── debate-analysis/    # Post-meeting transcript analysis + rubric feedback (LLM)
│   └── shared/             # Types, config, env contracts
├── docs/
│   ├── PRD.md
│   ├── ROADMAP.md
│   └── ARCHITECTURE.md
└── README.md
```

## Quick start (after scaffold)

```bash
# Install
pnpm install

# Run web app
pnpm --filter web dev

# Run agent runtime (per persona, see ROADMAP)
pnpm --filter agent dev
```

## Tech stack (MVP)

- **Frontend:** Next.js, React
- **Meeting:** Zoom Meeting SDK or headless client / LiveKit
- **Voice:** STT + TTS (provider TBD)
- **AI:** LLM + vector DB (RAG) + optional web search API
- **Post-meeting:** Rubric-based debate analysis (e.g. Perplexity) — see [docs/DEBATE_ANALYSIS.md](docs/DEBATE_ANALYSIS.md)

---

*Working title: Dialectic.*
