import { useEffect, useState } from 'react'

/**
 * Extracts a representative dominant color from an image URL by drawing a
 * tiny downscaled copy to a canvas and averaging the more saturated pixels
 * (skipping near-grey/near-black/near-white ones so the result is the photo's
 * *character* colour — the ochre of a desert city, the teal of a coast — not
 * a muddy average). Returns an `rgb(...)` string, or null until it resolves /
 * if the image can't be read (e.g. CORS-tainted). Purely decorative, so
 * callers should treat null as "use the default gradient".
 */
export function useDominantColor(imageUrl: string | null): string | null {
  const [color, setColor] = useState<string | null>(null)

  useEffect(() => {
    setColor(null)
    if (!imageUrl) return

    let active = true
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = imageUrl

    img.onload = () => {
      if (!active) return
      try {
        const size = 24
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.drawImage(img, 0, 0, size, size)
        const { data } = ctx.getImageData(0, 0, size, size)

        let r = 0
        let g = 0
        let b = 0
        let count = 0
        for (let i = 0; i < data.length; i += 4) {
          const pr = data[i]
          const pg = data[i + 1]
          const pb = data[i + 2]
          const max = Math.max(pr, pg, pb)
          const min = Math.min(pr, pg, pb)
          const sat = max - min
          const lum = (max + min) / 2
          // Skip washed-out (low saturation) and extreme dark/light pixels.
          if (sat < 28 || lum < 30 || lum > 232) continue
          r += pr
          g += pg
          b += pb
          count += 1
        }

        if (count === 0) return
        setColor(`rgb(${Math.round(r / count)}, ${Math.round(g / count)}, ${Math.round(b / count)})`)
      } catch {
        // CORS-tainted canvas or similar — silently keep the default.
      }
    }

    img.onerror = () => {}

    return () => {
      active = false
    }
  }, [imageUrl])

  return color
}
