import { NextRequest, NextResponse } from 'next/server';
import { getAllAnalyses, clearAllAnalyses, getAnalysisById } from '@/lib/analysis-storage';

/**
 * GET - Get all stored analyses
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      // Get specific analysis by ID
      const analysis = getAnalysisById(id);
      if (!analysis) {
        return NextResponse.json(
          { error: 'Analysis not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(analysis);
    }

    // Get all analyses
    const analyses = getAllAnalyses();
    return NextResponse.json({
      count: analyses.length,
      analyses,
    });
  } catch (error) {
    console.error('[Analyses API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Clear all analyses
 */
export async function DELETE() {
  try {
    const count = clearAllAnalyses();
    return NextResponse.json({
      success: true,
      message: `Cleared ${count} analyses`,
      count,
    });
  } catch (error) {
    console.error('[Analyses API] Error clearing:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
