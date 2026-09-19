import { useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { type ReactNode, useCallback, useEffect, useState } from 'react'
import type { LoginRequest, RegisterRequest, SessionResponse } from '../../contracts/api'
import { api, clearSessionToken, getSessionToken, setSessionToken } from '../../lib/api'
import { AuthContext } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [token, setToken] = useState(() => getSessionToken())
  const [sessionExpired, setSessionExpired] = useState(false)

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
        if (axios.isAxiosError(error) && error.response?.status === 401) setSessionExpired(true)
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
    setSessionExpired(false)
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
    setSessionExpired(false)
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
      setSessionExpired(false)
      queryClient.clear()
    }
  }, [queryClient])

  const expireSession = useCallback(() => {
    if (!getSessionToken()) return
    clearSessionToken()
    setToken(null)
    setSessionExpired(true)
    queryClient.clear()
  }, [queryClient])

  // Qualquer 401 em uma requisicao autenticada encerra a sessao local, inclusive em telas publicas.
  useEffect(() => {
    const interceptor = api.interceptors.response.use(undefined, (error) => {
      const authenticated = axios.isAxiosError(error) && Boolean(error.config?.headers?.Authorization)
      if (authenticated && error.response?.status === 401 && !error.config?.url?.startsWith('/auth/')) expireSession()
      return Promise.reject(error)
    })
    return () => api.interceptors.response.eject(interceptor)
  }, [expireSession])

  const session = token ? sessionQuery.data ?? null : null

  return (
    <AuthContext.Provider
      value={{
        session,
        isLoading: Boolean(token) && sessionQuery.isLoading,
        isAuthenticated: Boolean(session),
        sessionExpired,
        login,
        register,
        logout,
        expireSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
