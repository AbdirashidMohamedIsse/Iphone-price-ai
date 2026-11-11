import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Recommendation } from "@/types";

const AVAIL = { high: ["good", "High availability"], medium: ["warn", "Medium availability"], low: ["bad", "Low availability"], unknown: ["outline", "Availability unknown"] } as const;

export function RecommendationPanel({ rec }: { rec: Recommendation }) {
  const [variant, label] = AVAIL[rec.availability];
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2"><Sparkles className="size-4" aria-hidden />Buying advice</CardTitle>
          <Badge variant={variant}>{label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="font-medium">{rec.headline}</p>
        <p className="text-sm text-muted-foreground">{rec.summary}</p>
        {rec.advice.length > 0 && (
          <ul className="list-disc space-y-1.5 pl-5 text-sm">{rec.advice.map((a) => <li key={a}>{a}</li>)}</ul>
        )}
        {rec.caveats.length > 0 && (
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">{rec.caveats.map((c) => <li key={c}>{c}</li>)}</ul>
        )}
      </CardContent>
    </Card>
  );
}
