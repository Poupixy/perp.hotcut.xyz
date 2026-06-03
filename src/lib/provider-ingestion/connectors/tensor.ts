import { getIngestionEnv } from "../config";
import type { FetchSalesParams, NormalizedSale, ProviderSalesConnector, ProviderSalesStatus } from "../types";
import { fetchJson, isWithinWindow, nowStatus } from "../utils";
import { normalizeGenericPayload } from "./generic-json";

export class TensorSalesConnector implements ProviderSalesConnector {
  providerId = "tensor" as const;
  private status: ProviderSalesStatus = nowStatus(this.providerId, "needs_api_key", "TENSOR_API_KEY is not configured.");

  getStatus() {
    return this.status;
  }

  async fetchSales(params: FetchSalesParams): Promise<NormalizedSale[]> {
    const env = getIngestionEnv();
    if (!env.TENSOR_API_KEY) {
      this.status = nowStatus(this.providerId, "needs_api_key", "TENSOR_API_KEY is not configured.");
      return [];
    }
    if (!env.TENSOR_API_URL) {
      this.status = nowStatus(this.providerId, "needs_endpoint", "TENSOR_API_URL is required for the sales/activity endpoint supplied by Tensor.");
      return [];
    }

    const markets = Object.entries(params.markets).filter(([, config]) => config.tensorCollections?.length);
    if (!markets.length) {
      this.status = nowStatus(this.providerId, "unavailable", "No Tensor collections configured.");
      return [];
    }

    const sales: NormalizedSale[] = [];
    const errors: string[] = [];
    for (const [market, config] of markets) {
      for (const collection of config.tensorCollections ?? []) {
        try {
          const url = new URL(env.TENSOR_API_URL);
          url.searchParams.set("collection", collection);
          url.searchParams.set("from", params.from.toISOString());
          url.searchParams.set("to", params.to.toISOString());
          const payload = await fetchJson(url.toString(), { headers: { accept: "application/json", "x-tensor-api-key": env.TENSOR_API_KEY } });
          sales.push(...normalizeGenericPayload(payload, this.providerId, market).filter((sale) => isWithinWindow(sale.timestamp, params.from, params.to)));
        } catch (error) {
          errors.push(`${market}/${collection}: ${error instanceof Error ? error.message : "request failed"}`);
        }
      }
    }

    this.status = errors.length && !sales.length
      ? nowStatus(this.providerId, "error", errors.join("; "), 0)
      : nowStatus(this.providerId, "live", sales.length ? `${sales.length} executed sale(s) fetched.` : "Configured, but no executed sales in window.", sales.length);
    return sales;
  }
}
