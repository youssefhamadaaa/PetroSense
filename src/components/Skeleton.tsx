// ---------------------------------------------------------------------------
// Skeleton — simple shimmering placeholder block used in loading states.
// The shimmer is a plain CSS pulse, which prefers-reduced-motion neutralizes.
// ---------------------------------------------------------------------------

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-input bg-border/40 ${className}`}
      aria-hidden="true"
    />
  )
}
