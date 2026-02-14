# Context for Claude Code

## Project: Meeting Brain — Core Infrastructure

Build a FastAPI backend that connects to Elastic Cloud with JINA embeddings for hybrid search over meeting transcript data. Deploy on Render.

## What to build

A single `main.py` FastAPI app with these endpoints:

1. **`GET /health`** — Returns ES connection status + cluster name. Render health check path.
2. **`POST /test/index`** — Indexes a hardcoded sample transcript chunk to verify pipeline works.
3. **`GET /test/search?q={query}`** — Hybrid search using BM25 + semantic vector search combined via RRF (Reciprocal Rank Fusion).
4. **`POST /ingest/bulk`** — Accepts JSON array of transcript chunk objects, bulk indexes them to ES.
5. **`POST /search`** — Production search endpoint with optional filters (speaker, date range, meeting_id) and optional JINA reranking.

## Elasticsearch details

**Index name:** `zoom-transcripts`

The index is already created in Elastic Cloud with this mapping (do NOT create it in code):
- `transcript_text` (text) — BM25 search field, has `copy_to: transcript_semantic`
- `transcript_semantic` (semantic_text, inference_id: `jina_embeddings`) — auto-embeds via JINA on ingest
- `meeting_id` (keyword)
- `meeting_title` (text)
- `meeting_date` (date)
- `speaker` (keyword)
- `speakers_list` (keyword array)
- `timestamp_start` (keyword)
- `timestamp_end` (keyword)
- `chunk_index` (integer)
- `duration_minutes` (integer)

**JINA inference endpoints** are already configured in ES:
- `jina_embeddings` — text_embedding endpoint using jina-embeddings-v3
- `jina_rerank` — rerank endpoint using jina-reranker-v2-base-multilingual

**Hybrid search pattern** — use the Retriever API:
```json
{
  "retriever": {
    "rrf": {
      "retrievers": [
        { "standard": { "query": { "match": { "transcript_text": "user query" } } } },
        { "standard": { "query": { "semantic": { "field": "transcript_semantic", "query": "user query" } } } }
      ],
      "rank_window_size": 100,
      "rank_constant": 60
    }
  },
  "size": 10
}
```

**Hybrid search with reranking** — wrap RRF in text_similarity_reranker:
```json
{
  "retriever": {
    "text_similarity_reranker": {
      "retriever": {
        "rrf": {
          "retrievers": [
            { "standard": { "query": { "match": { "transcript_text": "user query" } } } },
            { "standard": { "query": { "semantic": { "field": "transcript_semantic", "query": "user query" } } } }
          ],
          "rank_window_size": 100
        }
      },
      "field": "transcript_text",
      "inference_id": "jina_rerank",
      "inference_text": "user query",
      "rank_window_size": 50
    }
  },
  "size": 5
}
```

**Filtered search** — add bool filters inside the BM25 retriever:
```json
{
  "standard": {
    "query": {
      "bool": {
        "must": [{ "match": { "transcript_text": "query" } }],
        "filter": [
          { "term": { "speaker": "Sarah" } },
          { "range": { "meeting_date": { "gte": "2026-01-01", "lte": "2026-02-14" } } }
        ]
      }
    }
  }
}
```

## POST /search request body schema

```json
{
  "query": "string, required",
  "filters": {
    "speaker": "string, optional",
    "date_from": "ISO date string, optional",
    "date_to": "ISO date string, optional", 
    "meeting_id": "string, optional"
  },
  "size": "int, default 10",
  "use_reranking": "bool, default false"
}
```

Build the ES query dynamically: always use RRF with BM25 + semantic. Apply bool filters if any filter fields are present. Wrap in reranker if use_reranking is true.

## Environment variables

Read from env (use python-dotenv for local dev):
- `ELASTIC_CLOUD_ID` — Elastic Cloud deployment ID
- `ELASTIC_API_KEY` — Elasticsearch API key
- `JINA_API_KEY` — Not used in code (JINA is called by ES internally), but keep for future use

## ES client initialization

```python
from elasticsearch import Elasticsearch
es = Elasticsearch(cloud_id=os.environ["ELASTIC_CLOUD_ID"], api_key=os.environ["ELASTIC_API_KEY"])
```

## Files to create

- `main.py` — FastAPI app with all 5 endpoints
- `requirements.txt` — fastapi, uvicorn[standard], elasticsearch>=8.17.0, python-dotenv, requests
- `render.yaml` — Render Blueprint (web service, python, starter plan, oregon region, health check at /health, env vars with sync: false)
- `.env.example` — template with placeholder values
- `.gitignore` — include .env, __pycache__, .venv

## Constraints

- Use `elasticsearch-py` body parameter for search queries (pass the full retriever JSON as the request body to `es.search()`)
- All endpoints should have try/except with proper error responses (JSONResponse with status_code=500)
- Use `refresh="wait_for"` on index operations so test endpoints return consistent results
- Keep it simple — single file, no routers, no models/schemas, just clean FastAPI
- Return `_source` fields for search results: transcript_text, speaker, meeting_title, meeting_date, timestamp_start

## How to run locally

```bash
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Test flow

1. `curl http://localhost:8000/health` → verify ES connected
2. `curl -X POST http://localhost:8000/test/index` → index sample doc
3. `curl "http://localhost:8000/test/search?q=budget"` → hybrid search returns the doc
4. `curl -X POST http://localhost:8000/search -H "Content-Type: application/json" -d '{"query": "budget allocation", "use_reranking": true}'` → filtered + reranked search
