/**
 * Transcript manager — tracks all conversation entries and produces summaries
 */

import { TranscriptEntry } from "../types/types";

export class Transcript {
    private entries: TranscriptEntry[] = [];

    add(speaker: string, text: string): void {
        this.entries.push({
            speaker,
            text,
            timestamp: new Date().toISOString(),
        });
    }

    getAll(): TranscriptEntry[] {
        return [...this.entries];
    }

    getLast(n: number): TranscriptEntry[] {
        return this.entries.slice(-n);
    }

    getFullText(): string {
        return this.entries
            .map((e) => `${e.speaker}: ${e.text}`)
            .join("\n");
    }

    getLastNText(n: number): string {
        return this.getLast(n)
            .map((e) => `${e.speaker}: ${e.text}`)
            .join("\n");
    }

    length(): number {
        return this.entries.length;
    }
}
