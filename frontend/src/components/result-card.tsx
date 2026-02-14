import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SearchHit } from "@/types/api";

export function ResultCard({ hit, rank }: { hit: SearchHit; rank: number }) {
  const src = hit.source;
  return (
    <Card className="transition-colors hover:border-primary">
      <CardContent className="pt-4">
        <div className="mb-2 flex items-center gap-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {rank}
          </span>
          <span className="font-semibold">{src.meeting_title || "Untitled Meeting"}</span>
          <Badge variant="secondary" className="ml-auto font-mono text-xs">
            score: {hit.score != null ? hit.score.toFixed(4) : "N/A"}
          </Badge>
        </div>
        <div className="mb-3 rounded border-l-2 border-primary bg-muted p-3 text-sm italic">
          &ldquo;{src.transcript_text}&rdquo;
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          {src.speaker && <span><strong>Speaker:</strong> {src.speaker}</span>}
          {src.meeting_date && <span><strong>Date:</strong> {src.meeting_date}</span>}
          {src.timestamp_start && <span><strong>Timestamp:</strong> {src.timestamp_start}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
