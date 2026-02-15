# Transcript Service

Receives Zoom RTMS transcripts and emits normalized events.

## Quick Start

```bash
npm install
npm run dev
```

## Usage

```typescript
import { transcriptService, type TranscriptEvent } from '@dialectic/transcript-service';

// Listen for transcripts
transcriptService.on('transcript', (event: TranscriptEvent) => {
  if (event.is_final) {
    console.log(`${event.speaker_name}: ${event.text}`);
  }
});

// Handle errors
transcriptService.on('error', (error) => {
  console.error('Error:', error);
});
```

## Environment

- `ZOOM_WEBHOOK_SECRET` - Required (from Zoom Developer Portal)
- `PORT` - Optional (default: 3001)

## Endpoints

- `POST /zoom/webhook` - Zoom webhook receiver
- `GET /health` - Health check
- `GET /status` - Connection status
