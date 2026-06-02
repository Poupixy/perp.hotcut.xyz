import { useEffect, useState } from "react";
import type { MarketSalesResponse } from "./types";

type MarketSalesState = {
  data?: MarketSalesResponse;
  loading: boolean;
  error?: string;
};

export function useMarketSales(days = 7): MarketSalesState {
  const [state, setState] = useState<MarketSalesState>({ loading: true });

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setState((current) => ({ ...current, loading: true, error: undefined }));
      try {
        const response = await fetch(`/api/market-sales?days=${days}`, { signal: controller.signal, headers: { accept: "application/json" } });
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
        const data = (await response.json()) as MarketSalesResponse;
        setState({ data, loading: false });
      } catch (error) {
        if (controller.signal.aborted) return;
        setState({ loading: false, error: error instanceof Error ? error.message : "Unable to load market sales." });
      }
    }

    void load();
    return () => controller.abort();
  }, [days]);

  return state;
}
