import Link from "next/link";

export function Header() {
  return (
    <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5">
      <Link href="/" className="font-display text-lg font-semibold tracking-tight">
        Cheapest iPhone
      </Link>
      <nav>
        <Link href="/history" className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
          Search history
        </Link>
      </nav>
    </header>
  );
}
