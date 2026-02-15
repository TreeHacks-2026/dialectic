import { NextRequest, NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import { chunkText } from "@/lib/chunker";
import { generateEmbeddings } from "@/lib/embeddings";
import {
  getElasticClient,
  ensureIndex,
  deleteBySourceAndCourse,
  INDEX_NAME,
} from "@/lib/elasticsearch";

async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await parser.getText();
  await parser.destroy();
  return result.text;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const courseName = formData.get("course_name") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!courseName) {
      return NextResponse.json(
        { error: "No course_name provided" },
        { status: 400 }
      );
    }

    // Extract text based on file type
    const filename = file.name.toLowerCase();
    let text: string;

    if (filename.endsWith(".pdf")) {
      const buffer = Buffer.from(await file.arrayBuffer());
      text = await extractPdfText(buffer);
    } else if (
      filename.endsWith(".txt") ||
      filename.endsWith(".md") ||
      filename.endsWith(".markdown")
    ) {
      text = await file.text();
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload PDF, TXT, or MD files." },
        { status: 400 }
      );
    }

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "No text content extracted from file" },
        { status: 400 }
      );
    }

    // Chunk the text
    const chunks = chunkText(text);
    if (chunks.length === 0) {
      return NextResponse.json(
        { error: "No chunks generated from file" },
        { status: 400 }
      );
    }

    // Generate embeddings for all chunks
    const chunkTexts = chunks.map((c) => c.text);
    const embeddings = await generateEmbeddings(chunkTexts);

    // Ensure the index exists
    await ensureIndex();

    // Bulk index into Elasticsearch
    const es = getElasticClient();
    const now = new Date().toISOString();

    const operations = chunks.flatMap((chunk, i) => [
      { index: { _index: INDEX_NAME } },
      {
        content: chunk.text,
        embedding: embeddings[i],
        source_filename: file.name,
        chunk_index: chunk.index,
        course_name: courseName,
        created_at: now,
      },
    ]);

    const bulkResponse = await es.bulk({
      operations,
      refresh: "wait_for",
    });

    if (bulkResponse.errors) {
      const errorItems = bulkResponse.items.filter(
        (item) => item.index?.error
      );
      console.error("Bulk indexing errors:", JSON.stringify(errorItems));
      return NextResponse.json(
        {
          error: "Some chunks failed to index",
          details: errorItems.length + " failures",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      chunks_indexed: chunks.length,
    });
  } catch (error: unknown) {
    console.error("Ingest error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error during ingestion";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { source_filename, course_name } = body as {
      source_filename?: string;
      course_name?: string;
    };

    if (!source_filename || !course_name) {
      return NextResponse.json(
        { error: "Both source_filename and course_name are required" },
        { status: 400 }
      );
    }

    const deleted = await deleteBySourceAndCourse(source_filename, course_name);

    return NextResponse.json({
      success: true,
      deleted,
    });
  } catch (error: unknown) {
    console.error("Delete error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error during deletion";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
