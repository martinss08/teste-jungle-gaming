import { createContext } from 'react'

export type RealtimeStatus = 'connecting' | 'connected' | 'reconnecting'

export type RealtimeContextValue = {
  status: RealtimeStatus
}

export const RealtimeContext = createContext<RealtimeContextValue | null>(null)
