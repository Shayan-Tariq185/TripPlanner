import { useState } from 'react'
import { ShareNetwork, Check } from '@phosphor-icons/react'

interface ShareButtonProps {
  shareSlug: string
}

/**
 * Shows the public read-only link for this trip and copies it on click.
 * The link itself requires no auth to view — see PublicTripView — and only
 * ever exposes the itinerary (trip/days/stops), never budget, notes, or
 * packing list, matching the RLS boundary set up in the schema.
 */
export function ShareButton({ shareSlug }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)
  const shareUrl = `${window.location.origin}/share/${shareSlug}`

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API can fail in some contexts (e.g. insecure origin) —
      // the link is still visible and selectable, so nothing is lost.
    }
  }

  return (
    <div className="flex min-w-0 items-center gap-2 rounded-full border border-hairline-strong bg-ink-800 px-3 py-2 pr-2 sm:gap-2.5 sm:px-4">
      <ShareNetwork size={14} weight="light" className="hidden shrink-0 text-mist-400 sm:block" />
      <input
        readOnly
        value={shareUrl}
        onFocus={(e) => e.target.select()}
        className="w-24 min-w-0 truncate bg-transparent text-[0.78rem] text-mist-300 focus:outline-none sm:w-44 md:w-52"
      />
      <button
        onClick={handleCopy}
        className="flex shrink-0 items-center gap-1.5 rounded-full bg-ink-600 px-3 py-1.5 text-[0.75rem] text-mist-100 transition-colors duration-400 hover:bg-gold-500/[0.18]"
      >
        {copied ? (
          <>
            <Check size={12} weight="bold" className="text-success-500" />
            <span className="hidden sm:inline">Copied</span>
          </>
        ) : (
          'Copy'
        )}
      </button>
    </div>
  )
}
