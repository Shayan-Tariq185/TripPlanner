interface ReadinessGaugeProps {
  startDate: string
  endDate: string
}

/**
 * A circular countdown gauge showing days until the trip starts (or "in
 * progress" / "completed" once dates pass). Matches the Nepal-dashboard
 * reference's "Readiness" card.
 */
export function ReadinessGauge({ startDate, endDate }: ReadinessGaugeProps) {
  const now = new Date()
  const start = new Date(startDate)
  const end = new Date(endDate)

  const msPerDay = 1000 * 60 * 60 * 24
  const daysUntilStart = Math.ceil((start.getTime() - now.getTime()) / msPerDay)
  const isInProgress = now >= start && now <= end
  const isPast = now > end

  let label: string
  let sublabel: string
  let percent: number

  if (isPast) {
    label = '—'
    sublabel = 'Completed'
    percent = 100
  } else if (isInProgress) {
    label = '✓'
    sublabel = 'Underway'
    percent = 100
  } else {
    label = String(Math.max(daysUntilStart, 0))
    sublabel = 'Days left'
    percent = Math.max(0, Math.min(100, 100 - (daysUntilStart / 60) * 100))
  }

  const radius = 42
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference

  return (
    <div className="flex flex-col items-center justify-center gap-2 py-2">
      <div className="relative flex h-[104px] w-[104px] items-center justify-center">
        <svg viewBox="0 0 104 104" className="absolute -rotate-90">
          <circle cx="52" cy="52" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
          <circle
            cx="52"
            cy="52"
            r={radius}
            fill="none"
            stroke="#d4a657"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.22,1,0.36,1)' }}
          />
        </svg>
        <div className="text-center">
          <div className="font-display text-[1.8rem] font-medium text-mist-50">{label}</div>
        </div>
      </div>
      <span className="text-[0.8rem] font-medium text-mist-300">{sublabel}</span>
    </div>
  )
}
