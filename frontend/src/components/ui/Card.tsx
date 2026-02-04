import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>;

export function Card({ children, className, ...props }: Props) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-white p-4 shadow-sm",
        "transition hover:shadow-md hover:-translate-y-px",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
