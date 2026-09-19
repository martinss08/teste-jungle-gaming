import type {
  CartResponse,
  CollectorDetails,
  MockNftChange,
  MockScenario,
  Order,
  OrderStatus,
  Profile,
  QuoteLine,
  QuoteLineIssue,
  QuoteResponse,
  SessionResponse,
  WalletProvider,
} from '../contracts/api'
import { nfts, wallets as fixtureWallets } from '../data/nfts'
import { addEth, compareEth, multiplyEth, percentOfEth, subtractEth } from '../lib/eth'
import type { Nft, Wallet } from '../types'

type MockUser = {
  id: string
  name: string
  email: string
  passwordHash: string
}

type IdempotencyRecord = {
  userId: string
  fingerprint: string
  orderId: string
}

type OrderMeta = {
  userId: string
  resolveAt: number
  finalStatus: OrderStatus
}

type MockState = {
  users: MockUser[]
  sessions: Record<string, SessionResponse>
  profiles: Record<string, Profile>
  wallets: Record<string, Wallet[]>
  favorites: Record<string, string[]>
  carts: Record<string, CartResponse>
  orders: Record<string, Order>
  idempotency: Record<string, IdempotencyRecord>
  orderMeta: Record<string, OrderMeta>
  nftChanges: Record<string, MockNftChange>
  nftVersions: Record<string, number>
  quoteVersion: number
  scenario: MockScenario
}

const storageKey = 'kurio-msw-state-v1'
const guestCartKey = 'guest'

export const defaultScenario: MockScenario = {
  latencyMs: 120,
  jitterMs: 180,
  failNext: false,
  failNextCount: 0,
  forceSessionExpired: false,
  paymentResult: 'confirmado',
  quoteChanged: false,
  timeoutNextOrder: false,
  paymentDelayMs: 2500,
  walletConnection: 'aprovar',
  offline: false,
  slowNextListMs: 0,
}

function seedLine(nftId: string, quantity: number) {
  return { nftId, quantity, quotedUnitPriceEth: nfts.find((item) => item.id === nftId)?.priceEth }
}

function createInitialState(): MockState {
  const users: MockUser[] = [
    {
      id: 'user-julia',
      name: 'Julia Monteiro',
      email: 'julia@greenmint.dev',
      passwordHash: hashPassword('greenmint'),
    },
    {
      id: 'user-caio',
      name: 'Caio Araujo',
      email: 'caio@greenmint.dev',
      passwordHash: hashPassword('kurioaccess'),
    },
  ]

  return {
    users,
    sessions: {},
    profiles: {
      'user-julia': {
        userId: 'user-julia',
        name: 'Julia Monteiro',
        email: 'julia@greenmint.dev',
        username: 'juliam',
        bio: 'Coleciono obras digitais ligadas a impacto ambiental e comunidades independentes.',
        avatarUrl: 'https://api.dicebear.com/9.x/notionists/svg?seed=julia',
      },
      'user-caio': {
        userId: 'user-caio',
        name: 'Caio Araujo',
        email: 'caio@greenmint.dev',
        username: 'caio',
        bio: 'Curador de colecionaveis digitais raros e arte generativa.',
        avatarUrl: 'https://api.dicebear.com/9.x/notionists/svg?seed=caio',
      },
    },
    wallets: {
      'user-julia': fixtureWallets.map((wallet) => ({ ...wallet })),
      'user-caio': [
        {
          id: 'wallet-caio-main',
          label: 'Carteira principal',
          address: '0xA91F3b7C2e8D4a06F5c1B9e7D3a2C8f4E6b0E82C',
          network: 'Ethereum',
          status: 'conectada',
          kind: 'principal',
        },
      ],
    },
    favorites: {
      'user-julia': ['emerald-ape-042'],
      'user-caio': ['onyx-visual-232'],
    },
    carts: {
      [guestCartKey]: {
        items: [seedLine('emerald-ape-042', 1)],
        updatedAt: new Date().toISOString(),
      },
      'user-julia': {
        items: [
          seedLine('emerald-ape-042', 1),
          seedLine('sage-hood-804', 1),
        ],
        couponCode: 'KURIO10',
        updatedAt: new Date().toISOString(),
      },
      'user-caio': {
        items: [seedLine('onyx-visual-232', 1)],
        updatedAt: new Date().toISOString(),
      },
    },
    orders: {},
    idempotency: {},
    orderMeta: {},
    nftChanges: {},
    nftVersions: {},
    quoteVersion: 1,
    scenario: defaultScenario,
  }
}

let state = readState()

