import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="pt-16">
      <h1 className="font-display text-3xl font-semibold">We can’t find that page</h1>
      <p className="mt-2 text-muted-foreground">The search may have expired or the link is wrong.</p>
      <Button asChild className="mt-6"><Link href="/">Start a new search</Link></Button>
    </section>
  );
}
