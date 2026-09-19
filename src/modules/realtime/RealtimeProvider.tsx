import { useQueryClient } from '@tanstack/react-query'
import { type ReactNode, useEffect, useState } from 'react'
import type { RealtimeResource } from '../../contracts/api'
import { createRealtimeSocket, type RealtimeSocket } from '../../lib/socket'
import { useAuth } from '../auth/useAuth'
import { applyNftUpdated, applyOrderUpdated, reconcileActiveQueries } from './cache'
import { RealtimeContext, type RealtimeStatus } from './RealtimeContext'

const maxRememberedEvents = 500

export type RealtimeOutcome = 'applied' | 'duplicate' | 'stale' | 'foreign'

// Gancho de observacao (testes E2E/depuracao): informa o desfecho de cada evento recebido.
function report(event: { id: string; type: string; version: number }, outcome: RealtimeOutcome) {
  window.dispatchEvent(new CustomEvent('kurio:realtime', { detail: { id: event.id, type: event.type, version: event.version, outcome } }))
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const { session, isLoading } = useAuth()
  const token = session?.token ?? null
  const userId = session?.user.id ?? null
  // Status por token: trocar de sessao volta a "connecting" sem setState dentro do efeito.
  const [connection, setConnection] = useState<{ token: string | null; status: RealtimeStatus }>({ token, status: 'connecting' })
  const status: RealtimeStatus = connection.token === token ? connection.status : 'connecting'

  useEffect(() => {
    if (isLoading) return

    // Um socket por sessao: ao trocar/encerrar a sessao o anterior e desconectado e seus
    // listeners liberados, entao eventos da sessao anterior nao chegam ao usuario atual.
    let socket: RealtimeSocket | null = null
    let disposed = false
    const seenEventIds = new Set<string>()
    const versions = new Map<string, number>()
    let hasConnected = false

    const accept = (event: { id: string; type: string; resource: RealtimeResource; version: number }) => {
      if (seenEventIds.has(event.id)) {
        report(event, 'duplicate')
        return false
      }
      seenEventIds.add(event.id)
      if (seenEventIds.size > maxRememberedEvents) seenEventIds.delete(seenEventIds.values().next().value!)
      const key = `${event.resource.type}:${event.resource.id}`
      if ((versions.get(key) ?? 0) >= event.version) {
        report(event, 'stale')
        return false
      }
      versions.set(key, event.version)
      report(event, 'applied')
      return true
    }

    const listen = (created: RealtimeSocket) => {
      created.on('connect', () => {
        setConnection({ token, status: 'connected' })
        if (hasConnected) reconcileActiveQueries(queryClient)
        hasConnected = true
      })
      created.on('disconnect', () => setConnection({ token, status: 'reconnecting' }))
      created.on('connect_error', () => setConnection({ token, status: 'reconnecting' }))

      created.on('nft.updated', (event) => {
        if (accept(event)) applyNftUpdated(queryClient, event)
      })
      created.on('order.updated', (event) => {
        // Defesa extra alem do filtro do servidor: evento de outro usuario nunca e aplicado.
        if (!userId || event.audience !== userId) return report(event, 'foreign')
        if (accept(event)) applyOrderUpdated(queryClient, userId, event)
      })
      created.connect()
    }

    void createRealtimeSocket(token).then((created) => {
      // A sessao pode ter mudado enquanto o cliente carregava.
      if (disposed) return
      socket = created
      listen(created)
    })

    return () => {
      disposed = true
      socket?.removeAllListeners()
      socket?.disconnect()
    }
  }, [isLoading, token, userId, queryClient])

  return <RealtimeContext.Provider value={{ status }}>{children}</RealtimeContext.Provider>
}
