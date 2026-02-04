import { cn } from "@/lib/utils";

type Rating = "○" | "△" | "×" | "-";

const styles: Record<Rating, string> = {
  "○": "bg-emerald-100 text-emerald-700",
  "△": "bg-amber-100 text-amber-700",
  "×": "bg-rose-100 text-rose-700",
  "-": "bg-slate-100 text-slate-600",
};

export function RatingBadge({
  rating,
  className,
}: {
  rating: Rating;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold",
        styles[rating],
        className
      )}
    >
      {rating}
    </span>
  );
}
