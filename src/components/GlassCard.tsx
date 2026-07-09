import type { ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  innerClassName?: string
  as?: 'div' | 'article'
  onClick?: () => void
  /** When true, the card visibly lifts — gold glow, brighter border — versus
   * its neutral siblings. Use for exactly one primary focus per screen
   * (e.g. the day currently shown on the map), not broadly. */
  active?: boolean
  /** Use the nested double-bezel treatment (outer shell + inner core) —
   * reserved for the trip wizard per the reference design system. Most
   * cards (trip cards, day blocks, bento cards, panels) are single-surface. */
  nested?: boolean
}

/**
 * Single-surface card: a rounded rect with a hairline border and a flat
 * dark surface color — the default card pattern across the app (trip cards,
 * day blocks, bento features, side panel). Pass `nested` for the wizard's
 * heavier double-bezel treatment instead.
 */
export function GlassCard({
  children,
  className = '',
  innerClassName = '',
  as = 'div',
  onClick,
  active = false,
  nested = false,
}: GlassCardProps) {
  const Tag = as

  if (nested) {
    return (
      <Tag
        onClick={onClick}
        className={`rounded-2xl bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-1.5
                    ring-1 ring-white/[0.08] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.6)]
                    transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${className}`}
      >
        <div
          className={`rounded-[calc(theme(borderRadius.2xl)-0.375rem)] bg-ink-800
                      shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] ${innerClassName}`}
        >
          {children}
        </div>
      </Tag>
    )
  }

  return (
    <Tag
      onClick={onClick}
      className={`rounded-[1.8rem] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]
                  ${
                    active
                      ? 'glow-gold border border-gold-400/25 bg-gold-400/[0.05]'
                      : 'border border-hairline bg-ink-800'
                  } ${className} ${innerClassName}`}
    >
      {children}
    </Tag>
  )
}
