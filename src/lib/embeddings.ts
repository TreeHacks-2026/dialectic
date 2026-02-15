const JINA_API_URL = "https://api.jina.ai/v1/embeddings";
const JINA_MODEL = "jina-embeddings-v3";

export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.JINA_API_KEY;
  if (!apiKey) {
    throw new Error("Missing JINA_API_KEY environment variable");
  }

  const response = await fetch(JINA_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: JINA_MODEL,
      input: [text],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`JINA API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.data[0].embedding as number[];
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.JINA_API_KEY;
  if (!apiKey) {
    throw new Error("Missing JINA_API_KEY environment variable");
  }

  if (texts.length === 0) return [];

  // JINA API supports batching; send in batches of 64
  const batchSize = 64;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const response = await fetch(JINA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: JINA_MODEL,
        input: batch,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`JINA API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const embeddings = data.data.map(
      (item: { embedding: number[] }) => item.embedding
    );
    allEmbeddings.push(...embeddings);
  }

  return allEmbeddings;
}
