import {
  Sun,
  CloudSun,
  Cloud,
  CloudFog,
  CloudRain,
  CloudSnow,
  CloudLightning,
  type IconProps,
} from '@phosphor-icons/react'
import type { ComponentType } from 'react'

/**
 * Maps Open-Meteo's WMO weather codes (https://open-meteo.com/en/docs, see
 * "WMO Weather interpretation codes") down to a small icon + label set —
 * not exhaustive, just enough granularity to be useful at a glance.
 */
export function weatherIconFor(code: number): ComponentType<IconProps> {
  if (code === 0) return Sun
  if (code <= 2) return CloudSun
  if (code === 3) return Cloud
  if (code >= 45 && code <= 48) return CloudFog
  if (code >= 51 && code <= 67) return CloudRain
  if (code >= 71 && code <= 86) return CloudSnow
  if (code >= 95) return CloudLightning
  return Cloud
}

export function weatherLabelFor(code: number): string {
  if (code === 0) return 'Clear'
  if (code <= 2) return 'Partly cloudy'
  if (code === 3) return 'Overcast'
  if (code >= 45 && code <= 48) return 'Foggy'
  if (code >= 51 && code <= 57) return 'Drizzle'
  if (code >= 61 && code <= 67) return 'Rain'
  if (code >= 71 && code <= 77) return 'Snow'
  if (code >= 80 && code <= 82) return 'Showers'
  if (code >= 85 && code <= 86) return 'Snow showers'
  if (code >= 95) return 'Thunderstorm'
  return 'Cloudy'
}
