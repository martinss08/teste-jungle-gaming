import type {
  CartResponse,
  MockScenario,
  Order,
  Profile,
  QuoteLine,
  QuoteResponse,
  SessionResponse,
} from '../contracts/api'
import { nfts, wallets as fixtureWallets } from '../data/nfts'
import type { CartLine, Wallet } from '../types'

type MockUser = {
  id: string
  name: string
  email: string
  passwordHash: string
}

type IdempotencyRecord = {
  fingerprint: string
  orderId: string
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
  quoteVersion: number
  scenario: MockScenario
}

const storageKey = 'kurio-msw-state-v1'
const guestCartKey = 'guest'

const defaultScenario: MockScenario = {
  latencyMs: 120,
  jitterMs: 180,
  failNext: false,
  forceSessionExpired: false,
  paymentResult: 'confirmado',
  quoteChanged: false,
  timeoutNextOrder: false,
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
      'user-julia': fixtureWallets,
      'user-caio': [
        {
          id: 'wallet-caio-main',
          label: 'Carteira principal',
          address: '0xA91F...E82C',
          network: 'Ethereum',
          status: 'conectada',
        },
      ],
    },
    favorites: {
      'user-julia': ['emerald-ape-042'],
      'user-caio': ['onyx-visual-232'],
    },
    carts: {
      [guestCartKey]: {
        items: [{ nftId: 'emerald-ape-042', quantity: 1 }],
        updatedAt: new Date().toISOString(),
      },
      'user-julia': {
        items: [
          { nftId: 'emerald-ape-042', quantity: 1 },
          { nftId: 'sage-hood-804', quantity: 1 },
        ],
        couponCode: 'KURIO10',
        updatedAt: new Date().toISOString(),
      },
      'user-caio': {
        items: [{ nftId: 'onyx-visual-232', quantity: 1 }],
        updatedAt: new Date().toISOString(),
      },
    },
    orders: {},
    idempotency: {},
    quoteVersion: 1,
    scenario: defaultScenario,
  }
}

let state = readState()

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
  if (state.scenario.forceSessionExpired) return null
  const header = request.headers.get('Authorization')
  const token = header?.replace(/^Bearer\s+/i, '')
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

export function getCartOwner(request: Request) {
  const session = resolveSession(request)
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

export function mergeGuestCartIntoUser(userId: string) {
  const guestCart = ensureCart(guestCartKey)
  const userCart = ensureCart(userId)
  for (const guestLine of guestCart.items) {
    const current = userCart.items.find((line) => line.nftId === guestLine.nftId)
    const nft = nfts.find((item) => item.id === guestLine.nftId)
    if (current) {
      current.quantity = Math.min(nft?.available ?? current.quantity, current.quantity + guestLine.quantity)
    } else {
      userCart.items.push({ ...guestLine })
    }
  }
  guestCart.items = []
  touchCart(userId)
  touchCart(guestCartKey)
}

export function createQuote(owner: string): QuoteResponse {
  const cart = ensureCart(owner)
  const lines: QuoteLine[] = cart.items.map((line) => {
    const nft = nfts.find((item) => item.id === line.nftId)
    const unitPriceEth = nft?.priceEth ?? '0'
    return {
      nftId: line.nftId,
      quantity: line.quantity,
      unitPriceEth,
      subtotalEth: multiplyEth(unitPriceEth, line.quantity),
      available: nft?.available ?? 0,
    }
  })
  const subtotalEth = lines.reduce((total, line) => addEth(total, line.subtotalEth), '0.000')
  const discountEth = getDiscountEth(cart.couponCode, subtotalEth)
  const networkFeeEth = lines.length ? '0.016' : '0.000'
  const totalEth = addEth(addEth(subtotalEth, networkFeeEth), `-${discountEth}`)

  return {
    lines,
    subtotalEth,
    discountEth,
    networkFeeEth,
    totalEth,
    couponCode: cart.couponCode,
    quoteVersion: state.quoteVersion,
    expiresAt: new Date(Date.now() + 1000 * 60 * 5).toISOString(),
    stale: state.scenario.quoteChanged,
  }
}

export function createOrderFromQuote(owner: string, orderInput: { walletId: string; network: string }) {
  const quote = createQuote(owner)
  const orderId = `GM-${String(Object.keys(state.orders).length + 2049).padStart(4, '0')}`
  const status = state.scenario.paymentResult
  const createdAt = new Date().toISOString()
  const order: Order = {
    id: orderId,
    status,
    transaction: `0x${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}...${orderId.slice(-4).toLowerCase()}`,
    explorerUrl: `https://explorer.kurio.mock/tx/${orderId}`,
    subtotalEth: quote.subtotalEth,
    discountEth: quote.discountEth,
    networkFeeEth: quote.networkFeeEth,
    totalEth: quote.totalEth,
    items: quote.lines.map((line) => {
      const nft = nfts.find((item) => item.id === line.nftId)
      return {
        nftId: line.nftId,
        title: nft?.title ?? line.nftId,
        quantity: line.quantity,
        unitPriceEth: line.unitPriceEth,
        subtotalEth: line.subtotalEth,
      }
    }),
    createdAt,
    updatedAt: createdAt,
  }

  if (status === 'confirmado') {
    const cart = ensureCart(owner)
    for (const purchased of order.items) {
      const current = cart.items.find((line) => line.nftId === purchased.nftId)
      if (!current) continue
      current.quantity -= purchased.quantity
      if (current.quantity <= 0) {
        cart.items = cart.items.filter((line) => line.nftId !== purchased.nftId)
      }
    }
    touchCart(owner)
  }

  void orderInput
  state.orders[orderId] = order
  persistState()
  return order
}

function readState(): MockState {
  if (typeof localStorage === 'undefined') return createInitialState()

  try {
    const raw = localStorage.getItem(storageKey)
    return raw ? (JSON.parse(raw) as MockState) : createInitialState()
  } catch {
    return createInitialState()
  }
}

function getDiscountEth(couponCode: string | undefined, subtotalEth: string) {
  if (!couponCode) return '0.000'
  if (couponCode === 'KURIO10') return divideEth(subtotalEth, 10)
  return '0.000'
}

function toMillis(value: string) {
  const negative = value.startsWith('-')
  const normalized = negative ? value.slice(1) : value
  const [whole, fraction = ''] = normalized.split('.')
  const millis = BigInt(whole || '0') * 1000n + BigInt(fraction.padEnd(3, '0').slice(0, 3) || '0')
  return negative ? -millis : millis
}

function fromMillis(value: bigint) {
  const negative = value < 0n
  const absolute = negative ? -value : value
  const whole = absolute / 1000n
  const fraction = String(absolute % 1000n).padStart(3, '0')
  return `${negative ? '-' : ''}${whole}.${fraction}`
}

function addEth(a: string, b: string) {
  return fromMillis(toMillis(a) + toMillis(b))
}

function multiplyEth(value: string, quantity: number) {
  return fromMillis(toMillis(value) * BigInt(quantity))
}

function divideEth(value: string, divisor: number) {
  return fromMillis(toMillis(value) / BigInt(divisor))
}
