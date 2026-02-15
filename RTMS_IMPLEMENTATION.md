# RTMS Implementation - Matching zoom-demeanor-evaluator-node

## Changes Made

Your `dialectic` repo has been updated to match the RTMS handling approach from `zoom-demeanor-evaluator-node`. Here's what was changed:

### 1. **rtms-client.ts** - Complete Rewrite
   - Now matches the reference implementation pattern
   - Uses `clientId` and `clientSecret` in RTMS Client constructor
   - Handles webhook events directly via `handleWebhookEvent()` method
   - Creates RTMS client when `meeting.rtms_started` event is received
   - Joins meeting using webhook payload directly: `client.join(payload)`
   - Manages multiple RTMS clients using a Map keyed by `streamId`

### 2. **index.ts** - Updated Initialization
   - Initializes RTMS client with credentials on startup
   - Supports both environment variable naming conventions:
     - `ZM_RTMS_CLIENT` / `ZM_RTMS_SECRET` (reference repo style)
     - `ZOOM_CLIENT_ID` / `ZOOM_CLIENT_SECRET` (backward compatibility)
   - Added `/webhook` endpoint matching reference implementation

### 3. **webhook.ts** - Simplified RTMS Handling
   - Removed old `connect()` and `connectWithPayload()` method calls
   - Now handles `meeting.rtms_started` and `meeting.rtms_stopped` events directly
   - Passes webhook data to `rtmsClient.handleWebhookEvent()` method

### 4. **Type Definitions**
   - Added `src/types/rtms.d.ts` with proper TypeScript definitions
   - Matches the reference implementation's type structure

### 5. **TypeScript Config**
   - Updated `tsconfig.json` to include shared types from parent directory

## How to Finish Setup

### Step 1: Update Environment Variables

Add to your `.env` file in the project root:

```env
# RTMS Credentials (use either naming convention)
ZM_RTMS_CLIENT=your_zoom_client_id
ZM_RTMS_SECRET=your_zoom_client_secret

# OR (backward compatible)
ZOOM_CLIENT_ID=your_zoom_client_id
ZOOM_CLIENT_SECRET=your_zoom_client_secret
```

Get these from your [Zoom App Marketplace](https://marketplace.zoom.us/) page.

### Step 2: Set Up Zoom App Webhooks

1. Go to your Zoom App in the [Marketplace](https://marketplace.zoom.us/)
2. Navigate to **Features** → **Event Subscriptions**
3. Subscribe to these events:
   - `meeting.rtms_started` ✅ **REQUIRED**
   - `meeting.rtms_stopped` ✅ **REQUIRED**
   - (Optional: `meeting.started`, `meeting.ended` for tracking)

4. Set your **Webhook URL** to:
   ```
   https://your-ngrok-url.ngrok-free.app/webhook
   ```
   Or if using the legacy endpoint:
   ```
   https://your-ngrok-url.ngrok-free.app/zoom/webhook
   ```

### Step 3: Enable RTMS in Zoom Desktop

1. Open Zoom desktop app
2. Go to **Settings** → **Profile** → **Zoom Apps**
3. Enable **"Share realtime meeting content with apps"**
4. Enable **"Auto-start apps that access shared realtime meeting content"** for your app

### Step 4: Set Up Ngrok (if not already done)

```bash
# Install ngrok if needed
brew install ngrok  # macOS
# OR download from https://ngrok.com/download

# Start ngrok tunnel
ngrok http 3001
```

Copy the ngrok URL and update your Zoom App webhook URL.

### Step 5: Test the Implementation

1. **Start the service:**
   ```bash
   cd packages/transcript-service
   npm run dev
   ```

2. **Start a Zoom meeting** with RTMS enabled

3. **Check logs** - You should see:
   ```
   [RTMS] Processing webhook event: meeting.rtms_started
   [RTMS] Joining meeting with stream ID: <stream_id>
   [RTMS] 📝 <Speaker>: "<transcript text>"
   ```

## How It Works Now

1. **Webhook receives `meeting.rtms_started`** → Creates RTMS client with credentials
2. **RTMS client joins** using webhook payload directly
3. **Event handlers set up** for transcript, video, and audio data
4. **Transcript events emitted** via EventEmitter for your other services to consume
5. **Webhook receives `meeting.rtms_stopped`** → Client leaves and cleans up

## Next Steps

The RTMS handling is now complete and matches the reference implementation. You can:

1. **Connect to transcript events** from other services:
   ```typescript
   import { transcriptService } from '@dialectic/transcript-service';
   
   transcriptService.on('transcript', (event) => {
     console.log(`${event.speaker_name}: ${event.text}`);
   });
   ```

2. **Add your own processing logic** - The transcript data is now flowing, you can add:
   - AI processing (like Inworld in the reference)
   - Database storage
   - Real-time analysis
   - WebSocket broadcasting to frontend

3. **Handle video/audio data** - Uncomment and implement the handlers in `rtms-client.ts` if needed

## Troubleshooting

- **No RTMS data?** Check:
  - Environment variables are set correctly
  - Zoom App has RTMS scopes enabled
  - Webhook URL is correct in Zoom App settings
  - RTMS sharing is enabled in Zoom desktop settings
  - Check logs with `LOG_LEVEL=DEBUG`

- **TypeScript errors?** Run `npm run build` to verify types

- **Webhook not receiving events?** Verify:
  - Ngrok tunnel is running
  - Webhook URL matches in Zoom App
  - Event subscriptions are enabled

## Differences from Reference

The reference implementation includes:
- Inworld AI integration (evaluation graphs)
- WebSocket server for frontend
- Video frame processing with Sharp
- Frontend UI

**You've implemented:** ✅ RTMS handling only (as requested)

**You can add later:**
- Your own AI/processing logic
- WebSocket server if needed
- Video/audio processing
- Frontend integration
