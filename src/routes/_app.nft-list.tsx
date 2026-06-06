import { createFileRoute } from "@tanstack/react-router";
import { NftListPage } from "@/components/app/NftListPage";

export const Route = createFileRoute("/_app/nft-list")({
  component: NftListPage,
  head: () => ({ meta: [{ title: "NFT List — Perp RWA" }] }),
});
