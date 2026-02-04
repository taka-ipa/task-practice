import { cn } from "@/lib/utils";

type Props = {
  isWin: boolean | null;
  className?: string;
};

export function ResultBadge({ isWin, className }: Props) {
  if (isWin === null) return null;

  const label = isWin ? "WIN" : "LOSE";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        isWin
          ? "bg-emerald-100 text-emerald-700"
          : "bg-rose-100 text-rose-700",
        className
      )}
    >
      {label}
    </span>
  );
}