// Mudancas relevantes para o tempo real. O servidor Socket.IO simulado assina estas
// notificacoes (evita import circular entre o estado e o transporte).
export type MockChange = { kind: 'nft'; nft: Nft } | { kind: 'order'; order: Order; userId: string }
const changeListeners = new Set<(change: MockChange) => void>()

export function onMockChange(listener: (change: MockChange) => void) {
  changeListeners.add(listener)
  return () => {
    changeListeners.delete(listener)
  }
}

function emitChange(change: MockChange) {
  for (const listener of changeListeners) listener(change)
}

export function getState() {
  return state
}

export function resetState() {
  state = createInitialState()
  persistState()
  return state
}

export function persistState() {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(storageKey, JSON.stringify(state))
}

export function setScenario(next: Partial<MockScenario>) {
  state.scenario = { ...state.scenario, ...next }
  persistState()
  return state.scenario
}

export function getGuestCartKey() {
  return guestCartKey
}

// Catalogo "vivo": fixtures + alteracoes de preco/disponibilidade aplicadas pelo mock.
export function getNft(nftId: string): Nft | undefined {
  const nft = nfts.find((item) => item.id === nftId)
  if (!nft) return undefined
  const version = state.nftVersions[nftId] ?? 1
  const change = state.nftChanges[nftId]
  if (!change) return { ...nft, version }
  return {
    ...nft,
    version,
    priceEth: change.priceEth ?? nft.priceEth,
    previousPriceEth: change.priceEth && change.priceEth !== nft.priceEth ? nft.priceEth : nft.previousPriceEth,
    available: change.available ?? nft.available,
  }
}

export function listNfts(): Nft[] {
  return nfts.map((nft) => getNft(nft.id) ?? nft)
}

// Toda alteracao de preco/disponibilidade incrementa a versao do NFT e e publicada em tempo real.
export function updateNft(nftId: string, change: MockNftChange) {
  const nft = nfts.find((item) => item.id === nftId)
  if (!nft) return undefined
  state.nftChanges[nftId] = { ...state.nftChanges[nftId], ...change }
  state.nftVersions[nftId] = (state.nftVersions[nftId] ?? 1) + 1
  state.quoteVersion += 1
  persistState()
  const updated = getNft(nftId)!
  emitChange({ kind: 'nft', nft: updated })
  return updated
}

export function hashPassword(password: string) {
  let hash = 0
  for (const char of password) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  }
  return `mock-sha:${hash.toString(16)}`
}

export function createSession(userId: string): SessionResponse {
  const user = state.users.find((item) => item.id === userId)
  if (!user) throw new Error('User not found')

  const token = `mock-token-${user.id}-${crypto.randomUUID()}`
  const session: SessionResponse = {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    expiresAt: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
  }
  state.sessions[token] = session
  persistState()
  return session
}

export function removeSession(token: string) {
  delete state.sessions[token]
  persistState()
}

export function resolveSession(request: Request) {
  const header = request.headers.get('Authorization')
  return resolveSessionToken(header?.replace(/^Bearer\s+/i, ''))
}

export function resolveSessionToken(token: string | null | undefined) {
  if (state.scenario.forceSessionExpired) return null
  if (!token) return null

  const session = state.sessions[token]
  if (!session) return null
  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    delete state.sessions[token]
    persistState()
    return null
  }
  return session
}

// Token presente mas invalido/expirado retorna null: o carrinho nao cai silenciosamente para o de visitante.
export function getCartOwner(request: Request) {
  const hasToken = Boolean(request.headers.get('Authorization'))
  const session = resolveSession(request)
  if (hasToken && !session) return null
  return session?.user.id ?? request.headers.get('X-Guest-Id') ?? guestCartKey
}

export function ensureCart(owner: string): CartResponse {
  state.carts[owner] ??= {
    items: [],
    updatedAt: new Date().toISOString(),
  }
  return state.carts[owner]
}

export function touchCart(owner: string) {
  state.carts[owner].updatedAt = new Date().toISOString()
  persistState()
}

// Mescla o carrinho do visitante (identificado por X-Guest-Id) no carrinho do usuario,
// respeitando a disponibilidade atual. O carrinho do visitante fica vazio depois.
export function mergeGuestCartIntoUser(userId: string, guestId: string | null) {
  const guestKey = guestId ?? guestCartKey
  if (guestKey === userId) return
  const guestCart = ensureCart(guestKey)
  const userCart = ensureCart(userId)

  for (const guestLine of guestCart.items) {
    const nft = getNft(guestLine.nftId)
    if (!nft || nft.available < 1) continue
    const current = userCart.items.find((line) => line.nftId === guestLine.nftId)
    if (current) {
      current.quantity = Math.min(nft.available, current.quantity + guestLine.quantity)
    } else {
      userCart.items.push({ ...guestLine, quantity: Math.min(nft.available, guestLine.quantity) })
    }
  }
  if (!userCart.couponCode && guestCart.couponCode) userCart.couponCode = guestCart.couponCode

  guestCart.items = []
  delete guestCart.couponCode
  touchCart(userId)
  touchCart(guestKey)
}

