# Dialectic — Architecture (MVP)

## High-level system diagram

```mermaid
flowchart TB
    subgraph User
        Browser[Web App]
        Zoom[Zoom Meeting]
    end

    subgraph Dialectic["Dialectic Platform"]
        SessionMgr[Session Manager]
        TurnCoord[Turn Coordinator]
        subgraph AgentRuntimes["Agent Runtimes (1 per persona)"]
            A1[Agent 1: STT + LLM + RAG + TTS]
            A2[Agent 2: ...]
        end
    end

    subgraph External
        VectorDB[(Vector DB)]
        WebSearch[Web Search API]
        LLM[LLM API]
    end

    Browser -->|Zoom link, persona selection| SessionMgr
    SessionMgr -->|Spawn & config| AgentRuntimes
    SessionMgr --> TurnCoord

    Zoom <-->|Audio stream| A1
    Zoom <-->|Audio stream| A2

    A1 --> TurnCoord
    A2 --> TurnCoord
    TurnCoord -->|Floor grant| A1
    TurnCoord -->|Floor grant| A2

    A1 --> VectorDB
    A1 --> LLM
    A1 --> WebSearch
    A2 --> VectorDB
    A2 --> LLM
    A2 --> WebSearch
```

---

## Data flow (single turn)

1. **User speaks in Zoom** → meeting audio mix (and/or transcript) available to each joined agent.
2. **STT** (per agent or shared pipeline) → text segment.
3. **Turn Coordinator** decides which agent has the floor (directed address, urgency, or round-robin).
4. **RAG:** query vector DB with segment + persona docs → top-k chunks.
5. **LLM:** system prompt (persona) + RAG chunks + rolling transcript + optional web search result → reply text.
6. **TTS** → audio stream.
7. **Meeting client** streams agent audio into Zoom.
8. **Interruption:** if user (or another agent) speech detected while TTS playing → halt TTS, yield floor.

---

## Component roles

| Component | Responsibility | MVP note |
|-----------|----------------|----------|
| **Web App** | Persona config, Zoom link input, Start/End Session, optional rating | Next.js |
| **Session Manager** | Create session, spawn agent runtimes, pass Zoom credentials/config | One session = one meeting + N agents |
| **Agent Runtime** | STT → RAG + LLM → TTS; join meeting as one participant | One process/container per persona |
| **Turn Coordinator** | Floor arbitration; single speaker; silence/queue logic | Non-LLM; Redis or in-memory |
| **Meeting Connection** | Join Zoom (or LiveKit room), send/receive audio | Per agent |

---

## Security & config

- Zoom link and credentials must not be logged or stored in plain text beyond what’s needed for the session.
- API keys (LLM, STT, TTS, vector DB, web search) in env vars or secret manager; no keys in frontend.
- Document upload: validate type (PDF/TXT) and size (10MB cap per persona) server-side.

---

*For 48h build order and tech choices, see [ROADMAP.md](ROADMAP.md).*
