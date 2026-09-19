import { type WebSocketHandlerConnection, ws } from 'msw'
import type { NftUpdatedEvent, OrderUpdatedEvent } from '../contracts/api'
import { getState, onMockChange, resolveSessionToken, resumePendingSettlements } from './state'

type RealtimeEvent = NftUpdatedEvent | OrderUpdatedEvent

type Connection = {
  client: WebSocketHandlerConnection['client']
  userId: string | null
  joined: boolean
}

const pingInterval = 25_000
const pingTimeout = 20_000
const connections = new Set<Connection>()
const history: RealtimeEvent[] = []

const realtime = ws.link('*/realtime')

function send(connection: Connection, event: RealtimeEvent) {
  connection.client.send(`42${JSON.stringify([event.type, event])}`)
}

function publish(event: RealtimeEvent) {
  history.push(event)
  if (history.length > 50) history.shift()
  for (const connection of connections) {
    if (!connection.joined) continue
    if (event.audience && connection.userId !== event.audience) continue
    send(connection, event)
  }
}

onMockChange((change) => {
  const occurredAt = new Date().toISOString()
  if (change.kind === 'nft') {
    publish({
      id: crypto.randomUUID(),
      type: 'nft.updated',
      resource: { type: 'nft', id: change.nft.id },
      version: change.nft.version ?? 1,
      occurredAt,
      data: {
        id: change.nft.id,
        priceEth: change.nft.priceEth,
        previousPriceEth: change.nft.previousPriceEth,
        available: change.nft.available,
      },
    })
    return
  }
  publish({
    id: crypto.randomUUID(),
    type: 'order.updated',
    resource: { type: 'order', id: change.order.id },
    version: change.order.version,
    occurredAt,
    audience: change.userId,
    data: structuredClone(change.order),
  })
})

resumePendingSettlements()

export const realtimeHandler = realtime.addEventListener('connection', ({ client }) => {
  if (getState().scenario.offline) {
    client.close()
    return
  }
  const connection: Connection = { client, userId: null, joined: false }
  connections.add(connection)

  client.send(`0${JSON.stringify({ sid: client.id, upgrades: [], pingInterval, pingTimeout, maxPayload: 1_000_000 })}`)
  const ping = setInterval(() => client.send('2'), pingInterval)

  client.addEventListener('message', (event) => {
    const packet = String(event.data)
    if (packet === '3') return
    if (packet.startsWith('40')) {
      const auth = packet.length > 2 ? (JSON.parse(packet.slice(2)) as { token?: string }) : {}
      connection.userId = resolveSessionToken(auth.token)?.user.id ?? null
      connection.joined = true
      client.send(`40${JSON.stringify({ sid: crypto.randomUUID() })}`)
      return
    }
    if (packet.startsWith('41') || packet === '1') {
      connection.joined = false
    }
  })

  client.addEventListener('close', () => {
    clearInterval(ping)
    connections.delete(connection)
  })
})

export function replayLastEvent() {
  const last = history.at(-1)
  if (!last) return null
  for (const connection of connections) {
    if (connection.joined && (!last.audience || connection.userId === last.audience)) send(connection, last)
  }
  return last
}

export function replayStaleEvent() {
  const last = history.at(-1)
  if (!last) return null
  const older = [...history].reverse().find((event) =>
    event !== last && event.resource.type === last.resource.type && event.resource.id === last.resource.id && event.version < last.version,
  )
  if (!older) return null
  const stale = { ...older, id: crypto.randomUUID() } as RealtimeEvent
  for (const connection of connections) {
    if (connection.joined && (!stale.audience || connection.userId === stale.audience)) send(connection, stale)
  }
  return stale
}

export function dropConnections() {
  const count = connections.size
  for (const connection of [...connections]) connection.client.close()
  return count
}
