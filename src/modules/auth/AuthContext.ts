import { createContext } from 'react'
import type { SessionResponse } from '../../contracts/api'

export type AuthContextValue = {
  session: SessionResponse | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<SessionResponse>
  register: (name: string, email: string, password: string) => Promise<SessionResponse>
  logout: () => Promise<void>
  // Sessao recusada pela API (401): descarta token e cache privado sem chamar o logout remoto.
  expireSession: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
