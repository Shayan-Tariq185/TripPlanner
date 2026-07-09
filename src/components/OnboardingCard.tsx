import { useState } from 'react'
import { Sparkle, MapTrifold, Coins, X } from '@phosphor-icons/react'
import { MountReveal } from './MountReveal'

const STORAGE_KEY = 'voyageflow:onboarding-dismissed'

export function hasSeenOnboarding(): boolean {
  return localStorage.getItem(STORAGE_KEY) === '1'
}

function dismissOnboarding() {
  localStorage.setItem(STORAGE_KEY, '1')
}

const POINTS = [
  { icon: Sparkle, text: 'Tell it where and when — get a full day-by-day plan back in seconds.' },
  { icon: MapTrifold, text: 'Every stop lands on a real map with real routes between them.' },
  { icon: Coins, text: 'Budget, weather, packing, and notes all live with the trip, not scattered apps.' },
]

/**
 * A one-time explanatory card shown to first-time visitors on an empty
 * dashboard — distinct from the "no trips yet" empty state below it, which
 * is a prompt to act. This is a brief "here's what this does" moment,
 * dismissed permanently once closed or once the user creates a first trip.
 */
export function OnboardingCard({ onDismiss }: { onDismiss: () => void }) {
  const [closing, setClosing] = useState(false)

  function handleDismiss() {
    setClosing(true)
    dismissOnboarding()
    setTimeout(onDismiss, 200)
  }

  return (
    <MountReveal className={closing ? 'pointer-events-none opacity-0 transition-opacity duration-200' : ''}>
      <div className="relative overflow-hidden rounded-[1.8rem] border border-gold-500/20 bg-gold-500/[0.04] p-6 sm:p-8">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 500px 260px at 0% 0%, rgba(212,166,87,0.12), transparent 60%)',
          }}
        />
        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-mist-400 transition-colors duration-300 hover:bg-white/[0.06] hover:text-mist-100"
        >
          <X size={15} weight="light" />
        </button>

        <span className="eyebrow">
          <span className="eyebrow-dot" /> Welcome to VoyageFlow
        </span>
        <h2 className="relative mt-3 max-w-md font-display text-2xl font-normal text-mist-50">
          A trip planner that actually plans the trip.
        </h2>

        <div className="relative mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {POINTS.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-start gap-2.5">
              <Icon size={16} weight="light" className="mt-0.5 shrink-0 text-gold-400" />
              <p className="text-[0.8rem] leading-relaxed text-mist-300">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </MountReveal>
  )
}
