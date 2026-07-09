const PEXELS_ENDPOINT = 'https://api.pexels.com/v1/search'

export interface DestinationPhoto {
  url: string
  photographerName: string
  photographerUrl: string
}

/**
 * Searches Pexels for a photo representing a destination. Appends
 * "travel landscape" to the raw destination string to bias results toward
 * scenic, recognizable shots rather than random unrelated photos that
 * happen to share a word with the place name.
 *
 * Returns null on any failure (no API key, no results, network error) —
 * callers should treat a null result as "no photo available" and fall back
 * to the app's default gradient header, never show a broken image.
 */
export async function searchDestinationPhoto(destination: string): Promise<DestinationPhoto | null> {
  const apiKey = import.meta.env.VITE_PEXELS_API_KEY
  if (!apiKey) {
    console.warn('[pexels] VITE_PEXELS_API_KEY is not set — skipping destination photo search.')
    return null
  }

  const query = `${destination} travel landscape`
  const url = `${PEXELS_ENDPOINT}?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`

  let response: Response
  try {
    response = await fetch(url, {
      headers: { Authorization: apiKey },
    })
  } catch {
    return null
  }

  if (!response.ok) return null

  const data = await response.json()
  const photo = data?.photos?.[0]
  if (!photo) return null

  return {
    url: photo.src?.large2x ?? photo.src?.large ?? photo.src?.original,
    photographerName: photo.photographer ?? 'Unknown',
    photographerUrl: photo.photographer_url ?? 'https://www.pexels.com',
  }
}
