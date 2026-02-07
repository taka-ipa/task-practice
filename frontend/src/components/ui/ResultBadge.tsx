import { cn } from "@/lib/utils";

type Props = {
  isWin: boolean | null;
  className?: string;
};

export function ResultBadge({ isWin, className }: Props) {
  if (isWin === null) return null;

  const label = isWin ? "勝ち" : "負け";

  return (
    <span
      className={cn(
        "result-badge",
        isWin ? "badge-ink" : "badge-salmon",
        className
      )}
    >
      {label}
    </span>
  );
}
