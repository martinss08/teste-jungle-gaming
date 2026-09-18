import { createContext } from 'react'
import type { SessionResponse } from '../../contracts/api'

export type AuthContextValue = {
  session: SessionResponse | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<SessionResponse>
  register: (name: string, email: string, password: string) => Promise<SessionResponse>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
