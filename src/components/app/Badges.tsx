import { cn } from "@/lib/utils";

export function ChangeBadge({ value, className }: { value: number; className?: string }) {
  const positive = value >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium font-mono tabular-nums",
        positive
          ? "bg-success/10 text-success"
          : "bg-danger/10 text-danger",
        className,
      )}
    >
      {positive ? "▲" : "▼"} {Math.abs(value).toFixed(2)}%
    </span>
  );
}

export function TypeBadge({ type }: { type: "NFT" | "RWA" | "Phygital" }) {
  const map: Record<string, string> = {
    NFT: "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20",
    RWA: "bg-primary/15 text-primary ring-1 ring-primary/30",
    Phygital: "bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20",
  };
  return (
    <span className={cn("inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase", map[type])}>
      {type}
    </span>
  );
}
