import { SearchBox } from "@/components/search-box";

export default function Home() {
  return (
    <section className="pt-14 sm:pt-24">
      <h1 className="max-w-3xl font-display text-5xl font-semibold leading-[1.02] tracking-tight sm:text-7xl">
        Find the Cheapest iPhone Online
      </h1>
      <p className="mt-5 max-w-xl text-lg text-muted-foreground">
        AI-powered price discovery across hundreds of retailers. Every price is read from the store’s own page and checked against the model, storage and condition you asked for.
      </p>
      <div className="mt-10">
        <SearchBox />
      </div>
    </section>
  );
}
