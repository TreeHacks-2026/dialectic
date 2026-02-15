/**
 * Google Gemini API client
 * Used for cheap/free agent selection via Gemini Flash
 */

interface GeminiContent {
    role: "user" | "model";
    parts: { text: string }[];
}

interface GeminiResponse {
    candidates: {
        content: {
            parts: { text: string }[];
        };
    }[];
}

export class GeminiClient {
    private apiKey: string;
    private baseUrl = "https://generativelanguage.googleapis.com/v1beta";

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async generate(
        model: string,
        systemInstruction: string,
        userMessage: string
    ): Promise<string> {
        const url = `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`;

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{ text: systemInstruction }],
                },
                contents: [
                    {
                        role: "user",
                        parts: [{ text: userMessage }],
                    },
                ],
                generationConfig: {
                    temperature: 0.1, // Low temp for deterministic routing
                },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API error (${response.status}): ${errorText}`);
        }

        const data = (await response.json()) as GeminiResponse;
        return data.candidates[0].content.parts[0].text;
    }
}
