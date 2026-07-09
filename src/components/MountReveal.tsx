import { useEffect, useState, type ReactNode } from 'react'

interface MountRevealProps {
  children: ReactNode
  className?: string
  delayMs?: number
}

/**
 * Like Reveal, but fires immediately on mount rather than waiting for
 * scroll-into-view. Use for content that's already above the fold on load
 * (dashboard trip cards, trip view day cards) where IntersectionObserver
 * would fire instantly anyway — this skips the observer overhead and the
 * one-frame flash of unstyled content some observers introduce.
 */
export function MountReveal({ children, className = '', delayMs = 0 }: MountRevealProps) {
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div
      className={`transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        shown ? 'translate-y-0 opacity-100 blur-0' : 'translate-y-6 opacity-0 blur-sm'
      } ${className}`}
      style={{ transitionDelay: shown ? `${delayMs}ms` : '0ms' }}
    >
      {children}
    </div>
  )
}
