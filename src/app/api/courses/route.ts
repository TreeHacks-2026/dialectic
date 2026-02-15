import { NextRequest, NextResponse } from "next/server";
import {
  aggregateCourses,
  ensureIndex,
  getElasticClient,
  INDEX_NAME,
} from "@/lib/elasticsearch";

export async function GET() {
  try {
    const courses = await aggregateCourses();
    return NextResponse.json({ courses });
  } catch (error: unknown) {
    // If Elasticsearch is not configured or unreachable, return empty
    if (
      error instanceof Error &&
      (error.message.includes("Missing ELASTICSEARCH") ||
        error.message.includes("index_not_found_exception"))
    ) {
      return NextResponse.json({ courses: [] });
    }
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!name) {
      return NextResponse.json(
        { error: "Course name is required" },
        { status: 400 }
      );
    }

    // Ensure the index exists before writing
    await ensureIndex();

    // Index a small metadata placeholder so the course appears immediately
    // in aggregation queries. Real document chunks will follow during upload.
    const es = getElasticClient();
    await es.index({
      index: INDEX_NAME,
      document: {
        content: "",
        embedding: new Array(1024).fill(0),
        source_filename: "__course_meta__",
        chunk_index: 0,
        course_name: name,
        created_at: new Date().toISOString(),
      },
      refresh: true,
    });

    return NextResponse.json({ success: true, name });
  } catch (error: unknown) {
    console.error("Error creating course:", error);
    return NextResponse.json(
      { error: "Failed to create course" },
      { status: 500 }
    );
  }
}
