import type { Socket } from 'socket.io-client'
import type { ServerToClientEvents } from '../contracts/api'

export type RealtimeSocket = Socket<ServerToClientEvents>

export async function createRealtimeSocket(token: string | null): Promise<RealtimeSocket> {
  const { io } = await import('socket.io-client')
  return io(window.location.origin, {
    path: '/realtime',
    transports: ['websocket'],
    autoConnect: false,
    auth: token ? { token } : {},
    reconnectionDelay: 500,
    reconnectionDelayMax: 3_000,
  })
}
