# PRD: Meeting Brain — Core Infrastructure (Render + Elasticsearch)

## Goal
Get a FastAPI backend deployed on Render that connects to Elastic Cloud with JINA embeddings, supports hybrid search (BM25 + vector via RRF), and exposes REST endpoints for indexing and querying meeting transcript chunks. This is the foundation layer — Zoom integration, Agent Builder, and frontend come later.

## Success Criteria
- [ ] FastAPI app running on Render at a public URL
- [ ] App connects to Elastic Cloud and passes health check
- [ ] Can index a transcript chunk via POST endpoint (auto-embeds via JINA `semantic_text`)
- [ ] Can search via GET endpoint using hybrid search (BM25 + kNN + RRF)
- [ ] Can bulk-index multiple chunks in one request
- [ ] `/health` returns ES cluster status

---

## Architecture

```
[Client / curl / Frontend]
        │
        ▼
┌──────────────────────┐
│  FastAPI on Render    │
│  (Python 3.11)       │
│  - /health           │
│  - /test/index       │
│  - /test/search?q=   │
│  - /ingest/bulk      │
│  - /search           │
└──────┬───────────────┘
       │ elasticsearch-py
       ▼
┌──────────────────────┐
│  Elastic Cloud       │
│  (Serverless)        │
│  - Index:            │
│    zoom-transcripts  │
│  - JINA inference    │
│    endpoint          │
│  - semantic_text     │
│    auto-embeds       │
└──────────────────────┘
```

---

## Elasticsearch Index: `zoom-transcripts`

### Mapping

| Field | Type | Purpose |
|---|---|---|
| `transcript_text` | `text` | BM25 full-text search. `copy_to: transcript_semantic` |
| `transcript_semantic` | `semantic_text` (inference_id: `jina_embeddings`) | Auto-chunks + auto-embeds via JINA. Enables vector search. |
| `meeting_id` | `keyword` | Unique meeting identifier |
| `meeting_title` | `text` | Meeting name/topic |
| `meeting_date` | `date` | ISO 8601 datetime |
| `speaker` | `keyword` | Comma-separated speaker names for this chunk |
| `speakers_list` | `keyword` (array) | Array of speaker names for filtering |
| `timestamp_start` | `keyword` | HH:MM:SS start time in recording |
| `timestamp_end` | `keyword` | HH:MM:SS end time in recording |
| `chunk_index` | `integer` | Order of this chunk within the meeting |
| `duration_minutes` | `integer` | Total meeting duration |

### Prerequisites (run manually in Kibana Dev Tools before deploying)

1. Create JINA embedding inference endpoint (`jina-embeddings-v3`)
2. Create JINA reranker inference endpoint (`jina-reranker-v2-base-multilingual`)
3. Create `zoom-transcripts` index with mapping above

---

## API Endpoints

### `GET /health`
Returns ES connection status and cluster name. Render uses this as the health check.

**Response 200:**
```json
{ "status": "healthy", "elasticsearch": "connected", "cluster": "my-cluster" }
```
**Response 500:**
```json
{ "status": "unhealthy", "error": "connection refused" }
```

### `POST /test/index`
Index a hardcoded sample transcript chunk. Used to verify the full pipeline (FastAPI → ES → JINA embedding) works.

**Response 200:**
```json
{ "status": "indexed", "id": "abc123", "result": "created" }
```

### `GET /test/search?q={query}`
Run hybrid search (BM25 + semantic via RRF) against `zoom-transcripts`.

**Query params:**
- `q` (string, required): search query

**Response 200:**
```json
{
  "total": 3,
  "results": [
    {
      "score": 0.87,
      "transcript_text": "[00:05:30] Alice: We need to finalize...",
      "speaker": "Alice",
      "meeting_title": "Product Standup",
      "meeting_date": "2026-02-14T14:00:00Z",
      "timestamp_start": "00:05:30"
    }
  ]
}
```

### `POST /ingest/bulk`
Bulk index an array of transcript chunks.

**Request body:** JSON array of chunk objects matching the index mapping.

**Response 200:**
```json
{ "indexed": 10, "errors": 0, "error_details": [] }
```

### `POST /search`
Advanced search with optional filters. This is the production search endpoint.

**Request body:**
```json
{
  "query": "What did Sarah say about the budget?",
  "filters": {
    "speaker": "Sarah",
    "date_from": "2026-01-01",
    "date_to": "2026-02-14",
    "meeting_id": "optional-specific-meeting"
  },
  "size": 10,
  "use_reranking": true
}
```

**Search strategy:**
1. Build BM25 `match` query on `transcript_text` with optional `bool` filters on speaker/date/meeting_id
2. Build `semantic` query on `transcript_semantic`
3. Combine via RRF retriever (`rank_window_size: 100`, `rank_constant: 60`)
4. If `use_reranking: true`, wrap in `text_similarity_reranker` using `jina_rerank`
5. Return top `size` results with `_source` fields

**Response 200:**
```json
{
  "total": 15,
  "results": [
    {
      "score": 0.92,
      "transcript_text": "...",
      "speaker": "Sarah",
      "meeting_title": "Budget Review",
      "meeting_date": "2026-02-10T09:00:00Z",
      "timestamp_start": "00:12:45"
    }
  ]
}
```

---

## Project Structure

```
meeting-brain/
├── main.py              # FastAPI app with all endpoints
├── requirements.txt     # Python dependencies
├── render.yaml          # Render Blueprint deployment config
├── .env.example         # Template for local env vars
├── .env                 # Local secrets (gitignored)
└── .gitignore
```

---

## Environment Variables

| Variable | Where to get it |
|---|---|
| `ELASTIC_CLOUD_ID` | Elastic Cloud → Deployment → Manage → Cloud ID |
| `ELASTIC_API_KEY` | Kibana → Stack Management → API Keys → Create |
| `JINA_API_KEY` | https://jina.ai/embeddings → API Key |

---

## Render Deployment

- **Service type:** Web Service
- **Runtime:** Python 3.11
- **Plan:** Starter ($7/mo) — no cold starts
- **Region:** Oregon
- **Build command:** `pip install -r requirements.txt`
- **Start command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Health check:** `/health`
- **Auto-deploy:** On push to `main` branch

---

## Tech Stack

- **Python 3.11** + **FastAPI** (async web framework)
- **elasticsearch-py 8.17+** (official ES client)
- **Elastic Cloud Serverless** (managed Elasticsearch)
- **JINA embeddings v3** (1024-dim vectors, via ES Open Inference API)
- **JINA reranker v2** (for result reranking)
- **Render** (deployment platform)

---

## Out of Scope (for now)

- Zoom webhook integration
- Zoom Team Chat bot
- Elastic Agent Builder / Converse API
- Elastic Workflows
- Frontend / UI
- Authentication / multi-tenancy
- VTT transcript parsing
