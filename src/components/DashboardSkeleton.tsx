import { Skeleton } from './Skeleton'

/**
 * Matches TripCard's exact shape (photo strip, title + pill, two meta lines,
 * progress bar) so the loading state doesn't visually jump when real data
 * arrives — the whole point of a skeleton over a generic spinner.
 */
function TripCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[1.8rem] border border-hairline bg-ink-800">
      <Skeleton className="h-[120px] w-full rounded-none" />
      <div className="p-6 pt-5">
        <div className="mb-6 flex items-start justify-between gap-3">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
        </div>
        <div className="mb-6 flex flex-col gap-2.5">
          <Skeleton className="h-3.5 w-40" />
          <Skeleton className="h-3.5 w-28" />
        </div>
        <Skeleton className="h-1 w-full rounded-full" />
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <TripCardSkeleton key={i} />
      ))}
    </div>
  )
}
