import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import { getRoute } from '../lib/geoapify'
import type { Stop } from '../lib/types'
import 'leaflet/dist/leaflet.css'

interface DayMapProps {
  stops: Stop[]
  /** When false, skips fetching a routed path and numbered sequencing —
   * used for the trip-wide Overview map, where stops span multiple cities
   * and a walking route between them wouldn't be meaningful anyway. */
  showRoute?: boolean
  emptyLabel?: string
}

const TYPE_COLOR: Record<Stop['type'], string> = {
  hotel: '#d4a657',
  attraction: '#7fa37e',
  restaurant: '#e8785a',
  transport: '#8b96ac',
}

function numberedIcon(index: number, color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 26px; height: 26px; border-radius: 50%;
      background: ${color}; color: var(--ink-950);
      display: flex; align-items: center; justify-content: center;
      font-family: var(--font-body), sans-serif; font-size: 11px; font-weight: 600;
      box-shadow: 0 4px 12px -2px rgba(0,0,0,0.5), 0 0 0 2px var(--page-bg);
    ">${index + 1}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  })
}

function dotIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 12px; height: 12px; border-radius: 50%;
      background: ${color};
      box-shadow: 0 2px 8px -1px rgba(0,0,0,0.5), 0 0 0 2px var(--page-bg);
    "></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  })
}

function ZoomControls() {
  const map = useMap()
  return (
    <div className="absolute bottom-3 right-3 z-[400] flex flex-col gap-1.5">
      <button
        onClick={() => map.zoomIn()}
        aria-label="Zoom in"
        className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] border border-hairline-strong bg-ink-800/85 text-mist-100 backdrop-blur-sm"
      >
        +
      </button>
      <button
        onClick={() => map.zoomOut()}
        aria-label="Zoom out"
        className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] border border-hairline-strong bg-ink-800/85 text-mist-100 backdrop-blur-sm"
      >
        –
      </button>
    </div>
  )
}

/**
 * Renders a Leaflet map for one day's resolved stops (those with lat/lng),
 * with numbered markers matching list order and a real routed path (following
 * actual streets, via Geoapify Routing) connecting them in order. Falls back
 * to a straight line if routing fails, so the map never breaks — it just
 * loses some realism for that one day.
 */
export function DayMap({ stops, showRoute = true, emptyLabel }: DayMapProps) {
  const located = useMemo(
    () => stops.filter((s): s is Stop & { lat: number; lng: number } => s.lat !== null && s.lng !== null),
    [stops]
  )

  const [routePath, setRoutePath] = useState<[number, number][] | null>(null)
  const [routeLoading, setRouteLoading] = useState(false)

  const straightLine = useMemo<[number, number][]>(
    () => located.map((s) => [s.lat, s.lng]),
    [located]
  )

  useEffect(() => {
    setRoutePath(null)
    if (!showRoute || located.length < 2) return

    let active = true
    setRouteLoading(true)

    getRoute(located.map((s) => ({ lat: s.lat, lng: s.lng })), 'walk')
      .then((path) => {
        if (active) setRoutePath(path)
      })
      .finally(() => {
        if (active) setRouteLoading(false)
      })

    return () => {
      active = false
    }
  }, [located, showRoute])

  const center = useMemo<[number, number]>(() => {
    if (located.length === 0) return [20, 0]
    const avgLat = located.reduce((sum, s) => sum + s.lat, 0) / located.length
    const avgLng = located.reduce((sum, s) => sum + s.lng, 0) / located.length
    return [avgLat, avgLng]
  }, [located])

  // Rough zoom heuristic: a trip spanning many degrees (multiple cities/regions)
  // needs to zoom out much further than a single day's stops within one city.
  const spreadDegrees = useMemo(() => {
    if (located.length < 2) return 0
    const lats = located.map((s) => s.lat)
    const lngs = located.map((s) => s.lng)
    return Math.max(Math.max(...lats) - Math.min(...lats), Math.max(...lngs) - Math.min(...lngs))
  }, [located])

  const zoom = useMemo(() => {
    if (located.length <= 1) return 13
    if (spreadDegrees > 3) return 6
    if (spreadDegrees > 1) return 8
    if (spreadDegrees > 0.3) return 10
    return 13
  }, [located.length, spreadDegrees])

  if (located.length === 0) {
    return (
      <div
        className="flex h-full min-h-[220px] items-center justify-center rounded-[1.3rem] text-center"
        style={{
          background:
            'radial-gradient(circle at 30% 20%, rgba(212,166,87,0.08), transparent 45%), linear-gradient(160deg, #0e1728, #0a101c 70%)',
        }}
      >
        <p className="max-w-[220px] text-sm text-mist-400">{emptyLabel ?? 'No stops on the map yet for this day.'}</p>
      </div>
    )
  }

  const lineToRender = routePath ?? straightLine

  return (
    <div
      className="relative h-full min-h-[220px] overflow-hidden rounded-[1.3rem] border border-hairline"
      style={{
        background:
          'radial-gradient(circle at 30% 20%, rgba(212,166,87,0.08), transparent 45%), linear-gradient(160deg, #0e1728, #0a101c 70%)',
      }}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        zoomControl={false}
        style={{ height: '100%', width: '100%', background: 'transparent' }}
        key={located.map((s) => s.id).join('-')}
      >
        <TileLayer
          // Stadia Maps' alidade_smooth_dark has noticeably more road/label
          // detail than plain CARTO dark at most zoom levels. Falls back to
          // CARTO (no key required) if VITE_STADIA_API_KEY isn't set, so the
          // map never breaks — it just loses some visual density.
          url={
            import.meta.env.VITE_STADIA_API_KEY
              ? `https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png?api_key=${import.meta.env.VITE_STADIA_API_KEY}`
              : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
          }
          attribution=""
          className={import.meta.env.VITE_STADIA_API_KEY ? 'map-warm-tiles-stadia' : 'map-warm-tiles-carto'}
        />

        {showRoute && lineToRender.length > 1 && (
          <Polyline
            positions={lineToRender}
            pathOptions={
              routePath
                ? { color: '#d4a657', weight: 3, opacity: 0.85 }
                : { color: '#d4a657', weight: 2, opacity: 0.6, dashArray: '1 8' }
            }
          />
        )}

        {located.map((stop, i) => (
          <Marker
            key={stop.id}
            position={[stop.lat, stop.lng]}
            icon={showRoute ? numberedIcon(i, TYPE_COLOR[stop.type]) : dotIcon(TYPE_COLOR[stop.type])}
          >
            <Tooltip direction="top" offset={[0, -10]}>
              {stop.name}
            </Tooltip>
          </Marker>
        ))}

        <ZoomControls />
      </MapContainer>

      <div className="pointer-events-none absolute bottom-2 left-2.5 text-[9px] text-mist-400">
        {import.meta.env.VITE_STADIA_API_KEY ? 'Leaflet · © Stadia Maps · © OpenMapTiles · © OpenStreetMap' : 'Leaflet · © CARTO'}
      </div>

      {routeLoading && (
        <div className="pointer-events-none absolute top-3 left-3 rounded-full bg-ink-950/80 px-3 py-1 text-[11px] text-mist-400 backdrop-blur-sm">
          Tracing walking route…
        </div>
      )}
    </div>
  )
}
