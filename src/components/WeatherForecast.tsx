import { useEffect, useState } from 'react'
import { CircleNotch } from '@phosphor-icons/react'
import { fetchWeatherForDestination, type WeatherResult } from '../lib/weather'
import { weatherIconFor, weatherLabelFor } from '../lib/weatherIcons'

interface WeatherForecastProps {
  destination: string
  /** Called once if the forecast can't be resolved, so the parent can hide
   * the surrounding card entirely rather than show an empty-looking box. */
  onUnavailable?: () => void
}

function dayLabel(dateStr: string, index: number): string {
  if (index === 0) return 'Today'
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' })
}

/**
 * A compact 7-day forecast strip for the destination — general climate
 * awareness, not matched to specific trip days (kept simple on purpose).
 * Renders nothing at all if the destination can't be resolved or the API
 * call fails — a missing weather tile is a much better failure mode than a
 * broken-looking one.
 */
export function WeatherForecast({ destination, onUnavailable }: WeatherForecastProps) {
  const [weather, setWeather] = useState<WeatherResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)

    fetchWeatherForDestination(destination).then((result) => {
      if (!active) return
      if (result) {
        setWeather(result)
      } else {
        onUnavailable?.()
      }
      setLoading(false)
    })

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination])

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-mist-400">
        <CircleNotch size={14} className="animate-spin" />
        Loading forecast…
      </div>
    )
  }

  if (!weather) {
    return null
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {weather.days.map((day, i) => {
        const Icon = weatherIconFor(day.weatherCode)
        const isToday = i === 0
        return (
          <div
            key={day.date}
            className={`flex min-w-[68px] flex-1 flex-col items-center gap-2 rounded-[1rem] border px-2.5 py-3.5 text-center transition-colors duration-300 ${
              isToday
                ? 'border-gold-500/30 bg-gold-500/[0.08]'
                : 'border-hairline bg-mist-400/[0.03] hover:bg-mist-400/[0.06]'
            }`}
            title={weatherLabelFor(day.weatherCode)}
          >
            <span className={`text-[0.7rem] font-medium ${isToday ? 'text-gold-300' : 'text-mist-400'}`}>
              {dayLabel(day.date, i)}
            </span>
            <Icon size={26} weight="fill" className="text-gold-400" />
            <span className="tabular text-[0.95rem] font-semibold text-mist-50">{day.maxTemp}°</span>
            <span className="tabular text-[0.72rem] text-mist-400">{day.minTemp}°</span>
          </div>
        )
      })}
    </div>
  )
}