export function addToCart(owner: string, nft: Nft, quantity: number) {
  const cart = ensureCart(owner)
  const current = cart.items.find((line) => line.nftId === nft.id)
  if (current) current.quantity += quantity
  else cart.items.push({ nftId: nft.id, quantity, quotedUnitPriceEth: nft.priceEth })
  touchCart(owner)
  return cart
}

function getLineIssues(quantity: number, nft: Nft | undefined, quotedUnitPriceEth: string | undefined): QuoteLineIssue[] {
  if (!nft || nft.available < 1) return ['esgotado']
  const issues: QuoteLineIssue[] = []
  if (quantity > nft.available) issues.push('disponibilidade-insuficiente')
  if (quotedUnitPriceEth && compareEth(quotedUnitPriceEth, nft.priceEth) !== 0) issues.push('preco-alterado')
  return issues
}

export function createQuote(owner: string): QuoteResponse {
  const cart = ensureCart(owner)
  const lines: QuoteLine[] = cart.items.map((line) => {
    const nft = getNft(line.nftId)
    const unitPriceEth = nft?.priceEth ?? '0'
    const issues = getLineIssues(line.quantity, nft, line.quotedUnitPriceEth)
    return {
      nftId: line.nftId,
      title: nft?.title ?? line.nftId,
      edition: nft?.edition ?? '-',
      imageUrl: nft?.hero ?? '',
      quantity: line.quantity,
      unitPriceEth,
      previousUnitPriceEth: issues.includes('preco-alterado') ? line.quotedUnitPriceEth : undefined,
      subtotalEth: multiplyEth(unitPriceEth, line.quantity),
      available: nft?.available ?? 0,
      issues,
    }
  })
  const subtotalEth = addEth('0', ...lines.map((line) => line.subtotalEth))
  const discountEth = getDiscountEth(cart.couponCode, subtotalEth)
  const networkFeeEth = lines.length ? '0.016' : '0.000'
  const totalEth = subtractEth(addEth(subtotalEth, networkFeeEth), discountEth)

  return {
    lines,
    subtotalEth,
    discountEth,
    networkFeeEth,
    totalEth,
    couponCode: cart.couponCode,
    quoteVersion: state.quoteVersion,
    expiresAt: new Date(Date.now() + 1000 * 60 * 5).toISOString(),
    stale: state.scenario.quoteChanged || lines.some((line) => line.issues.length > 0),
  }
}

// O usuario revisou as alteracoes: aceita os precos atuais e ajusta quantidades ao estoque.
export function reviewCart(owner: string) {
  const cart = ensureCart(owner)
  cart.items = cart.items.flatMap((line) => {
    const nft = getNft(line.nftId)
    if (!nft || nft.available < 1) return []
    return [{ ...line, quantity: Math.min(line.quantity, nft.available), quotedUnitPriceEth: nft.priceEth }]
  })
  state.scenario = { ...state.scenario, quoteChanged: false }
  touchCart(owner)
  return cart
}

type CreateOrderInput = {
  wallet: Wallet
  network: string
  provider: WalletProvider
  collector: CollectorDetails
}

// Cria o pedido como snapshot da cotacao atual. O pagamento comeca pendente e e liquidado
// depois de `paymentDelayMs` com o resultado do cenario (`paymentResult`).
export function createOrderFromQuote(userId: string, input: CreateOrderInput) {
  const quote = createQuote(userId)
  const orderId = `GM-${String(Object.keys(state.orders).length + 2049).padStart(4, '0')}`
  const createdAt = new Date().toISOString()
  const order: Order = {
    id: orderId,
    version: 1,
    status: 'pendente',
    transaction: `0x${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}...${orderId.slice(-4).toLowerCase()}`,
    explorerUrl: `https://explorer.kurio.mock/tx/${orderId}`,
    subtotalEth: quote.subtotalEth,
    discountEth: quote.discountEth,
    networkFeeEth: quote.networkFeeEth,
    totalEth: quote.totalEth,
    couponCode: quote.couponCode,
    quoteVersion: quote.quoteVersion,
    network: input.network,
    provider: input.provider,
    wallet: { id: input.wallet.id, label: input.wallet.label, address: input.wallet.address },
    collector: { ...input.collector },
    items: quote.lines.map((line) => ({
      nftId: line.nftId,
      title: line.title,
      edition: line.edition,
      imageUrl: line.imageUrl,
      quantity: line.quantity,
      unitPriceEth: line.unitPriceEth,
      subtotalEth: line.subtotalEth,
    })),
    createdAt,
    updatedAt: createdAt,
  }

  state.orders[orderId] = order
  state.orderMeta[orderId] = {
    userId,
    resolveAt: Date.now() + state.scenario.paymentDelayMs,
    finalStatus: state.scenario.paymentResult,
  }
  persistState()
  scheduleSettlement(orderId)
  return settleOrder(orderId)
}

