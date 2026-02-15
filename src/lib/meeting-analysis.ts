/**
 * Meeting Analysis Utilities
 * Shared functions for triggering meeting analysis
 */

import { meetingTranscriptManager } from './meeting-transcript';
import { saveAnalysis } from './analysis-storage';

/**
 * Trigger analysis when meeting ends
 * This function can be called from webhooks, manual triggers, or other sources
 */
export async function triggerMeetingAnalysis(sessionId: string): Promise<void> {
  try {
    const entryCount = meetingTranscriptManager.getEntryCount(sessionId);
    if (entryCount === 0) {
      console.log(`[Meeting Analysis] ⚠️ No transcripts to analyze for session ${sessionId}`);
      return;
    }

    console.log(`[Meeting Analysis] 🔍 Meeting ended. Analyzing ${entryCount} transcript entries...`);

    // Get transcript in plain text format (works with analyze API)
    const plainText = meetingTranscriptManager.getPlainTextTranscript(sessionId);
    
    if (!plainText || plainText.trim().length === 0) {
      console.log(`[Meeting Analysis] ⚠️ Empty transcript for session ${sessionId}`);
      return;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 
                  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                  process.env.RENDER_EXTERNAL_URL || 
                  'http://localhost:3000');

    // Call analyze API
    const analyzeResponse = await fetch(`${appUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rawText: plainText,
        sessionId: sessionId,
      }),
    });

    if (!analyzeResponse.ok) {
      const errorText = await analyzeResponse.text();
      console.error(`[Meeting Analysis] ❌ Analysis failed: ${analyzeResponse.status} ${errorText}`);
      return;
    }

    const analysisResult = await analyzeResponse.json();
    const results = analysisResult.results || [analysisResult];
    
    console.log(`[Meeting Analysis] ✅ Analysis complete for session ${sessionId}`);
    console.log(`[Meeting Analysis] 📊 Analyzed ${results.length} students`);

    // Store analysis result in database
    try {
      const stored = saveAnalysis(sessionId, plainText, results);
      console.log(`[Meeting Analysis] 💾 Stored analysis with ID: ${stored.id}`);
    } catch (error) {
      console.error('[Meeting Analysis] ❌ Error storing analysis:', error);
      // Don't fail the whole process if storage fails
    }
    
  } catch (error) {
    console.error('[Meeting Analysis] ❌ Error triggering analysis:', error);
    throw error; // Re-throw so caller can handle
  }
}
