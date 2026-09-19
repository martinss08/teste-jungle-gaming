import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useEffect, type ReactNode } from 'react'
import { useAuth } from './useAuth'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useRouterState({ select: (state) => state.location })
  const { pathname } = location
  const redirect = `${pathname}${location.searchStr}`

  useEffect(() => {
    if (pathname === '/login' || pathname === '/cadastro') return

    if (!isLoading && !isAuthenticated) {
      void navigate({
        to: '/login',
        search: { redirect },
        replace: true,
      })
    }
  }, [isAuthenticated, isLoading, navigate, pathname, redirect])

  if (isLoading) {
    return (
      <div className="grid min-h-[55vh] place-items-center px-6 text-center">
        <div>
          <div className="mx-auto size-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-4 text-sm font-semibold text-foreground/65">Recuperando sessao...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return children
}
