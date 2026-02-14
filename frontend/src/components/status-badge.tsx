import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  ok: boolean;
  error: string | null;
}

export function StatusBadge({ ok, error }: StatusBadgeProps) {
  if (ok) {
    return <Badge className="bg-emerald-900 text-emerald-300">Success</Badge>;
  }
  return (
    <div className="space-y-2">
      <Badge variant="destructive">Error</Badge>
      {error && (
        <p className="rounded border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
