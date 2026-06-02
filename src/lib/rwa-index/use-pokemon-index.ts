import { useEffect, useState } from "react";
import type { IndexSnapshot, Sale } from "./models";

type PokemonIndexState = {
  index?: IndexSnapshot;
  latestSales: Sale[];
  loading: boolean;
  error?: string;
};

export function usePokemonIndex(): PokemonIndexState {
  const [state, setState] = useState<PokemonIndexState>({ latestSales: [], loading: true });

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setState((current) => ({ ...current, loading: true, error: undefined }));
      try {
        const [indexResponse, salesResponse] = await Promise.all([
          fetch("/api/index/pokemon", { signal: controller.signal, headers: { accept: "application/json" } }),
          fetch("/api/sales/latest?limit=6", { signal: controller.signal, headers: { accept: "application/json" } }),
        ]);
        if (!indexResponse.ok) throw new Error(`Index ${indexResponse.status}`);
        if (!salesResponse.ok) throw new Error(`Sales ${salesResponse.status}`);
        const index = (await indexResponse.json()) as IndexSnapshot;
        const salesPayload = (await salesResponse.json()) as { sales: Sale[] };
        setState({ index, latestSales: salesPayload.sales, loading: false });
      } catch (error) {
        if (controller.signal.aborted) return;
        setState({ latestSales: [], loading: false, error: error instanceof Error ? error.message : "Unable to load POKEMON_INDEX." });
      }
    }

    void load();
    return () => controller.abort();
  }, []);

  return state;
}
