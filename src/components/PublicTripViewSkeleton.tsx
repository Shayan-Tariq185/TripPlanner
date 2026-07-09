import { Skeleton } from './Skeleton'

/**
 * Matches PublicTripView's real shape once loaded — no tab strip or drag
 * handles like the owner view, since public visitors get the simpler
 * read-only layout.
 */
export function PublicTripViewSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-10">
      <Skeleton className="h-6 w-32" />

      <div className="mt-8">
        <Skeleton className="h-[200px] w-full rounded-[1.8rem]" />
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_460px]">
        <div className="flex flex-col gap-6">
          {[0, 1].map((day) => (
            <div key={day} className="rounded-[1.8rem] border border-hairline bg-ink-800 p-[1.6rem]">
              <Skeleton className="mb-5 h-6 w-24" />
              <div className="flex flex-col gap-3">
                {[0, 1, 2].map((row) => (
                  <Skeleton key={row} className="h-12 w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>

        <Skeleton className="h-[480px] w-full rounded-[1.8rem]" />
      </div>
    </div>
  )
}
