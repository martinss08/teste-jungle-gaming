import { useRouterState } from '@tanstack/react-router'
import { useCallback } from 'react'
import { useAuth } from './useAuth'

export function useProtectedAction() {
  const { isAuthenticated } = useAuth()
  const location = useRouterState({ select: (state) => state.location })

  return useCallback((action: () => void) => {
    if (isAuthenticated) {
      action()
      return
    }

    window.dispatchEvent(new CustomEvent('kurio:auth-required', {
      detail: {
        mode: 'login',
        redirect: `${location.pathname}${location.searchStr}`,
      },
    }))
  }, [isAuthenticated, location.pathname, location.searchStr])
}
