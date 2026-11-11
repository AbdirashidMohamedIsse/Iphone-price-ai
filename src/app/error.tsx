"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="pt-16">
      <h1 className="font-display text-3xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-muted-foreground">The page couldn’t load. Your search is safe, so try again.</p>
      <Button className="mt-6" onClick={reset}>Reload this page</Button>
    </section>
  );
}
