import { Skeleton } from './Skeleton'

/**
 * Matches TripView's real shape once loaded: cover photo banner, header
 * meta row, main-view toggle, then a couple of day-card placeholders with
 * a few stop-row-shaped lines inside each — not just a centered spinner.
 */
export function TripViewSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-12 md:pt-16">
      <Skeleton className="h-4 w-24" />

      <div className="mt-4">
        <Skeleton className="h-[220px] w-full rounded-[1.8rem]" />
      </div>

      <div className="mt-6">
        <Skeleton className="h-10 w-48 rounded-full" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_460px]">
        <div className="flex flex-col gap-6">
          {[0, 1].map((day) => (
            <div key={day} className="rounded-[1.8rem] border border-hairline bg-ink-800 p-[1.6rem]">
              <Skeleton className="mb-5 h-6 w-24" />
              <div className="flex flex-col gap-3">
                {[0, 1, 2].map((row) => (
                  <div key={row} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="mb-1.5 h-4 w-3/5" />
                      <Skeleton className="h-3 w-2/5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <Skeleton className="h-[500px] w-full rounded-[1.8rem]" />
      </div>
    </div>
  )
}
