import { useEffect, useRef, useState } from 'react'

/**
 * Returns a ref to attach to an element and a boolean for whether it has
 * entered the viewport. Uses IntersectionObserver (never scroll listeners)
 * per performance guardrails. Fires once, then disconnects.
 */
export function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, inView }
}
