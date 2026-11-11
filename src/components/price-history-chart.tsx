"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePriceHistory } from "@/hooks/use-search-run";
import { formatUsd } from "@/lib/utils";

export function PriceHistoryChart({ productKey }: { productKey: string | null }) {
  const { data } = usePriceHistory(productKey);
  const points = data?.history ?? [];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Price over time</CardTitle>
        <CardDescription>Lowest verified price per day for this phone.</CardDescription>
      </CardHeader>
      <CardContent>
        {points.length < 2 ? (
          <p className="py-6 text-sm text-muted-foreground">
            History builds each time this phone is searched. Check back after another search on a different day.
          </p>
        ) : (
          <div className="h-56" role="img" aria-label="Line chart of the lowest daily price">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis domain={["auto", "auto"]} tickFormatter={(v: number) => formatUsd(v)} width={64} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--foreground)" }}
                  formatter={(v) => [formatUsd(Number(v), { cents: true }), "Lowest"]}
                />
                <Line type="monotone" dataKey="min" stroke="var(--chart-2)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
