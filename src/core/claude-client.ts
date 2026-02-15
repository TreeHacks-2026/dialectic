/**
 * Anthropic Claude API client
 * Used for agent selection
 */

interface ClaudeMessage {
    role: "user" | "assistant";
    content: string;
}

interface ClaudeResponse {
    content: Array<{
        type: string;
        text: string;
    }>;
}

export class ClaudeClient {
    private apiKey: string;
    private baseUrl = "https://api.anthropic.com/v1";

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async generate(
        model: string,
        systemInstruction: string,
        userMessage: string
    ): Promise<string> {
        const url = `${this.baseUrl}/messages`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": this.apiKey,
                "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
                model,
                system: systemInstruction,
                messages: [
                    {
                        role: "user",
                        content: userMessage,
                    },
                ],
                max_tokens: 1024,
                temperature: 0.1, // Low temp for deterministic routing
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Claude API error (${response.status}): ${errorText}`);
        }

        const data = (await response.json()) as ClaudeResponse;
        return data.content[0].text;
    }
}
