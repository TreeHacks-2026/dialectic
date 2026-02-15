# PRD: Dialetic — AI Teaching Assistant with Avatar Office Hours

## Overview
**Dialetic** is a web app where students interact with a HeyGen AI avatar tutor that answers questions about their course materials in real-time. The system uses Elasticsearch with JINA embeddings for RAG over course content, and a HeyGen streaming avatar as the conversational interface. Built as a Next.js app deployed on Render.

## Tech Stack
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend:** Next.js API routes
- **Database/Search:** Elasticsearch Cloud (with JINA embeddings via Elastic's integration)
- **Avatar:** HeyGen Streaming Avatar SDK (`@heygen/streaming-avatar`)
- **LLM:** OpenAI GPT-4o (or Claude) for answer generation
- **Deployment:** Render

## Architecture

```
User (browser)
  ↕ WebSocket/REST
Next.js App (Render)
  ├── /api/ingest     → Parse & embed docs → Elasticsearch
  ├── /api/chat       → Query Elastic → LLM → return answer text
  └── /app/tutor      → HeyGen Streaming Avatar UI
        ↕ 
  HeyGen Streaming API (avatar speaks the LLM answer)
```

## Core Features

### 1. Document Ingestion Pipeline (`/api/ingest`)
- **Input:** Accept PDF, TXT, and Markdown file uploads (lecture notes, textbook excerpts, syllabi)
- **Processing:**
  1. Extract text from uploaded files (use `pdf-parse` for PDFs)
  2. Chunk text into ~500 token passages with ~50 token overlap
  3. Generate embeddings using JINA via Elasticsearch's inference API (model: `jina-embeddings-v3`)
  4. Index chunks into Elasticsearch with fields:
     - `content` (text)
     - `embedding` (dense_vector)
     - `source_filename` (keyword)
     - `chunk_index` (integer)
     - `course_name` (keyword)
- **Elasticsearch Index Config:**
  - Index name: `course-materials`
  - Use Elastic's inference endpoint for JINA embeddings
  - Set up an ingest pipeline that auto-embeds on index

### 2. RAG Query Engine (`/api/chat`)
- **Input:** `{ question: string, course_name?: string, chat_history?: Message[] }`
- **Flow:**
  1. Embed the user question using the same JINA model
  2. Run hybrid search on Elasticsearch:
     - KNN vector search on `embedding` field (k=5)
     - BM25 text search on `content` field
     - Combine with RRF (Reciprocal Rank Fusion)
  3. Take top 5 chunks as context
  4. Send to LLM with system prompt:
     ```
     You are a helpful teaching assistant. Answer the student's question
     using ONLY the provided course material context. If the context
     doesn't contain enough information, say so honestly. Keep answers
     clear, concise, and educational. When relevant, point students to
     which source document contains more detail.
     ```
  5. Include chat_history for multi-turn conversation support
  6. Return `{ answer: string, sources: { filename: string, chunk: string }[] }`

### 3. HeyGen Avatar Interface (`/app/tutor`)
- **Setup:**
  1. Call HeyGen API to create a streaming session (`/v1/streaming.new`)
  2. Initialize with a chosen avatar ID and voice ID
  3. Render the avatar video stream in a prominent card on the page
- **Interaction Loop:**
  1. Student types a question in a chat input (or uses browser speech-to-text)
  2. Frontend sends question to `/api/chat`
  3. Receive answer text
  4. Send answer text to HeyGen streaming avatar via `avatar.speak({ text: answer })`
  5. Avatar speaks the answer with lip-synced video
  6. Display the text answer + sources in a side panel simultaneously
- **UI Layout:**
  ```
  ┌─────────────────────────────────────────────┐
  │  [Course Name Selector]        [Upload Docs] │
  ├──────────────────────┬──────────────────────┤
  │                      │   Chat History        │
  │   HeyGen Avatar      │   - Q: ...            │
  │   (video stream)     │   - A: ... [sources]  │
  │                      │   - Q: ...            │
  │                      │   - A: ... [sources]  │
  ├──────────────────────┴──────────────────────┤
  │  [🎤]  Type your question...        [Send]  │
  └─────────────────────────────────────────────┘
  ```

### 4. Upload / Course Management Page (`/app/upload`)
- Simple page to:
  - Create a "course" (just a name string)
  - Upload files to that course (calls `/api/ingest`)
  - See list of indexed documents per course
  - Delete documents from the index

## API Routes

### `POST /api/ingest`
```typescript
// Request: multipart/form-data
// Fields: file (File), course_name (string)
// Response: { success: boolean, chunks_indexed: number }
```

### `POST /api/chat`
```typescript
// Request JSON:
{
  question: string;
  course_name?: string;
  chat_history?: { role: "user" | "assistant"; content: string }[];
}
// Response JSON:
{
  answer: string;
  sources: { filename: string; excerpt: string }[];
}
```

### `POST /api/heygen/session`
```typescript
// Creates a new HeyGen streaming session
// Response: { session_id: string, access_token: string }
```

### `GET /api/courses`
```typescript
// Response: { courses: { name: string; doc_count: number }[] }
```

## Environment Variables
```
ELASTICSEARCH_URL=         # Elastic Cloud endpoint
ELASTICSEARCH_API_KEY=     # Elastic API key
JINA_API_KEY=              # For JINA embeddings (if not using Elastic inference)
OPENAI_API_KEY=            # For LLM answer generation
HEYGEN_API_KEY=            # HeyGen streaming avatar API key
```

## Implementation Order
1. **Elasticsearch setup** — Create index with mapping, configure JINA inference endpoint, test embedding + search
2. **Ingest pipeline** — File upload → chunk → embed → index
3. **RAG chat endpoint** — Hybrid search + LLM answer generation
4. **Basic chat UI** — Text-only chat interface to test RAG quality
5. **HeyGen avatar integration** — Streaming session + speak API
6. **Upload management UI** — Course creation, file upload, document list
7. **Polish** — Loading states, error handling, responsive design
8. **Deploy to Render** — Set up as a Web Service, configure env vars

## Elasticsearch Index Mapping
```json
{
  "mappings": {
    "properties": {
      "content": { "type": "text" },
      "embedding": {
        "type": "dense_vector",
        "dims": 1024,
        "index": true,
        "similarity": "cosine"
      },
      "source_filename": { "type": "keyword" },
      "chunk_index": { "type": "integer" },
      "course_name": { "type": "keyword" },
      "created_at": { "type": "date" }
    }
  }
}
```

## Key Design Decisions
- **No auth for hackathon** — Skip login/signup, anyone can use it
- **No database besides Elasticsearch** — Course metadata lives in ES, no need for Postgres
- **Stream LLM responses** — Use streaming for the text chat panel so it feels fast, but send the complete answer to HeyGen (avatar needs full text to speak)
- **Fallback if HeyGen is slow** — Always show text answer immediately; avatar speaking is a bonus layer
- **Keep file processing simple** — PDFs and text files only, no OCR or complex parsing

## Demo Script (for judges)
1. Show uploading a set of lecture notes for "Intro to Machine Learning"
2. Ask the avatar: "Can you explain gradient descent?"
3. Avatar speaks a clear answer, sources panel shows which lecture the info came from
4. Follow-up: "How is that different from stochastic gradient descent?"
5. Show the avatar handling multi-turn context
6. Highlight: Elasticsearch hybrid search, JINA embeddings, HeyGen real-time avatar, deployed on Render
