import { dirname, resolve } from "node:path";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { salesDbPath } from "./config";
import type { NormalizedSale, ProviderSalesDb, ProviderSalesStatus } from "./types";
import { saleDedupeKey } from "./utils";

const EMPTY_DB: ProviderSalesDb = { sales: [], providerStatus: [] };

function dbFilePath() {
  return resolve(process.cwd(), salesDbPath());
}

export async function readProviderSalesDb(): Promise<ProviderSalesDb> {
  try {
    const raw = await readFile(dbFilePath(), "utf8");
    const parsed = JSON.parse(raw) as ProviderSalesDb;
    return { sales: parsed.sales ?? [], providerStatus: parsed.providerStatus ?? [], updatedAt: parsed.updatedAt };
  } catch {
    return EMPTY_DB;
  }
}

export async function writeProviderSalesDb(db: ProviderSalesDb): Promise<void> {
  const file = dbFilePath();
  await mkdir(dirname(file), { recursive: true });
  const payload = JSON.stringify({ ...db, updatedAt: new Date().toISOString() }, null, 2);
  const tmp = `${file}.tmp`;
  await writeFile(tmp, payload, "utf8");
  await rename(tmp, file);
}

export async function upsertProviderSales(newSales: NormalizedSale[], statuses: ProviderSalesStatus[]): Promise<{ inserted: number; total: number }> {
  const db = await readProviderSalesDb();
  const byKey = new Map<string, NormalizedSale>();
  for (const sale of db.sales) byKey.set(saleDedupeKey(sale), sale);

  let inserted = 0;
  for (const sale of newSales) {
    const key = saleDedupeKey(sale);
    if (!byKey.has(key)) inserted += 1;
    byKey.set(key, sale);
  }

  const statusByProvider = new Map(db.providerStatus.map((status) => [status.providerId, status]));
  for (const status of statuses) statusByProvider.set(status.providerId, status);

  const sales = Array.from(byKey.values()).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  await writeProviderSalesDb({ sales, providerStatus: Array.from(statusByProvider.values()) });
  return { inserted, total: sales.length };
}

export async function getProviderStatuses(): Promise<ProviderSalesStatus[]> {
  return (await readProviderSalesDb()).providerStatus;
}

export async function getLatestProviderSales(limit = 25): Promise<NormalizedSale[]> {
  return (await readProviderSalesDb()).sales.slice(0, limit);
}

export async function getSalesByProvider(provider: string, limit = 250): Promise<NormalizedSale[]> {
  return (await readProviderSalesDb()).sales.filter((sale) => sale.provider === provider).slice(0, limit);
}

export async function getSalesByMarket(market: string, limit = 250): Promise<NormalizedSale[]> {
  return (await readProviderSalesDb()).sales.filter((sale) => sale.market === market).slice(0, limit);
}
