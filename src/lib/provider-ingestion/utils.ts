import type { ProviderSalesStatus, ProviderStatusCode } from "./types";

export type UnknownRecord = Record<string, unknown>;

export function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as UnknownRecord) : {};
}

export function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

export function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return undefined;
}

export function toIsoDate(value: unknown): string | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return new Date(value > 1_000_000_000_000 ? value : value * 1000).toISOString();
  if (typeof value === "string" && value.trim()) {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && /^\d+(\.\d+)?$/.test(value.trim())) return new Date(numeric > 1_000_000_000_000 ? numeric : numeric * 1000).toISOString();
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? new Date(parsed).toISOString() : undefined;
  }
  return undefined;
}

export function isWithinWindow(iso: string, from: Date, to: Date): boolean {
  const time = new Date(iso).getTime();
  return time >= from.getTime() && time <= to.getTime();
}

export async function fetchJson(url: string, init?: RequestInit, timeoutMs = 15_000): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

export function rowsFromPayload(payload: unknown): unknown[] {
  const record = asRecord(payload);
  if (Array.isArray(payload)) return payload;
  for (const key of ["data", "sales", "items", "results", "activities", "fills"]) {
    const rows = record[key];
    if (Array.isArray(rows)) return rows;
  }
  return [];
}

export function saleDedupeKey(sale: { provider: string; txHash?: string; assetMint?: string; market: string; assetName: string; timestamp: string }): string {
  if (sale.txHash && sale.assetMint) return `${sale.txHash}:${sale.assetMint}`;
  return `${sale.provider}:${sale.market}:${sale.assetMint ?? sale.assetName}:${sale.timestamp}`;
}

export function nowStatus(
  providerId: ProviderSalesStatus["providerId"],
  status: ProviderStatusCode,
  message: string,
  salesFetched?: number,
): ProviderSalesStatus {
  return { providerId, status, live: status === "live", message, checkedAt: new Date().toISOString(), salesFetched };
}
