import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-[var(--term-surface-hi)] animate-pulse", className)}
      {...props}
    />
  )
}

export { Skeleton }
