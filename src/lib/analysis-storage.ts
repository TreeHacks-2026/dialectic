/**
 * Analysis Storage Manager
 * Stores analysis results in a JSON file (can be migrated to database later)
 */

import * as fs from 'fs';
import * as path from 'path';

export interface StoredAnalysis {
  id: string;
  sessionId: string;
  analyzedAt: string;
  transcript: string; // Full transcript text
  results: Array<{
    studentId?: string;
    overallScore: number;
    overallSummary: string;
    [key: string]: unknown; // Full analysis result
  }>;
  createdAt: string;
}

const STORAGE_FILE = path.join(process.cwd(), 'data', 'analyses.json');

// Ensure data directory exists
function ensureDataDir(): void {
  const dataDir = path.dirname(STORAGE_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Read all analyses from storage
export function getAllAnalyses(): StoredAnalysis[] {
  try {
    ensureDataDir();
    if (!fs.existsSync(STORAGE_FILE)) {
      return [];
    }
    const content = fs.readFileSync(STORAGE_FILE, 'utf-8');
    return JSON.parse(content) as StoredAnalysis[];
  } catch (error) {
    console.error('[Analysis Storage] Error reading analyses:', error);
    return [];
  }
}

// Save a new analysis
export function saveAnalysis(
  sessionId: string,
  transcript: string,
  analysisResults: Array<Record<string, unknown>>
): StoredAnalysis {
  try {
    ensureDataDir();
    
    const analyses = getAllAnalyses();
    
    const newAnalysis: StoredAnalysis = {
      id: `analysis-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      sessionId,
      analyzedAt: new Date().toISOString(),
      transcript,
      results: analysisResults.map((r) => ({
        studentId: r.studentId as string | undefined,
        overallScore: (r.overallScore as number) || 0,
        overallSummary: (r.overallSummary as string) || '',
        ...r,
      })),
      createdAt: new Date().toISOString(),
    };

    analyses.push(newAnalysis);
    
    // Sort by date (newest first)
    analyses.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    fs.writeFileSync(STORAGE_FILE, JSON.stringify(analyses, null, 2), 'utf-8');
    
    console.log(`[Analysis Storage] 💾 Saved analysis ${newAnalysis.id} for session ${sessionId}`);
    
    return newAnalysis;
  } catch (error) {
    console.error('[Analysis Storage] Error saving analysis:', error);
    throw error;
  }
}

// Get a specific analysis by ID
export function getAnalysisById(id: string): StoredAnalysis | null {
  const analyses = getAllAnalyses();
  return analyses.find((a) => a.id === id) || null;
}

// Clear all analyses
export function clearAllAnalyses(): number {
  try {
    ensureDataDir();
    const count = getAllAnalyses().length;
    
    if (fs.existsSync(STORAGE_FILE)) {
      fs.unlinkSync(STORAGE_FILE);
    }
    
    console.log(`[Analysis Storage] 🗑️ Cleared ${count} analyses`);
    return count;
  } catch (error) {
    console.error('[Analysis Storage] Error clearing analyses:', error);
    throw error;
  }
}

// Get analysis count
export function getAnalysisCount(): number {
  return getAllAnalyses().length;
}
