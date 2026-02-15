/**
 * Perplexity Sonar API client
 * Uses OpenAI-compatible chat completions endpoint
 */

interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

interface ChatCompletionResponse {
    choices: {
        message: {
            content: string;
        };
    }[];
}

export class PerplexityClient {
    private apiKey: string;
    private baseUrl = "https://api.perplexity.ai";

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async chatCompletion(
        model: string,
        messages: ChatMessage[]
    ): Promise<string> {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model,
                messages,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                `Perplexity API error (${response.status}): ${errorText}`
            );
        }

        const data = (await response.json()) as ChatCompletionResponse;
        return data.choices[0].message.content;
    }
}
