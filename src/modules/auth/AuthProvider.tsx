import { useQuery, useQueryClient } from '@tanstack/react-query'
import { type ReactNode, useCallback, useState } from 'react'
import type { LoginRequest, RegisterRequest, SessionResponse } from '../../contracts/api'
import { api, clearSessionToken, getSessionToken, setSessionToken } from '../../lib/api'
import { AuthContext } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [token, setToken] = useState(() => getSessionToken())

  const sessionQuery = useQuery({
    queryKey: ['session'],
    enabled: Boolean(token),
    retry: false,
    queryFn: async () => {
      try {
        const { data } = await api.get<SessionResponse>('/session')
        return data
      } catch (error) {
        clearSessionToken()
        setToken(null)
        throw error
      }
    },
  })

  const login = useCallback(async (email: string, password: string) => {
    const payload: LoginRequest = { email, password }
    const { data } = await api.post<SessionResponse>('/auth/login', payload)
    queryClient.clear()
    setSessionToken(data.token)
    setToken(data.token)
    queryClient.setQueryData(['session'], data)
    await queryClient.invalidateQueries({ queryKey: ['cart'] })
    return data
  }, [queryClient])

  const register = useCallback(async (name: string, email: string, password: string) => {
    const payload: RegisterRequest = { name, email, password }
    const { data } = await api.post<SessionResponse>('/auth/register', payload)
    queryClient.clear()
    setSessionToken(data.token)
    setToken(data.token)
    queryClient.setQueryData(['session'], data)
    await queryClient.invalidateQueries({ queryKey: ['cart'] })
    return data
  }, [queryClient])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      clearSessionToken()
      setToken(null)
      queryClient.clear()
    }
  }, [queryClient])

  const session = token ? sessionQuery.data ?? null : null

  return (
    <AuthContext.Provider
      value={{
        session,
        isLoading: Boolean(token) && sessionQuery.isLoading,
        isAuthenticated: Boolean(session),
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