// Liquida no prazo simulado e publica `order.updated`; a leitura REST tambem liquida (fallback).
function scheduleSettlement(orderId: string) {
  const meta = state.orderMeta[orderId]
  if (!meta || meta.finalStatus === 'pendente') return
  setTimeout(() => settleOrder(orderId), Math.max(0, meta.resolveAt - Date.now()))
}

// Apos reload da pagina os timers se perdem: reagenda os pedidos ainda pendentes.
export function resumePendingSettlements() {
  for (const [orderId, order] of Object.entries(state.orders)) {
    if (order.status === 'pendente') scheduleSettlement(orderId)
  }
}

// Liquida o pagamento pendente quando o prazo simulado vence. Somente pedidos confirmados
// consomem o carrinho (apenas itens/quantidades comprados) e o estoque das edicoes.
function settleOrder(orderId: string) {
  const order = state.orders[orderId]
  const meta = state.orderMeta[orderId]
  if (!order || !meta || order.status !== 'pendente') return order
  if (meta.finalStatus === 'pendente' || Date.now() < meta.resolveAt) return order

  order.status = meta.finalStatus
  order.updatedAt = new Date().toISOString()

  if (order.status === 'confirmado') {
    const cart = ensureCart(meta.userId)
    for (const purchased of order.items) {
      const current = cart.items.find((line) => line.nftId === purchased.nftId)
      if (current) current.quantity -= purchased.quantity
      const nft = getNft(purchased.nftId)
      if (nft) updateNft(nft.id, { available: Math.max(0, nft.available - purchased.quantity) })
    }
    cart.items = cart.items.filter((line) => line.quantity > 0)
    touchCart(meta.userId)
  }

  order.version = (order.version ?? 1) + 1
  persistState()
  emitChange({ kind: 'order', order, userId: meta.userId })
  return order
}

export function getOrderForUser(orderId: string, userId: string) {
  if (state.orderMeta[orderId]?.userId !== userId) return undefined
  return settleOrder(orderId)
}

export function findIdempotentOrder(idempotencyKey: string) {
  return state.idempotency[idempotencyKey]
}

export function rememberIdempotentOrder(idempotencyKey: string, record: IdempotencyRecord) {
  state.idempotency[idempotencyKey] = record
  persistState()
}

export function findUserWallet(userId: string, walletId: string) {
  return (state.wallets[userId] ?? []).find((wallet) => wallet.id === walletId)
}

// Garante exatamente uma carteira principal (estados persistidos antigos nao tinham `kind`).
export function listUserWallets(userId: string) {
  const wallets = (state.wallets[userId] ??= [])
  for (const wallet of wallets) wallet.kind ??= 'secundaria'
  if (wallets.length && !wallets.some((wallet) => wallet.kind === 'principal')) wallets[0].kind = 'principal'
  return wallets
}

export function setPrimaryWallet(userId: string, walletId: string) {
  for (const wallet of listUserWallets(userId)) {
    wallet.kind = wallet.id === walletId ? 'principal' : 'secundaria'
  }
}

// Nome e e-mail tambem vivem no usuario e nas sessoes ativas (exibidos no cabecalho).
export function syncUserIdentity(userId: string, identity: { name: string; email: string }) {
  const user = state.users.find((item) => item.id === userId)
  if (user) Object.assign(user, identity)
  for (const session of Object.values(state.sessions)) {
    if (session.user.id === userId) session.user = { ...session.user, ...identity }
  }
}

function readState(): MockState {
  if (typeof localStorage === 'undefined') return createInitialState()

  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return createInitialState()
    // Estados persistidos por versoes anteriores podem nao ter campos novos.
    const persisted = JSON.parse(raw) as Partial<MockState>
    return { ...createInitialState(), ...persisted, scenario: { ...defaultScenario, ...persisted.scenario } }
  } catch {
    return createInitialState()
  }
}

function getDiscountEth(couponCode: string | undefined, subtotalEth: string) {
  if (couponCode === 'KURIO10') return percentOfEth(subtotalEth, 10)
  return '0.000'
}
