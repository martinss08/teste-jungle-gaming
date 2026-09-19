import type { Socket } from 'socket.io-client'
import type { ServerToClientEvents } from '../contracts/api'

export type RealtimeSocket = Socket<ServerToClientEvents>

// Transporte apenas `websocket`: e o que o MSW intercepta no navegador (sem long-polling HTTP).
// O token da sessao vai no handshake (`auth`); sem token a conexao so recebe eventos publicos.
//
// O import e dinamico de proposito: o engine.io-client guarda `globalThis.WebSocket` quando o
// modulo e avaliado. Carregando so depois do `worker.start()`, ele usa o WebSocket interceptado
// pelo MSW (com import estatico ficaria com o nativo e nunca chegaria ao mock).
export async function createRealtimeSocket(token: string | null): Promise<RealtimeSocket> {
  const { io } = await import('socket.io-client')
  return io(window.location.origin, {
    // Caminho dedicado; veja src/mocks/realtime.ts sobre o prefixo /socket.io no MSW.
    path: '/realtime',
    transports: ['websocket'],
    autoConnect: false,
    auth: token ? { token } : {},
    reconnectionDelay: 500,
    reconnectionDelayMax: 3_000,
  })
}
