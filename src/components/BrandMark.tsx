interface BrandMarkProps {
  className?: string
}

/**
 * The sail/flag-shaped brand mark used in the nav and public share view,
 * matching the reference design system's logo (a simple triangular sail).
 */
export function BrandMark({ className = '' }: BrandMarkProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className={className}>
      <path d="M12 2 L4 21 L12 16.5 L20 21 Z" />
    </svg>
  )
}
