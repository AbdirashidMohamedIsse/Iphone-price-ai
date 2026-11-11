import { create } from "zustand";
import { persist } from "zustand/middleware";

type UiState = {
  sort: "price" | "confidence";
  inStockOnly: boolean;
  recent: string[];
  setSort: (s: UiState["sort"]) => void;
  toggleInStock: () => void;
  addRecent: (q: string) => void;
};

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sort: "price",
      inStockOnly: false,
      recent: [],
      setSort: (sort) => set({ sort }),
      toggleInStock: () => set((s) => ({ inStockOnly: !s.inStockOnly })),
      addRecent: (q) => set((s) => ({ recent: [q, ...s.recent.filter((r) => r !== q)].slice(0, 4) })),
    }),
    { name: "iphone-price-ui" },
  ),
);
