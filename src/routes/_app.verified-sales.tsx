import { createFileRoute } from "@tanstack/react-router";
import { VerifiedSalesPage } from "@/components/app/VerifiedSalesPage";

export const Route = createFileRoute("/_app/verified-sales")({
  component: VerifiedSalesPage,
  head: () => ({ meta: [{ title: "Verified Sales — Perp RWA" }] }),
});
