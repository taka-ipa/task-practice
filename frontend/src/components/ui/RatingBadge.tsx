import { cn } from "@/lib/utils";

type Rating = "○" | "△" | "×" | "-";

const styles: Record<Rating, string> = {
  "○": "rating-yes",
  "△": "rating-neutral",
  "×": "rating-no",
  "-": "rating-empty",
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
        "badge",
        styles[rating],
        className
      )}
    >
      {rating}
    </span>
  );
}
