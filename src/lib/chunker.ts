// Approximate token count: ~4 chars per token for English text
const CHARS_PER_TOKEN = 4;

export interface Chunk {
  text: string;
  index: number;
}

export function chunkText(
  text: string,
  targetTokens: number = 500,
  overlapTokens: number = 50
): Chunk[] {
  const targetChars = targetTokens * CHARS_PER_TOKEN;
  const overlapChars = overlapTokens * CHARS_PER_TOKEN;

  // Normalize whitespace
  const cleaned = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

  if (cleaned.length === 0) return [];

  // If the text fits in a single chunk, return it
  if (cleaned.length <= targetChars) {
    return [{ text: cleaned, index: 0 }];
  }

  const chunks: Chunk[] = [];
  let start = 0;
  let chunkIndex = 0;

  while (start < cleaned.length) {
    const end = start + targetChars;

    if (end >= cleaned.length) {
      // Last chunk
      chunks.push({ text: cleaned.slice(start).trim(), index: chunkIndex });
      break;
    }

    // Try to break at a paragraph boundary
    const breakPoint = findBreakPoint(cleaned, end, start);
    chunks.push({
      text: cleaned.slice(start, breakPoint).trim(),
      index: chunkIndex,
    });

    // Move start back by overlap amount
    start = breakPoint - overlapChars;
    if (start < 0) start = 0;
    // Ensure forward progress
    if (start <= chunks[chunks.length - 1].index && chunkIndex > 0) {
      start = breakPoint;
    }
    chunkIndex++;
  }

  return chunks.filter((c) => c.text.length > 0);
}

function findBreakPoint(text: string, end: number, start: number): number {
  // Look backwards from end for a good break point
  const searchWindow = text.slice(Math.max(start, end - 200), end);

  // Prefer paragraph break
  const paragraphBreak = searchWindow.lastIndexOf("\n\n");
  if (paragraphBreak !== -1) {
    return Math.max(start, end - 200) + paragraphBreak + 2;
  }

  // Then sentence break
  const sentenceBreak = searchWindow.search(/[.!?]\s+[A-Z][^.]*$/);
  if (sentenceBreak !== -1) {
    return (
      Math.max(start, end - 200) +
      sentenceBreak +
      searchWindow.slice(sentenceBreak).indexOf(" ") +
      1
    );
  }

  // Then any newline
  const newlineBreak = searchWindow.lastIndexOf("\n");
  if (newlineBreak !== -1) {
    return Math.max(start, end - 200) + newlineBreak + 1;
  }

  // Then space
  const spaceBreak = searchWindow.lastIndexOf(" ");
  if (spaceBreak !== -1) {
    return Math.max(start, end - 200) + spaceBreak + 1;
  }

  // Worst case: break at target
  return end;
}
