"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatUsd } from "@/lib/utils";
import type { ComparedOffer } from "@/types";

function buckets(prices: number[], bins = 6) {
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const n = max === min ? 1 : bins;
  const width = (max - min) / n || 1;
  const out = Array.from({ length: n }, (_, i) => ({ lo: min + i * width, hi: min + (i + 1) * width, count: 0 }));
  for (const p of prices) out[Math.min(n - 1, Math.floor((p - min) / width))].count++;
  return out;
}

export function PriceDistributionChart({ offers, bestPrice }: { offers: ComparedOffer[]; bestPrice: number | null }) {
  const prices = offers.filter((o) => !o.suspicious).map((o) => o.priceUsd);
  if (prices.length < 2) return null;
  const data = buckets(prices).map((b) => ({
    label: formatUsd(b.lo),
    range: `${formatUsd(b.lo)} – ${formatUsd(b.hi)}`,
    count: b.count,
    hasBest: bestPrice !== null && bestPrice >= b.lo && bestPrice <= b.hi,
  }));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Price distribution</CardTitle>
        <CardDescription>How many stores sit in each price range. The darker bar holds the lowest price.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-56" role="img" aria-label="Bar chart of stores by price range">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} tickLine={false} axisLine={false} interval={0} />
              <YAxis allowDecimals={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: "var(--muted)" }}
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--foreground)" }}
                formatter={(v) => [`${Number(v)} ${Number(v) === 1 ? "store" : "stores"}`, ""]}
                labelFormatter={(_, p) => p?.[0]?.payload?.range ?? ""}
              />
              <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                {data.map((d) => <Cell key={d.label} fill={d.hasBest ? "var(--chart-2)" : "var(--chart-1)"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
