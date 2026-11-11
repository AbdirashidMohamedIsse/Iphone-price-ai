"use client";

import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUiStore } from "@/hooks/use-ui-store";
import { formatUsd } from "@/lib/utils";
import type { ComparedOffer } from "@/types";

const STOCK = { in_stock: "In stock", limited: "Limited stock", out_of_stock: "Out of stock", preorder: "Pre-order", unknown: "Not stated" } as const;

export function OffersTable({ offers, bestUrl }: { offers: ComparedOffer[]; bestUrl: string | null }) {
  const { sort, setSort, inStockOnly, toggleInStock } = useUiStore();
  const rows = offers
    .filter((o) => !inStockOnly || o.inStock)
    .sort((a, b) => (sort === "price" ? a.priceUsd - b.priceUsd : b.confidenceScore - a.confidenceScore));

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle>All verified offers ({rows.length})</CardTitle>
        <div className="flex gap-2">
          <Button size="sm" variant={sort === "price" ? "default" : "outline"} aria-pressed={sort === "price"} onClick={() => setSort("price")}>Lowest price</Button>
          <Button size="sm" variant={sort === "confidence" ? "default" : "outline"} aria-pressed={sort === "confidence"} onClick={() => setSort("confidence")}>Most certain</Button>
          <Button size="sm" variant={inStockOnly ? "default" : "outline"} aria-pressed={inStockOnly} onClick={toggleInStock}>In stock only</Button>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Store</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Availability</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead><span className="sr-only">Link</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((o) => (
              <TableRow key={o.url}>
                <TableCell>
                  <div className="font-medium">{o.storeName}</div>
                  <div className="max-w-[18rem] truncate text-xs text-muted-foreground">{o.productName}</div>
                </TableCell>
                <TableCell className="font-medium">
                  {formatUsd(o.priceUsd, { cents: o.priceUsd % 1 !== 0 })}
                  {o.currency !== "USD" && <div className="text-xs font-normal text-muted-foreground">{o.price.toLocaleString()} {o.currency}</div>}
                  <div className="mt-1 flex gap-1">
                    {o.url === bestUrl && <Badge variant="good">Lowest</Badge>}
                    {o.suspicious && <Badge variant="warn">Unusually low, verify</Badge>}
                  </div>
                </TableCell>
                <TableCell>{STOCK[o.availability]}</TableCell>
                <TableCell>{Math.round(o.confidenceScore * 100)}%</TableCell>
                <TableCell className="text-right">
                  <a href={o.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm underline underline-offset-4">
                    View<span className="sr-only"> at {o.storeName}</span><ExternalLink className="size-3.5" aria-hidden />
                  </a>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No in-stock offers. Turn off “In stock only” to see all stores.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
