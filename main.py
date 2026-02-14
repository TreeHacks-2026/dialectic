import os
from typing import Optional

from dotenv import load_dotenv
from elasticsearch import Elasticsearch
from elasticsearch.helpers import bulk
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

load_dotenv()

app = FastAPI(title="Meeting Brain API")

ALLOWED_ORIGINS = [
    os.environ.get("FRONTEND_URL", "http://localhost:3000"),
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

es = Elasticsearch(
    os.environ["ELASTIC_URL"],
    api_key=os.environ["ELASTIC_API_KEY"],
)

INDEX_NAME = "zoom-transcripts"

SOURCE_FIELDS = [
    "transcript_text",
    "speaker",
    "meeting_title",
    "meeting_date",
    "timestamp_start",
]


# ---------------------------------------------------------------------------
# GET /health
# ---------------------------------------------------------------------------
@app.get("/health")
async def health():
    try:
        info = es.info()
        return {
            "status": "connected",
            "cluster_name": info["cluster_name"],
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


# ---------------------------------------------------------------------------
# POST /test/index
# ---------------------------------------------------------------------------
@app.post("/test/index")
async def test_index():
    try:
        sample_doc = {
            "transcript_text": "We need to finalize the budget allocation for Q3. Sarah suggested increasing the marketing spend by 15 percent.",
            "meeting_id": "meeting-001",
            "meeting_title": "Q3 Budget Planning",
            "meeting_date": "2026-01-15",
            "speaker": "John",
            "speakers_list": ["John", "Sarah", "Mike"],
            "timestamp_start": "00:05:30",
            "timestamp_end": "00:06:15",
            "chunk_index": 0,
            "duration_minutes": 45,
        }
        result = es.index(
            index=INDEX_NAME,
            document=sample_doc,
            refresh="wait_for",
        )
        return {"result": result["result"], "id": result["_id"]}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


# ---------------------------------------------------------------------------
# GET /test/search?q={query}
# ---------------------------------------------------------------------------
@app.get("/test/search")
async def test_search(q: str):
    try:
        body = {
            "retriever": {
                "rrf": {
                    "retrievers": [
                        {
                            "standard": {
                                "query": {"match": {"transcript_text": q}}
                            }
                        },
                        {
                            "standard": {
                                "query": {
                                    "semantic": {
                                        "field": "transcript_semantic",
                                        "query": q,
                                    }
                                }
                            }
                        },
                    ],
                    "rank_window_size": 100,
                    "rank_constant": 60,
                }
            },
            "size": 10,
            "_source": SOURCE_FIELDS,
        }
        resp = es.search(index=INDEX_NAME, body=body)
        hits = [
            {"id": h["_id"], "score": h["_score"], "source": h["_source"]}
            for h in resp["hits"]["hits"]
        ]
        return {"total": resp["hits"]["total"]["value"], "hits": hits}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


# ---------------------------------------------------------------------------
# POST /ingest/bulk
# ---------------------------------------------------------------------------
@app.post("/ingest/bulk")
async def ingest_bulk(docs: list[dict]):
    try:
        actions = [
            {"_index": INDEX_NAME, "_source": doc}
            for doc in docs
        ]
        success, errors = bulk(es, actions, refresh="wait_for")
        return {"indexed": success, "errors": errors}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


# ---------------------------------------------------------------------------
# POST /search
# ---------------------------------------------------------------------------
class SearchRequest(BaseModel):
    query: str
    filters: Optional[dict] = None
    size: int = 10
    use_reranking: bool = False


@app.post("/search")
async def search(req: SearchRequest):
    try:
        # Build BM25 retriever — plain match or bool with filters
        filters_list = []
        if req.filters:
            if req.filters.get("speaker"):
                filters_list.append({"term": {"speaker": req.filters["speaker"]}})
            if req.filters.get("meeting_id"):
                filters_list.append({"term": {"meeting_id": req.filters["meeting_id"]}})
            date_range = {}
            if req.filters.get("date_from"):
                date_range["gte"] = req.filters["date_from"]
            if req.filters.get("date_to"):
                date_range["lte"] = req.filters["date_to"]
            if date_range:
                filters_list.append({"range": {"meeting_date": date_range}})

        if filters_list:
            bm25_query = {
                "bool": {
                    "must": [{"match": {"transcript_text": req.query}}],
                    "filter": filters_list,
                }
            }
        else:
            bm25_query = {"match": {"transcript_text": req.query}}

        # RRF combining BM25 + semantic
        rrf_retriever = {
            "rrf": {
                "retrievers": [
                    {"standard": {"query": bm25_query}},
                    {
                        "standard": {
                            "query": {
                                "semantic": {
                                    "field": "transcript_semantic",
                                    "query": req.query,
                                }
                            }
                        }
                    },
                ],
                "rank_window_size": 100,
            }
        }

        # Optionally wrap with reranker
        if req.use_reranking:
            retriever = {
                "text_similarity_reranker": {
                    "retriever": rrf_retriever,
                    "field": "transcript_text",
                    "inference_id": "jina_rerank",
                    "inference_text": req.query,
                    "rank_window_size": 50,
                }
            }
        else:
            rrf_retriever["rrf"]["rank_constant"] = 60
            retriever = rrf_retriever

        body = {
            "retriever": retriever,
            "size": req.size,
            "_source": SOURCE_FIELDS,
        }

        resp = es.search(index=INDEX_NAME, body=body)
        hits = [
            {"id": h["_id"], "score": h["_score"], "source": h["_source"]}
            for h in resp["hits"]["hits"]
        ]
        return {"total": resp["hits"]["total"]["value"], "hits": hits}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
