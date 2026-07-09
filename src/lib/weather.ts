const GEOCODE_ENDPOINT = 'https://geocoding-api.open-meteo.com/v1/search'
const FORECAST_ENDPOINT = 'https://api.open-meteo.com/v1/forecast'

export interface DayForecast {
  date: string // YYYY-MM-DD
  weatherCode: number
  maxTemp: number
  minTemp: number
}

export interface WeatherResult {
  days: DayForecast[]
}

/**
 * Open-Meteo — the only integration in this app that needs zero API key at
 * all, on either its geocoding or forecast endpoint. Free, no signup, no
 * rate-limit surprises to worry about for a project at this scale.
 *
 * Returns null on any failure (destination not found, network error) —
 * callers should treat null as "no forecast available" and hide the weather
 * tile entirely rather than show broken data.
 */
export async function fetchWeatherForDestination(destination: string): Promise<WeatherResult | null> {
  // Open-Meteo's geocoder works best with just the primary place name (e.g.
  // "Skardu" rather than "Skardu, Gilgit-Baltistan, Pakistan") — take the
  // first comma-separated segment.
  const query = destination.split(',')[0].trim()

  let geoResponse: Response
  try {
    geoResponse = await fetch(
      `${GEOCODE_ENDPOINT}?name=${encodeURIComponent(query)}&count=1&language=en&format=json`
    )
  } catch {
    return null
  }

  if (!geoResponse.ok) return null

  const geoData = await geoResponse.json()
  const place = geoData?.results?.[0]
  if (!place) return null

  const { latitude, longitude } = place

  let forecastResponse: Response
  try {
    forecastResponse = await fetch(
      `${FORECAST_ENDPOINT}?latitude=${latitude}&longitude=${longitude}` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`
    )
  } catch {
    return null
  }

  if (!forecastResponse.ok) return null

  const forecastData = await forecastResponse.json()
  const dates: string[] | undefined = forecastData?.daily?.time
  const codes: number[] | undefined = forecastData?.daily?.weather_code
  const maxTemps: number[] | undefined = forecastData?.daily?.temperature_2m_max
  const minTemps: number[] | undefined = forecastData?.daily?.temperature_2m_min

  if (!dates || !codes || !maxTemps || !minTemps) return null

  const days: DayForecast[] = dates.map((date, i) => ({
    date,
    weatherCode: codes[i],
    maxTemp: Math.round(maxTemps[i]),
    minTemp: Math.round(minTemps[i]),
  }))

  return { days }
}
