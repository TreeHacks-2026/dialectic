import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env from project root (2 levels up from this file)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../../.env') });

import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, type WebSocket } from 'ws';
import path from 'path';
import { RTMSClient } from './rtms-client.js';
import { createWebhookHandler, processWebhookRequest } from './webhook.js';
import { ZoomAPIClient } from './zoom-api.js';
import applyHeaders from './utils/applyHeaders.js';

// Export types for team
import type { TranscriptEvent } from '../../shared/events.js';
export type { TranscriptEvent };

// Create RTMS client (singleton)
const rtmsClient = new RTMSClient();

// Get RTMS credentials - support both naming conventions
// Reference repo uses: ZM_RTMS_CLIENT, ZM_RTMS_SECRET
// Current repo uses: ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET
const RTMS_CLIENT_ID = process.env.ZM_RTMS_CLIENT || process.env.ZOOM_CLIENT_ID || '';
const RTMS_CLIENT_SECRET = process.env.ZM_RTMS_SECRET || process.env.ZOOM_CLIENT_SECRET || '';

// Initialize RTMS client with credentials (matching reference implementation)
if (RTMS_CLIENT_ID && RTMS_CLIENT_SECRET) {
  rtmsClient.initialize({
    clientId: RTMS_CLIENT_ID,
    clientSecret: RTMS_CLIENT_SECRET,
  });
  console.log('[RTMS] ✅ Client initialized with credentials');
} else {
  console.log('[RTMS] ⚠️  RTMS credentials not set - RTMS will not work');
  console.log('[RTMS] 💡 To enable RTMS, set ZM_RTMS_CLIENT and ZM_RTMS_SECRET in .env');
  console.log('[RTMS] 💡 (or ZOOM_CLIENT_ID and ZOOM_CLIENT_SECRET for backward compatibility)');
}

// Create Zoom API client (if credentials are available) - kept for backward compatibility
const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID || null; // Optional - only needed for Server-to-Server OAuth
const zoomAPI = (RTMS_CLIENT_ID && RTMS_CLIENT_SECRET)
  ? new ZoomAPIClient(RTMS_CLIENT_ID, RTMS_CLIENT_SECRET, ZOOM_ACCOUNT_ID || null)
  : null;

// Export the client instance for team to use
export const transcriptService = rtmsClient;

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Create HTTP server for WebSocket support
const server = createServer(app);

// Initialize WebSocket server
const wss = new WebSocketServer({ server });
const wsConnections = new Set<WebSocket>();

// Setup WebSocket connections
wss.on('connection', (ws) => {
  console.log('[WebSocket] New connection');
  wsConnections.add(ws);
  
  ws.send(JSON.stringify({
    type: 'connected',
    message: 'Connected to transcript service'
  }));

  ws.on('close', () => {
    console.log('[WebSocket] Connection closed');
    wsConnections.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('[WebSocket] Error:', error);
    wsConnections.delete(ws);
  });
});

// Broadcast to all WebSocket clients
function broadcastToClients(message: unknown) {
  const messageStr = JSON.stringify(message);
  wsConnections.forEach((ws) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(messageStr);
    }
  });
}

// Set up RTMS connection status callback to broadcast to WebSocket clients
// (matching reference implementation)
rtmsClient.setConnectionStatusCallback((statusMessage: {
  type: 'meeting_started' | 'meeting_stopped';
  streamId?: string;
  message: string;
}) => {
  broadcastToClients(statusMessage);
});

// Middleware - Apply security headers for Zoom Apps
app.use((req, res, next) => {
  applyHeaders(res);
  next();
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Middleware - Parse JSON first
app.use(express.json());

// Middleware - Log incoming requests (after body is parsed)
app.use((req, res, next) => {
  if (req.path !== '/health' && req.path !== '/status') {
    console.log(`[Server] ${req.method} ${req.path}`);
  }
  next();
});

// Webhook handler (matching reference implementation - /webhook endpoint)
app.post('/webhook', (req, res) => {
  console.log('[Webhook] 📥 POST to /webhook');
  const webhookData = req.body;
  
  // Log RTMS events for debugging
  if (webhookData.event === 'meeting.rtms_started' || webhookData.event === 'meeting.rtms_stopped') {
    console.log('[Webhook] 🔍 Event received:', webhookData.event);
    if (webhookData.event === 'meeting.rtms_started') {
      console.log('[Webhook] ✅ RTMS STARTED EVENT RECEIVED!');
      if (process.env.WEBHOOK_DEBUG === 'true') {
        console.log('[Webhook] 📦 Payload keys:', Object.keys(webhookData.payload || {}));
        console.log('[Webhook] 📦 Full payload:', JSON.stringify(webhookData.payload, null, 2));
      }
    }
  }
  
  // Pass ALL events to RTMS handler (it will filter internally, matching reference implementation)
  rtmsClient.handleWebhookEvent(webhookData);
  
  // For RTMS events, return early to avoid double response
  if (webhookData.event === 'meeting.rtms_started' || webhookData.event === 'meeting.rtms_stopped') {
    return res.status(200).send('OK');
  }
  
  // Also handle other events via existing webhook handler
  return processWebhookRequest(req, res, rtmsClient, zoomAPI);
});

// Legacy webhook handler for /zoom/webhook endpoint (kept for backward compatibility)
app.use(createWebhookHandler(rtmsClient, zoomAPI));

// Handle POST requests to root (Zoom sometimes sends webhooks here)
app.post('/', (req, res) => {
  if (req.body?.event) {
    console.log('[Webhook] 📥 POST at root - processing as webhook');
    return processWebhookRequest(req, res, rtmsClient, zoomAPI);
  }
  res.status(200).json({ status: 'ok' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'transcript',
    connected: rtmsClient.isConnected(),
    session_id: rtmsClient.getCurrentSessionId()
  });
});

// Status endpoint
app.get('/status', (req, res) => {
  const isConnected = rtmsClient.isConnected();
  res.json({
    service: 'transcript',
    status: isConnected ? 'connected' : 'disconnected',
    session_id: rtmsClient.getCurrentSessionId(),
    uptime: Math.floor(process.uptime()),
    rtms_initialized: !!RTMS_CLIENT_ID && !!RTMS_CLIENT_SECRET,
    message: isConnected 
      ? 'RTMS connected and ready' 
      : 'Waiting for meeting.rtms_started event from Zoom. Check Zoom App configuration.'
  });
});

// Root endpoint - serve HTML page for Zoom app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start server
server.listen(PORT, () => {
  console.log(`\n🚀 [Transcript Service] Running on port ${PORT}`);
  console.log(`📡 Webhook: http://localhost:${PORT}/webhook`);
  console.log(`🌐 App: http://localhost:${PORT}/`);
  console.log(`❤️  Health: http://localhost:${PORT}/health\n`);
});

// Event listeners for transcript service
rtmsClient.on('transcript', (event: TranscriptEvent) => {
  if (event.is_final) {
    // Transcripts are already printed to terminal in rtms-client.ts
    // Broadcast transcript to WebSocket clients
    broadcastToClients({
      type: 'transcript',
      speaker_name: event.speaker_name,
      text: event.text,
      is_final: event.is_final,
      timestamp: event.ts_ms
    });
  }
});

rtmsClient.on('error', (error: Error) => {
  console.error('❌ [RTMS Error]:', error.message);
});
