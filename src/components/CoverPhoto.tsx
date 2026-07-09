import type { ReactNode } from 'react'
import { useDominantColor } from '../lib/useDominantColor'

interface CoverPhotoProps {
  imageUrl: string | null
  photographerName: string | null
  photographerUrl: string | null
  children: ReactNode
}

/**
 * Destination hero for the trip page. When a photo exists it's shown large and
 * photo-forward (so you actually see what the city looks like), with a dominant
 * colour pulled from the image and bled into an ambient glow behind and around
 * the header — the whole top of the page takes on the city's character. Falls
 * back to the app's brass gradient when no photo is available. Attribution is
 * shown per Pexels' license whenever a photo is displayed.
 */
export function CoverPhoto({ imageUrl, photographerName, photographerUrl, children }: CoverPhotoProps) {
  const dominant = useDominantColor(imageUrl)

  if (!imageUrl) {
    return (
      <div
        className="relative flex min-h-[240px] flex-col justify-end overflow-hidden rounded-[1.8rem] border border-hairline p-7 sm:p-9"
        style={{
          background:
            'radial-gradient(ellipse 500px 300px at 20% 0%, color-mix(in srgb, var(--gold-500) 14%, transparent), transparent 60%), linear-gradient(160deg, var(--ink-800), var(--ink-950) 75%)',
        }}
      >
        {children}
      </div>
    )
  }

  return (
    <div className="relative">
      {dominant && (
        <div
          className="pointer-events-none absolute -inset-x-8 -top-10 bottom-0 -z-10 opacity-70 blur-[60px]"
          style={{
            background: `radial-gradient(ellipse 70% 90% at 30% 20%, ${dominant}, transparent 70%)`,
          }}
          aria-hidden="true"
        />
      )}

      <div
        className="relative min-h-[340px] overflow-hidden rounded-[1.8rem] border border-white/[0.1] sm:min-h-[400px]"
        style={dominant ? { boxShadow: `0 40px 90px -50px ${dominant}` } : undefined}
      >
        <img
          src={imageUrl}
          alt="View of the destination"
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />

        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, transparent 0%, transparent 34%, color-mix(in srgb, var(--page-bg) 65%, transparent) 78%, color-mix(in srgb, var(--page-bg) 92%, transparent) 100%)',
          }}
        />

        <div className="relative flex min-h-[340px] flex-col justify-end p-7 sm:min-h-[400px] sm:p-9">
          {children}
        </div>

        {photographerName && (
          <a
            href={photographerUrl ?? 'https://www.pexels.com'}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-3 right-4 rounded-full bg-ink-950/40 px-2 py-1 text-[10px] text-mist-200/80 backdrop-blur-sm transition-colors hover:text-mist-50"
          >
            Photo by {photographerName} on Pexels
          </a>
        )}
      </div>
    </div>
  )
}
