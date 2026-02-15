# Local Debugging Guide

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Environment Variables

Create or update `.env` file in the root directory with:

```bash
# RTMS Credentials (you already have these)
ZM_RTMS_CLIENT=your_zoom_client_id
ZM_RTMS_SECRET=your_zoom_client_secret
ZOOM_WEBHOOK_SECRET=your_webhook_secret

# LLM API Keys (NEW - required for multi-agent system)
CLAUDE_API_KEY=your_claude_api_key
PERPLEXITY_API_KEY=your_perplexity_api_key

# Optional: App URL for local testing
NEXT_PUBLIC_APP_URL=http://localhost:3000
PORT=3000
```

## Step 3: Test Build Locally

```bash
# Test if the build works (catches import errors, type errors, etc.)
npm run build
```

This will:
- ✅ Check if all imports resolve correctly
- ✅ Verify TypeScript compilation
- ✅ Catch any build-time errors before deploying

## Step 4: Run Development Server

```bash
npm run dev
```

This starts Next.js on `http://localhost:3000`

## Step 5: Test the LLM Endpoint

### Option A: Using curl

```bash
# Test the LLM endpoint
curl -X POST http://localhost:3000/api/llm/process \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "What is machine learning?",
    "speaker": "John",
    "timestamp": 1234567890
  }'
```

### Option B: Using a test script

Create `test-llm.js`:

```javascript
const fetch = require('node-fetch');

async function testLLM() {
  const response = await fetch('http://localhost:3000/api/llm/process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transcript: 'What is machine learning?',
      speaker: 'John',
      timestamp: Date.now()
    })
  });

  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));
}

testLLM().catch(console.error);
```

Run it:
```bash
node test-llm.js
```

### Option C: Using browser/Postman

1. Start dev server: `npm run dev`
2. Open browser to `http://localhost:3000`
3. Use browser DevTools or Postman to POST to `/api/llm/process`

## Step 6: Check for Errors

### Build Errors
```bash
npm run build
```
Look for:
- ❌ Module not found errors
- ❌ TypeScript errors
- ❌ Import path issues

### Runtime Errors
Watch the terminal where `npm run dev` is running for:
- ❌ API key missing errors
- ❌ Config file not found
- ❌ Agent system initialization errors

## Step 7: Verify Multi-Agent System

Check the console output when testing. You should see:

```
[LLM] ✅ Multi-agent system initialized
[LLM] Agents: Dr. Thesis, Dev, Sage
[LLM] 📝 Processing transcript from John: What is machine learning?...
[SELECTOR] Chose Dr. Thesis: [reasoning]
[LLM] ✅ Agent Dr. Thesis responded
[LLM] 📄 Response: [agent response]...
```

## Step 8: Test Full RTMS Pipeline (Optional)

If you want to test the full pipeline locally:

1. Set up ngrok or similar tunnel:
   ```bash
   ngrok http 3000
   ```

2. Update Zoom webhook URL to your ngrok URL:
   ```
   https://your-ngrok-url.ngrok-free.app/api/rtms/webhook
   ```

3. Start a Zoom meeting with RTMS enabled

4. Watch logs for:
   - Webhook received
   - RTMS connection
   - Transcripts processed
   - LLM responses generated

## Common Issues & Fixes

### Issue: "Module not found: Can't resolve '@/config/config.json'"
**Fix:** Make sure `src/config/config.json` exists

### Issue: "CLAUDE_API_KEY and PERPLEXITY_API_KEY must be set"
**Fix:** Add API keys to `.env` file

### Issue: "Build succeeds but runtime fails"
**Fix:** Check that `.env` file is in root directory and variables are set correctly

### Issue: "TypeScript errors"
**Fix:** Run `npm run build` to see specific errors, then fix them

## Quick Debug Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file created with all required keys
- [ ] Build succeeds (`npm run build`)
- [ ] Dev server starts (`npm run dev`)
- [ ] LLM endpoint responds (`curl` or test script)
- [ ] No errors in console
- [ ] Agent system initializes correctly

## Next Steps After Local Testing

Once everything works locally:
1. ✅ Commit your changes
2. ✅ Push to GitHub
3. ✅ Deploy to Render
4. ✅ Add environment variables in Render dashboard
5. ✅ Test on production
