import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { generateEmbedding } from "@/lib/embeddings";
import { hybridSearch } from "@/lib/elasticsearch";

const SYSTEM_PROMPT = `You are a helpful teaching assistant. Answer the student's question using ONLY the provided course material context. If the context doesn't contain enough information, say so honestly. Keep answers clear, concise, and educational. When relevant, point students to which source document contains more detail.`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  question: string;
  course_name?: string;
  chat_history?: ChatMessage[];
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ChatRequest;
    const { question, course_name, chat_history } = body;

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

    // 3. Build context from top chunks
    const context = searchResults
      .map(
        (result, i) =>
          `[Source ${i + 1}: ${result.source_filename}]\n${result.content}`
      )
      .join("\n\n---\n\n");

    // 4. Build messages for OpenAI
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    if (context.length > 0) {
      messages.push({
        role: "system",
        content: `Here is the relevant course material context:\n\n${context}`,
      });
    } else {
      messages.push({
        role: "system",
        content:
          "No relevant course materials were found. Let the student know you couldn't find relevant information in the indexed materials.",
      });
    }

    // Include chat history
    if (chat_history && chat_history.length > 0) {
      for (const msg of chat_history) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    messages.push({ role: "user", content: question });

    // 5. Stream the response from OpenAI
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      stream: true,
      temperature: 0.3,
    });

    // Build sources list
    const sources = searchResults.map((result) => ({
      filename: result.source_filename,
      excerpt: result.content.slice(0, 200) + (result.content.length > 200 ? "..." : ""),
    }));

    // Create a streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Send sources first as a JSON event
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "sources", sources })}\n\n`
          )
        );

        // Stream answer chunks
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "content", content })}\n\n`
              )
            );
          }
        }

        // Signal completion
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
        );
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: unknown) {
    console.error("Chat error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error during chat";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
