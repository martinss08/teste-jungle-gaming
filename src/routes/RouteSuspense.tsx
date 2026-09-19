import { Suspense, type ReactNode } from 'react'

function RouteFallback() {
  return (
    <div className="mx-auto min-h-[55vh] max-w-[1440px] px-6 py-10 lg:px-[120px]" aria-busy="true">
      <div className="skeleton h-10 w-48 rounded-sm" />
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="skeleton h-64 rounded-sm" />
        <div className="skeleton h-64 rounded-sm" />
      </div>
    </div>
  )
}

export function RouteSuspense({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>
}
