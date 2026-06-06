import { createFileRoute } from "@tanstack/react-router";

function optionalNumber(value: string | null) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function optionalBoolean(value: string | null, fallback: boolean) {
  if (value === null) return fallback;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function clampLimit(value: number | null) {
  if (!value) return 50;
  return Math.min(Math.max(value, 1), 100);
}

function normalizeSort(value: string | null) {
  if (value === "name_desc") return "name_desc";
  if (value === "updated_desc") return "updated_desc";
  if (value === "category_asc") return "category_asc";
  return "name_asc";
}

export const Route = createFileRoute("/api/nft-list")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { getNftDb } = await import("@/services/nftSqliteDb");

        const url = new URL(request.url);
        const db = getNftDb();

        const page = Math.max(optionalNumber(url.searchParams.get("page")) ?? 1, 1);
        const limit = clampLimit(optionalNumber(url.searchParams.get("limit")));
        const offset = (page - 1) * limit;

        const search = url.searchParams.get("search")?.trim() ?? "";
        const category = url.searchParams.get("category");
        const assetType = url.searchParams.get("assetType");
        const publicGroup = url.searchParams.get("publicGroup");
        const sourceCollection = url.searchParams.get("sourceCollection")?.trim() ?? "";
        const includeOther = optionalBoolean(url.searchParams.get("includeOther"), false);
        const includeUnknown = optionalBoolean(url.searchParams.get("includeUnknown"), false);
        const includeStaging = optionalBoolean(url.searchParams.get("includeStaging"), false);
        const missingImage = optionalBoolean(url.searchParams.get("missingImage"), false);
        const sort = normalizeSort(url.searchParams.get("sort"));

        const where: string[] = ["1 = 1"];
        const params: Array<string | number> = [];

        if (!includeStaging) {
          where.push("is_staging = 0");
        }

        if (!includeOther && (!assetType || assetType === "all")) {
          where.push("asset_type = 'card'");
          where.push("public_group = 'card'");
        }

        if (!includeUnknown) {
          where.push("category IS NOT NULL");
          where.push("category != 'unknown'");
        }

        if (category && category !== "all") {
          where.push("category = ?");
          params.push(category);
        }

        if (assetType && assetType !== "all") {
          where.push("asset_type = ?");
          params.push(assetType);
        }

        if (publicGroup && publicGroup !== "all") {
          where.push("public_group = ?");
          params.push(publicGroup);
        }

        if (sourceCollection) {
        if (sourceCollection === "collector_crypt") {
            where.push("source_collection = ?");
            params.push("CCryptWBYktukHDQ2vHGtVcmtjXxYzvw8XNVY64YN2Yf");
        } else if (sourceCollection === "phygitals") {
            where.push("source_collection IN (?, ?)");
            params.push(
            "BSG6DyEihFFtfvxtL9mKYsvTwiZXB1rq5gARMTJC2xAM",
            "phygZDQZJZVHvJGYPGoKPYUtXw7mstSYtTtcuh8LJcC",
            );
        } else {
            where.push("source_collection = ?");
            params.push(sourceCollection);
        }
        }

        if (missingImage) {
          where.push("(image IS NULL OR image = '')");
        }

        if (search) {
          where.push(`(
            name LIKE ?
            OR mint LIKE ?
            OR collection LIKE ?
            OR owner LIKE ?
            OR source_collection LIKE ?
          )`);
          const like = `%${search}%`;
          params.push(like, like, like, like, like);
        }

        const whereSql = where.join(" AND ");

        const orderBy =
          sort === "name_desc"
            ? "LOWER(COALESCE(name, '')) DESC"
            : sort === "updated_desc"
              ? "updated_at DESC"
              : sort === "category_asc"
                ? "category ASC, LOWER(COALESCE(name, '')) ASC"
                : "LOWER(COALESCE(name, '')) ASC";

        const totalRow = db.prepare(`SELECT COUNT(*) as total FROM nft_assets WHERE ${whereSql}`).get(...params) as { total?: number };
        const total = Number(totalRow?.total ?? 0);

        const rows = db.prepare(`
          SELECT
            mint,
            name,
            image,
            owner,
            collection,
            source_collection,
            category,
            asset_type,
            public_group,
            is_staging,
            updated_at,
            last_sale_price_sol,
            last_sale_price_usd,
            last_sale_at,
            last_sale_marketplace
          FROM nft_assets
          WHERE ${whereSql}
          ORDER BY ${orderBy}
          LIMIT ? OFFSET ?
        `).all(...params, limit, offset) as Array<Record<string, unknown>>;

        const nfts = rows.map((row) => ({
          mint: String(row.mint ?? ""),
          name: typeof row.name === "string" ? row.name : null,
          image: typeof row.image === "string" ? row.image : null,
          owner: typeof row.owner === "string" ? row.owner : null,
          collection: typeof row.collection === "string" ? row.collection : null,
          sourceCollection: typeof row.source_collection === "string" ? row.source_collection : null,
          category: typeof row.category === "string" ? row.category : "unknown",
          assetType: typeof row.asset_type === "string" ? row.asset_type : "unknown",
          publicGroup: typeof row.public_group === "string" ? row.public_group : "other",
          isStaging: Boolean(row.is_staging),
          updatedAt: typeof row.updated_at === "string" ? row.updated_at : null,
          lastSalePriceSol: typeof row.last_sale_price_sol === "number" ? row.last_sale_price_sol : null,
          lastSalePriceUsd: typeof row.last_sale_price_usd === "number" ? row.last_sale_price_usd : null,
          lastSaleAt: typeof row.last_sale_at === "string" ? row.last_sale_at : null,
          lastSaleMarketplace: typeof row.last_sale_marketplace === "string" ? row.last_sale_marketplace : null,
        }));

        const categoryCounts = db.prepare(`
          SELECT category, COUNT(*) as count
          FROM nft_assets
          WHERE ${whereSql}
          GROUP BY category
          ORDER BY count DESC
        `).all(...params);

        const assetTypeCounts = db.prepare(`
          SELECT asset_type, COUNT(*) as count
          FROM nft_assets
          WHERE ${whereSql}
          GROUP BY asset_type
          ORDER BY count DESC
        `).all(...params);

        const publicGroupCounts = db.prepare(`
          SELECT public_group, COUNT(*) as count
          FROM nft_assets
          WHERE ${whereSql}
          GROUP BY public_group
          ORDER BY count DESC
        `).all(...params);

        return Response.json(
          {
            total,
            page,
            limit,
            nfts,
            categoryCounts,
            assetTypeCounts,
            publicGroupCounts,
          },
          { headers: { "Cache-Control": "no-store" } },
        );
      },
    },
  },
});
