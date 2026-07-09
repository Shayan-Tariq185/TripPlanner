interface SkeletonProps {
  className?: string
}

/**
 * A shimmering placeholder block. Compose these into shapes matching the
 * real layout that's about to load — never a generic centered spinner.
 * The shimmer itself is a CSS animation (see .skeleton-shimmer in index.css)
 * using only background-position, so it's GPU-cheap and safe on scrolling pages.
 */
export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`skeleton-shimmer rounded-[0.9rem] bg-white/[0.06] ${className}`} />
}
