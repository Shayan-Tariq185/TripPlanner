/**
 * Signature element: a glowing dashed path connecting waypoints, echoing the
 * itinerary/map concept. Used sparingly — hero background only.
 * Animates via stroke-dashoffset, respecting prefers-reduced-motion (handled globally in index.css).
 */
export function RouteLine({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 600"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="route-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e8b355" stopOpacity="0" />
          <stop offset="50%" stopColor="#e8b355" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#2bb0a5" stopOpacity="0" />
        </linearGradient>
        <filter id="route-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <path
        d="M 80 480 C 260 380, 320 220, 480 200 S 700 340, 860 260 S 1080 120, 1140 90"
        stroke="url(#route-gradient)"
        strokeWidth="2"
        strokeDasharray="6 10"
        filter="url(#route-glow)"
        className="route-path"
      />

      {[
        [80, 480],
        [480, 200],
        [860, 260],
        [1140, 90],
      ].map(([cx, cy], i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={i === 3 ? 5 : 3.5}
          fill={i === 3 ? '#e8b355' : '#e8b355'}
          opacity={0.9}
          filter="url(#route-glow)"
        />
      ))}

      <style>{`
        .route-path {
          animation: dash-flow 8s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .route-path { animation: none; }
        }
        @keyframes dash-flow {
          to { stroke-dashoffset: -160; }
        }
      `}</style>
    </svg>
  )
}
