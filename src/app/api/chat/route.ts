import { NextRequest, NextResponse } from "next/server";
import { generateEmbedding } from "@/lib/embeddings";
import { hybridSearch } from "@/lib/elasticsearch";

interface ChatRequest {
  question: string;
  course_name?: string;
  chat_history?: { role: "user" | "assistant"; content: string }[];
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ChatRequest;
    const { question, course_name } = body;

    if (!question || question.trim().length === 0) {
      return NextResponse.json(
        { error: "No question provided" },
        { status: 400 }
      );
    }

    // 1. Embed the user question
    const queryEmbedding = await generateEmbedding(question);

    // 2. Hybrid search on Elasticsearch
    const searchResults = await hybridSearch(
      question,
      queryEmbedding,
      course_name,
      5
    );

    // 3. Build answer from search results
    const sources = searchResults.map((result) => ({
      filename: result.source_filename,
      excerpt:
        result.content.slice(0, 200) +
        (result.content.length > 200 ? "..." : ""),
    }));

    let answer: string;
    if (searchResults.length === 0) {
      answer =
        "No relevant course materials were found for your question. Try uploading documents first.";
    } else {
      answer = searchResults
        .map(
          (result) =>
            `**[${result.source_filename}]:**\n${result.content}`
        )
        .join("\n\n---\n\n");
    }

    return NextResponse.json({ answer, sources });
  } catch (error: unknown) {
    console.error("Chat error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error during chat";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
