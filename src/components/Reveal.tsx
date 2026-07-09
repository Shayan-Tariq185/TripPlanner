import type { ReactNode } from 'react'
import { useInView } from '../lib/useInView'

interface RevealProps {
  children: ReactNode
  className?: string
  delayMs?: number
}

/**
 * Wraps content in a heavy fade-up-blur entry animation, triggered once when
 * scrolled into view. Respects prefers-reduced-motion globally (see index.css).
 */
export function Reveal({ children, className = '', delayMs = 0 }: RevealProps) {
  const { ref, inView } = useInView()

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        inView ? 'translate-y-0 opacity-100 blur-0' : 'translate-y-16 opacity-0 blur-md'
      } ${className}`}
      style={{ transitionDelay: inView ? `${delayMs}ms` : '0ms' }}
    >
      {children}
    </div>
  )
}
