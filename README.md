# Dialectic

Real-time multi-agent AI moderator system for Zoom meetings.

## Setup

```bash
npm install
```

## Run Services

```bash
# Transcript service (Person 1)
npm run dev:transcript

# Next.js web app
npm run dev
```

## Project Structure

- `packages/transcript-service/` - Zoom transcript ingestion
- `packages/shared/` - Shared types and interfaces
- `src/` - Next.js web application with AI tutor interface

## Web Application

The project includes a Next.js web application with:
- AI tutor interface with LiveAvatar integration
- Zoom speech-to-text API integration
- Elasticsearch for document search
- Chat interface for course interactions

Open [http://localhost:3000](http://localhost:3000) to access the web application.
