import express from 'express';
import crypto from 'crypto';
import { RTMSClient } from './rtms-client.js';
import { ZoomAPIClient } from './zoom-api.js';

// Track active meetings to filter out stale meeting.ended events
const activeMeetings = new Map<string, string>(); // meetingId -> startTime

// Process webhook request
function processWebhookRequest(req: express.Request, res: express.Response, rtmsClient: RTMSClient, zoomAPI: ZoomAPIClient | null) {
    const event = req.body.event || 'unknown event';
    const payload = req.body.payload || {};
    
    // DEBUG MODE: Configurable via environment variable
    const DEBUG_MODE = process.env.WEBHOOK_DEBUG === 'true';
    
    // Comprehensive logging (only in debug mode)
    if (DEBUG_MODE) {
      console.log('\n' + '='.repeat(80));
      console.log('[Webhook] 📥 RAW WEBHOOK DATA FROM ZOOM');
      console.log('='.repeat(80));
      console.log('[Webhook] Event Name:', event);
      console.log('[Webhook] Event Timestamp:', req.body.event_ts || 'N/A');
      console.log('[Webhook] Full Request Body:', JSON.stringify(req.body, null, 2));
      console.log('[Webhook] Request Headers:', JSON.stringify(req.headers, null, 2));
      console.log('[Webhook] Payload Keys:', Object.keys(payload).join(', '));
      if (payload.object) {
        console.log('[Webhook] Payload Object Keys:', Object.keys(payload.object).join(', '));
        console.log('[Webhook] Payload Object:', JSON.stringify(payload.object, null, 2));
      }
      if (Object.keys(payload).length > 0 && !payload.object) {
        console.log('[Webhook] Full Payload:', JSON.stringify(payload, null, 2));
      }
      console.log('='.repeat(80) + '\n');
    }
    
    // Get secret when handler is called (after dotenv has loaded)
    const ZOOM_WEBHOOK_SECRET = process.env.ZOOM_WEBHOOK_SECRET;
    
    // 1. Validate signature (optional - don't block if headers missing)
    if (ZOOM_WEBHOOK_SECRET) {
      // Zoom uses x-zm-signature and x-zm-timestamp (not x-zoom-*)
      const signature = req.headers['x-zm-signature'] as string;
      const timestamp = req.headers['x-zm-timestamp'] as string;
      
      if (signature && timestamp) {
        const body = JSON.stringify(req.body);
        const expectedSig = crypto
          .createHmac('sha256', ZOOM_WEBHOOK_SECRET)
          .update(`v0:${timestamp}:${body}`)
          .digest('hex');
        
        if (signature !== `v0=${expectedSig}`) {
          console.error('[Webhook] ❌ Invalid signature');
          return res.status(401).json({ error: 'Invalid signature' });
        }
        console.log('[Webhook] ✅ Signature validated');
      } else {
        console.warn('[Webhook] ⚠️  Missing signature headers (continuing anyway)');
      }
    }
    
    // 2. Handle chat messages (check multiple possible event names)
    const chatEvents = [
      'meeting.chat_message_sent',
      'meeting.chat_message_received',
      'meeting.chat_message',
      'meeting.in_meeting_chat_message_received',
      'meeting.in_meeting_chat_message_sent',
      'chat.message_sent',
      'chat.message_received',
      'meeting.chat',
      'chat_message_sent',
      'chat_message_received',
      'in_meeting_chat_message_received',
      'in_meeting_chat_message_sent'
    ];
    
    // DEBUG: Check if event name contains "chat" BEFORE checking other handlers
    if (DEBUG_MODE && event.toLowerCase().includes('chat')) {
      console.log(`\n[Webhook] 🔍 ⚠️  CHAT EVENT DETECTED! Event name: ${event}`);
      console.log('[Webhook] 🔍 Full payload:', JSON.stringify(payload, null, 2));
      if (payload.object) {
        console.log('[Webhook] 🔍 Payload object:', JSON.stringify(payload.object, null, 2));
      }
    }
    
    if (chatEvents.includes(event)) {
      const chatData = payload.object || payload;
      const message = chatData.message || chatData.chat_message || chatData.text || '';
      const sender = chatData.sender_name || chatData.user_name || chatData.email || chatData.sender || 'Unknown';
      const timestamp = chatData.date_time || chatData.timestamp || new Date().toISOString();
      
      console.log('\n💬 [CHAT]', sender, ':', message);
      console.log('   Time:', timestamp);
      
      if (DEBUG_MODE) {
        console.log('[Webhook] 🔍 Chat payload:', JSON.stringify(chatData, null, 2));
      }
      
      return res.status(200).json({ status: 'ok', event, message: 'Chat logged' });
    }
    
    // 3. Handle participant join (separate from meeting start)
    if (event === 'meeting.participant_joined') {
      // Payload structure: payload.object.participant contains the participant data
      const meetingObj = payload.object || {};
      const participant = meetingObj.participant || {};
      const name = participant.user_name || participant.name || 'Unknown';
      const email = participant.email || participant.user_email || 'No email';
      const joinTime = participant.join_time || new Date().toISOString();
      
      console.log('\n👋 [PARTICIPANT JOINED]', name);
      console.log('   Email:', email);
      console.log('   Time:', joinTime);
      
      return res.status(200).json({ status: 'ok', event });
    }
    
    // 4. Handle participant leave
    if (event === 'meeting.participant_left') {
      // Payload structure: payload.object.participant contains the participant data
      const meetingObj = payload.object || {};
      const participant = meetingObj.participant || {};
      const name = participant.user_name || participant.name || 'Unknown';
      const email = participant.email || participant.user_email || 'No email';
      const leaveTime = participant.leave_time || new Date().toISOString();
      
      console.log('\n👋 [PARTICIPANT LEFT]', name);
      console.log('   Email:', email);
      console.log('   Time:', leaveTime);
      
      return res.status(200).json({ status: 'ok', event });
    }
    
    // 5. Handle RTMS events (handled by RTMS client in main webhook handler)
    // These are processed in index.ts before this function is called
    if (event === 'meeting.rtms_started' || event === 'meeting.rtms_stopped') {
      return res.status(200).json({ status: 'ok', event });
    }
    
    // 6. Handle meeting start events (RTMS handled separately via meeting.rtms_started)
    if (event === 'meeting.started' || event === 'session.started') {
      const meeting = payload.meeting || payload.object;
      
      if (meeting) {
        const meetingId = meeting.id || meeting.meeting_id || meeting.meeting_number;
        const startTime = meeting.start_time || new Date().toISOString();
        
        // Track this meeting as active
        if (meetingId) {
          activeMeetings.set(String(meetingId), startTime);
        }
        
        console.log(`[Webhook] 🚀 Meeting started - ID: ${meetingId}, Topic: ${meeting.topic || 'N/A'}`);
        console.log(`[Webhook] ⏰ Start time: ${startTime}`);
        console.log(`[Webhook] ℹ️  Waiting for meeting.rtms_started event for RTMS connection`);
      }
      
      return res.status(200).json({ status: 'ok', event });
    }
    
    // 7. Handle meeting end events
    if (event === 'meeting.ended' || event === 'session.ended') {
      const meeting = payload.meeting || payload.object;
      const meetingId = meeting?.id || meeting?.meeting_id || meeting?.meeting_number || 'unknown';
      const endTime = meeting?.end_time || payload.end_time || new Date().toISOString();
      
      // Check if this is a stale event (end time before meeting start time)
      const meetingIdStr = String(meetingId);
      const meetingStartTime = activeMeetings.get(meetingIdStr);
      
      // Only filter if we have a start time AND end time is before it
      if (meetingStartTime && endTime < meetingStartTime) {
        console.log(`[Webhook] ⏭️  Ignoring stale meeting.ended event`);
        console.log(`[Webhook]    Meeting ID: ${meetingId}`);
        console.log(`[Webhook]    End time: ${endTime} (before start: ${meetingStartTime})`);
        return res.status(200).json({ status: 'ok', event, ignored: 'stale_event' });
      }
      
      // If we don't have start time tracked, still process it (might be valid)
      if (!meetingStartTime) {
        console.log(`[Webhook] ⚠️  Meeting end received but no start time tracked (processing anyway)`);
        console.log(`[Webhook]    Meeting ID: ${meetingId}`);
      }
      
      // This is a valid meeting end event
      console.log(`[Webhook] 🔴 Meeting ended - ID: ${meetingId}`);
      console.log(`[Webhook] ⏰ End time: ${endTime}`);
      
      // Remove from active meetings
      if (meetingIdStr !== 'unknown') {
        activeMeetings.delete(meetingIdStr);
      }
      
      // RTMS disconnection is handled via meeting.rtms_stopped event
      // No need to manually disconnect here
      
      return res.status(200).json({ status: 'ok', event });
    }
    
    // 8. Handle poll events
    if (event === 'meeting.poll_created' || event === 'meeting.poll_started') {
      const poll = payload.object || payload;
      const pollTitle = poll.title || poll.question || 'Untitled Poll';
      console.log(`[Webhook] 📊 Poll created: ${pollTitle}`);
      return res.status(200).json({ status: 'ok', event });
    }
    
    if (event === 'meeting.poll_ended') {
      const poll = payload.object || payload;
      const pollTitle = poll.title || poll.question || 'Untitled Poll';
      console.log(`[Webhook] 📊 Poll ended: ${pollTitle}`);
      return res.status(200).json({ status: 'ok', event });
    }
    
    // 9. Handle recording events
    if (event === 'recording.started') {
      const recording = payload.object || payload;
      const meetingId = recording.meeting_id || recording.id || 'unknown';
      console.log(`[Webhook] 🎥 Recording started - Meeting ID: ${meetingId}`);
      return res.status(200).json({ status: 'ok', event });
    }
    
    if (event === 'recording.stopped' || event === 'recording.completed') {
      const recording = payload.object || payload;
      const meetingId = recording.meeting_id || recording.id || 'unknown';
      console.log(`[Webhook] 🎥 Recording stopped - Meeting ID: ${meetingId}`);
      return res.status(200).json({ status: 'ok', event });
    }
    
    // 10. Handle other events
    const ignoredEvents = ['user.presence_status_updated'];
    if (!ignoredEvents.includes(event)) {
      console.log(`[Webhook] ℹ️  Unhandled event: ${event}`);
      
      // DEBUG: Check if event name contains "chat" (case insensitive)
      if (DEBUG_MODE && event.toLowerCase().includes('chat')) {
        console.log(`[Webhook] 🔍 ⚠️  CHAT EVENT DETECTED IN UNHANDLED! Event name: ${event}`);
        console.log('[Webhook] 🔍 Full payload:', JSON.stringify(payload, null, 2));
      }
      
      // DEBUG: Show full payload for unhandled events to help identify chat events
      if (DEBUG_MODE) {
        if (payload.object) {
          console.log('[Webhook] 🔍 Full payload object:', JSON.stringify(payload.object, null, 2));
        } else if (Object.keys(payload).length > 0) {
          console.log('[Webhook] 🔍 Full payload:', JSON.stringify(payload, null, 2));
        }
      }
    }
    
    res.status(200).json({ status: 'ok', event });
}

export function createWebhookHandler(rtmsClient: RTMSClient, zoomAPI: ZoomAPIClient | null = null) {
  const router = express.Router();
  
  router.post('/zoom/webhook', (req, res) => {
    processWebhookRequest(req, res, rtmsClient, zoomAPI);
  });
  
  return router;
}

// Export for use in root path handler
export { processWebhookRequest };
