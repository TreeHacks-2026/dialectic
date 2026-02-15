# Testing Guide: Meeting Start/End Detection

This guide explains how to test the improved meeting lifecycle detection system locally.

## How Meeting Start/End Detection Works

### Primary Source: Webhook Events
- **`meeting.rtms_started`**: Zoom sends this when RTMS starts
  - Extracts `rtms_stream_id` or `meeting_uuid` from payload
  - Starts transcript tracking session
  - Initializes RTMS client connection

- **`meeting.rtms_stopped`**: Zoom sends this when RTMS stops
  - Extracts session ID from webhook payload (most reliable)
  - Falls back to RTMS client's current session ID
  - Triggers analysis automatically
  - Cleans up connections

### Secondary/Backup: RTMS Client Events
- **`connected`**: Fired when RTMS client establishes connection
  - Only starts session if not already started (webhook is primary)
  
- **`disconnected`**: Fired when RTMS client loses connection
  - Backup trigger for analysis if webhook was missed

### Fallback: Manual Trigger
- **`POST /api/rtms/analyze-manual`**: Manually trigger analysis
  - Useful for testing or if automatic triggers fail

## Local Testing Steps

### 1. Start the Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

### 2. Check Status Endpoint

Visit: `http://localhost:3000/api/rtms/webhook`

This shows:
- RTMS configuration status
- Current session ID
- Active sessions
- Transcript counts
- Recent transcripts

### 3. Simulate Webhook Events

#### Option A: Use Zoom (Real Meeting)
1. Set up Zoom App with webhook URL pointing to your local server
2. Use a tool like [ngrok](https://ngrok.com/) to expose localhost:
   ```bash
   ngrok http 3000
   ```
3. Update Zoom webhook URL to: `https://your-ngrok-url.ngrok.io/api/rtms/webhook`
4. Start a Zoom meeting with RTMS enabled
5. Watch the server logs for:
   - `[RTMS API] 🟢 Meeting started`
   - `[RTMS API] 📝 Transcript: ...`
   - `[RTMS API] 🔴 Meeting stopped`
   - `[RTMS API] 🔍 Triggering analysis`

#### Option B: Manual Webhook Simulation (Recommended for Testing)

Use `curl` or Postman to simulate webhooks:

**Start Meeting:**
```bash
curl -X POST http://localhost:3000/api/rtms/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "meeting.rtms_started",
    "payload": {
      "meeting_uuid": "test-meeting-123",
      "rtms_stream_id": "test-stream-456",
      "server_urls": "{\"signaling\":\"wss://test.example.com/signaling\"}"
    }
  }'
```

**Send Transcripts (simulate RTMS client):**
The RTMS client will automatically send transcripts when connected. For testing, you can check the status endpoint to see if transcripts are being received.

**Stop Meeting:**
```bash
curl -X POST http://localhost:3000/api/rtms/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "meeting.rtms_stopped",
    "payload": {
      "meeting_uuid": "test-meeting-123",
      "rtms_stream_id": "test-stream-456"
    }
  }'
```

### 4. Check Active Sessions

```bash
curl http://localhost:3000/api/rtms/analyze-manual
```

Returns:
```json
{
  "activeSessions": [
    {
      "sessionId": "test-stream-456",
      "entryCount": 5,
      "currentSession": true
    }
  ],
  "currentSession": "test-stream-456"
}
```

### 5. Manually Trigger Analysis

```bash
curl -X POST http://localhost:3000/api/rtms/analyze-manual \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-stream-456"
  }'
```

Or without sessionId (uses current session):
```bash
curl -X POST http://localhost:3000/api/rtms/analyze-manual \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 6. Check Analysis Results

Visit: `http://localhost:3000/analyses`

Or check the API:
```bash
curl http://localhost:3000/api/analyses
```

## What to Look For in Logs

### Successful Flow:
```
[RTMS API] 📥 Webhook request received
[RTMS API] 📥 Webhook event: meeting.rtms_started
[RTMS API] 🟢 Meeting started - Session ID: test-stream-456
[RTMS API] 📝 Starting transcript tracking for session: test-stream-456
[Transcript Manager] 📝 Started tracking session: test-stream-456
[RTMS API] ✅ Session test-stream-456 initialized and ready for transcripts

... (transcripts arrive) ...

[RTMS API] 📥 Webhook request received
[RTMS API] 📥 Webhook event: meeting.rtms_stopped
[RTMS API] 🔴 Meeting stopped - Session ID: test-stream-456
[RTMS API] 🔍 Triggering analysis for session: test-stream-456
[Meeting Analysis] 🔍 Meeting ended. Analyzing X transcript entries...
[Meeting Analysis] ✅ Analysis complete for session test-stream-456
[Meeting Analysis] 💾 Stored analysis with ID: analysis-...
```

### Common Issues:

1. **No session ID in webhook**: Check logs for `⚠️ Meeting stopped but no session ID found`
   - Solution: The system will try to analyze all active sessions as fallback

2. **Session not started**: Check if `meeting.rtms_started` webhook was received
   - Solution: System auto-starts session on first transcript (safety net)

3. **Analysis not triggered**: Check if `meeting.rtms_stopped` webhook was received
   - Solution: Use manual trigger endpoint `/api/rtms/analyze-manual`

## Environment Variables Needed

Make sure these are set in `.env.local`:
```bash
ZM_RTMS_CLIENT=your_client_id
ZM_RTMS_SECRET=your_client_secret
CLAUDE_API_KEY=your_claude_key
PERPLEXITY_API_KEY=your_perplexity_key
```

## Testing Checklist

- [ ] Server starts without errors
- [ ] Status endpoint shows RTMS configured
- [ ] `meeting.rtms_started` webhook creates session
- [ ] Transcripts are received and stored
- [ ] `meeting.rtms_stopped` webhook triggers analysis
- [ ] Analysis results are saved
- [ ] Analysis appears on `/analyses` page
- [ ] Manual trigger endpoint works
- [ ] Multiple sessions can be tracked
- [ ] Fallback mechanisms work (no session ID, missed webhooks)

## Debugging Tips

1. **Check session state**: `GET /api/rtms/webhook` shows current session info
2. **Check active sessions**: `GET /api/rtms/analyze-manual` lists all sessions
3. **Check stored analyses**: `GET /api/analyses` shows all saved analyses
4. **Watch server logs**: All lifecycle events are logged with emojis for easy scanning
5. **Check transcript manager**: Logs show when transcripts are added

## Next Steps After Testing

Once local testing passes:
1. Deploy to Render
2. Update Zoom webhook URL to Render URL
3. Test with real Zoom meeting
4. Monitor Render logs for the same flow
