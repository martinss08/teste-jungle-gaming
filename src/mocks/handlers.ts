import { delay, http, HttpResponse } from 'msw'
import type {
  AddCartItemRequest,
  ApiErrorCode,
  ApplyCouponRequest,
  ChangePasswordRequest,
  CreateOrderRequest,
  LoginRequest,
  MockNftChange,
  RegisterRequest,
  UpdateCartItemRequest,
  UpdateProfileRequest,
  WalletRequest,
} from '../contracts/api'
import { compareEth } from '../lib/eth'
import type { CartLine, Rarity, Wallet } from '../types'
import {
  addToCart,
  createOrderFromQuote,
  createQuote,
  createSession,
  ensureCart,
  getCartOwner,
  getNft,
  getState,
  hashPassword,
  listNfts,
  mergeGuestCartIntoUser,
  persistState,
  removeSession,
  resetState,
  resolveSession,
  reviewCart,
  setScenario,
  touchCart,
  updateNft,
} from './state'

export const handlers = [
  http.all('/api/*', async ({ request }) => {
    const state = getState()
    const wait = state.scenario.latencyMs + Math.floor(Math.random() * state.scenario.jitterMs)
    await delay(wait)

    if (state.scenario.failNext) {
      setScenario({ failNext: false })
      return apiError('TRANSIENT_FAILURE', 'Falha transitoria simulada.', 503)
    }

    if (request.headers.get('X-Mock-Network') === 'offline') {
      return apiError('NETWORK_UNAVAILABLE', 'Conexao indisponivel no cenario simulado.', 503)
    }

    return undefined
  }),

  http.get('/api/session', ({ request }) => {
    const session = resolveSession(request)
    if (!session) return apiError('UNAUTHORIZED', 'Sessao ausente ou expirada.', 401)
    return HttpResponse.json(session)
  }),

  http.post('/api/auth/register', async ({ request }) => {
    const body = await request.json() as RegisterRequest
    const fields = validateRegister(body)
    if (Object.keys(fields).length) {
      return apiError('VALIDATION_ERROR', 'Verifique os campos informados.', 422, fields)
    }

    const state = getState()
    const email = body.email.trim().toLowerCase()
    if (state.users.some((user) => user.email === email)) {
      return apiError('CONFLICT', 'Ja existe uma conta com este e-mail.', 409, {
        email: 'E-mail ja cadastrado.',
      })
    }

    const user = {
      id: `user-${crypto.randomUUID()}`,
      name: body.name.trim(),
      email,
      passwordHash: hashPassword(body.password),
    }
    state.users.push(user)
    state.profiles[user.id] = {
      userId: user.id,
      name: user.name,
      email: user.email,
      username: user.name.toLowerCase().replace(/\s+/g, '.'),
      bio: '',
      avatarUrl: `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(user.name)}`,
    }
    state.wallets[user.id] = []
    state.favorites[user.id] = []
    state.carts[user.id] = {
      items: [],
      updatedAt: new Date().toISOString(),
    }

    mergeGuestCartIntoUser(user.id, request.headers.get('X-Guest-Id'))
    const session = createSession(user.id)
    persistState()
    return HttpResponse.json(session, { status: 201 })
  }),

  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as LoginRequest
    const email = body.email.trim().toLowerCase()
    const state = getState()
    const user = state.users.find((item) => item.email === email)
    if (!user || user.passwordHash !== hashPassword(body.password)) {
      return apiError('UNAUTHORIZED', 'E-mail ou senha invalidos.', 401)
    }

    mergeGuestCartIntoUser(user.id, request.headers.get('X-Guest-Id'))
    return HttpResponse.json(createSession(user.id))
  }),

  http.post('/api/auth/logout', ({ request }) => {
    const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
    if (token) removeSession(token)
    return HttpResponse.json({ ok: true })
  }),

  http.post('/api/auth/expire', ({ request }) => {
    const session = resolveSession(request)
    if (!session) return apiError('UNAUTHORIZED', 'Sessao ausente ou expirada.', 401)
    session.expiresAt = new Date(Date.now() - 1000).toISOString()
    persistState()
    return HttpResponse.json({ ok: true })
  }),

  http.get('/api/nfts', ({ request }) => {
    const url = new URL(request.url)
    const q = url.searchParams.get('q')?.trim().toLowerCase() ?? ''
    const rarity = url.searchParams.get('rarity') as Rarity | 'todos' | null
    const collection = url.searchParams.get('collection')
    const network = url.searchParams.get('network')
    const sort = url.searchParams.get('sort') ?? 'recentes'
    const page = positiveNumber(url.searchParams.get('page'), 1)
    const pageSize = positiveNumber(url.searchParams.get('pageSize'), 6)

    let items = listNfts().filter((nft) => {
      const matchesQuery =
        !q ||
        nft.title.toLowerCase().includes(q) ||
        nft.creator.toLowerCase().includes(q) ||
        nft.collection.toLowerCase().includes(q)
      const matchesRarity = !rarity || rarity === 'todos' || nft.rarity === rarity
      const matchesCollection = !collection || nft.collection === collection
      const matchesNetwork = !network || nft.network === network
      return matchesQuery && matchesRarity && matchesCollection && matchesNetwork
    })

    items = [...items].sort((a, b) => {
      if (sort === 'preco-menor') return compareEth(a.priceEth, b.priceEth)
      if (sort === 'preco-maior') return compareEth(b.priceEth, a.priceEth)
      return a.title.localeCompare(b.title)
    })

    const totalItems = items.length
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
    const start = (page - 1) * pageSize

    return HttpResponse.json({
      items: items.slice(start, start + pageSize),
      page,
      pageSize,
      totalItems,
      totalPages,
    })
  }),

  http.get('/api/nfts/:nftId', ({ params }) => {
    const nft = getNft(String(params.nftId))
    if (!nft) return apiError('NOT_FOUND', 'NFT nao encontrado.', 404)
    return HttpResponse.json(nft)
  }),

  http.get('/api/favorites', ({ request }) => {
    const session = resolveSession(request)
    if (!session) return apiError('UNAUTHORIZED', 'Favoritos exigem autenticacao.', 401)
    const state = getState()
    return HttpResponse.json({ nftIds: state.favorites[session.user.id] ?? [] })
  }),

  http.post('/api/favorites/:nftId', ({ request, params }) => {
    const session = resolveSession(request)
    if (!session) return apiError('UNAUTHORIZED', 'Favoritos exigem autenticacao.', 401)
    const nftId = String(params.nftId)
    if (!getNft(nftId)) return apiError('NOT_FOUND', 'NFT nao encontrado.', 404)

    const state = getState()
    state.favorites[session.user.id] ??= []
    if (!state.favorites[session.user.id].includes(nftId)) {
      state.favorites[session.user.id].push(nftId)
    }
    persistState()
    return HttpResponse.json({ nftIds: state.favorites[session.user.id] })
  }),

  http.delete('/api/favorites/:nftId', ({ request, params }) => {
    const session = resolveSession(request)
    if (!session) return apiError('UNAUTHORIZED', 'Favoritos exigem autenticacao.', 401)
    const state = getState()
    state.favorites[session.user.id] = (state.favorites[session.user.id] ?? []).filter((id) => id !== params.nftId)
    persistState()
    return HttpResponse.json({ nftIds: state.favorites[session.user.id] })
  }),

  http.get('/api/cart', ({ request }) => {
    const owner = getCartOwner(request)
    return HttpResponse.json(ensureCart(owner))
  }),

  http.post('/api/cart/items', async ({ request }) => {
    const body = await request.json() as AddCartItemRequest
    const owner = getCartOwner(request)
    const nft = getNft(body.nftId)
    if (!nft) return apiError('NOT_FOUND', 'NFT nao encontrado.', 404)
    if (!Number.isInteger(body.quantity) || body.quantity < 1) {
      return apiError('VALIDATION_ERROR', 'Quantidade invalida.', 422, { quantity: 'Informe uma quantidade inteira positiva.' })
    }
    if (nft.available < 1) return apiError('CONFLICT', 'Edicao esgotada.', 409)

    const current = ensureCart(owner).items.find((line) => line.nftId === body.nftId)
    const inCart = current?.quantity ?? 0
    if (inCart + body.quantity > nft.available) {
      return apiError('CONFLICT', availabilityMessage(nft.available, inCart), 409)
    }
    return HttpResponse.json(addToCart(owner, nft, body.quantity), { status: 201 })
  }),

  http.patch('/api/cart/items/:nftId', async ({ request, params }) => {
    const body = await request.json() as UpdateCartItemRequest
    const owner = getCartOwner(request)
    const nftId = String(params.nftId)
    const nft = getNft(nftId)
    if (!nft) return apiError('NOT_FOUND', 'NFT nao encontrado.', 404)
    if (!Number.isInteger(body.quantity) || body.quantity < 1) {
      return apiError('VALIDATION_ERROR', 'Quantidade invalida.', 422, { quantity: 'Informe uma quantidade inteira positiva.' })
    }
    if (body.quantity > nft.available) return apiError('CONFLICT', availabilityMessage(nft.available, 0), 409)

    const cart = ensureCart(owner)
    const current = cart.items.find((line) => line.nftId === nftId)
    if (!current) return apiError('NOT_FOUND', 'Item nao encontrado no carrinho.', 404)
    current.quantity = body.quantity
    touchCart(owner)
    return HttpResponse.json(cart)
  }),

  http.delete('/api/cart/items/:nftId', ({ request, params }) => {
    const owner = getCartOwner(request)
    const cart = ensureCart(owner)
    cart.items = cart.items.filter((line: CartLine) => line.nftId !== params.nftId)
    touchCart(owner)
    return HttpResponse.json(cart)
  }),

  http.post('/api/cart/coupon', async ({ request }) => {
    const body = await request.json() as ApplyCouponRequest
    const code = body.code.trim().toUpperCase()
    if (code === 'EXPIRADO') return apiError('CONFLICT', 'Cupom expirado.', 409)
    if (code !== 'KURIO10') return apiError('VALIDATION_ERROR', 'Cupom invalido.', 422, { code: 'Codigo promocional invalido.' })

    const owner = getCartOwner(request)
    const cart = ensureCart(owner)
    cart.couponCode = code
    touchCart(owner)
    return HttpResponse.json(cart)
  }),

  http.delete('/api/cart/coupon', ({ request }) => {
    const owner = getCartOwner(request)
    const cart = ensureCart(owner)
    delete cart.couponCode
    touchCart(owner)
    return HttpResponse.json(cart)
  }),

  http.post('/api/cart/review', ({ request }) => {
    return HttpResponse.json(reviewCart(getCartOwner(request)))
  }),

  http.get('/api/quote', ({ request }) => {
    return HttpResponse.json(createQuote(getCartOwner(request)))
  }),

  http.post('/api/orders', async ({ request }) => {
    const session = resolveSession(request)
    if (!session) return apiError('UNAUTHORIZED', 'Checkout exige autenticacao.', 401)

    const body = await request.json() as CreateOrderRequest
    if (!body.idempotencyKey) {
      return apiError('VALIDATION_ERROR', 'Chave de idempotencia obrigatoria.', 422, { idempotencyKey: 'Campo obrigatorio.' })
    }

    const state = getState()
    const fingerprint = JSON.stringify({ ...body, idempotencyKey: undefined })
    const previous = state.idempotency[body.idempotencyKey]
    if (previous) {
      if (previous.fingerprint !== fingerprint) {
        return apiError('IDEMPOTENCY_CONFLICT', 'Chave reutilizada com conteudo diferente.', 409)
      }
      return HttpResponse.json(state.orders[previous.orderId])
    }

    const quote = createQuote(session.user.id)
    if (body.quoteVersion !== quote.quoteVersion || quote.stale) {
      return apiError('CONFLICT', 'Cotacao desatualizada. Revise os valores antes de confirmar.', 409)
    }

    const order = createOrderFromQuote(session.user.id, body)
    state.idempotency[body.idempotencyKey] = {
      fingerprint,
      orderId: order.id,
    }
    persistState()

    if (state.scenario.timeoutNextOrder) {
      setScenario({ timeoutNextOrder: false })
      return apiError('TRANSIENT_FAILURE', 'Timeout simulado apos criacao do pedido. Reenvie com a mesma chave para recuperar.', 504)
    }

    return HttpResponse.json(order, { status: 201 })
  }),

  http.get('/api/orders/:orderId', ({ request, params }) => {
    const session = resolveSession(request)
    if (!session) return apiError('UNAUTHORIZED', 'Pedidos exigem autenticacao.', 401)
    const order = getState().orders[String(params.orderId)]
    if (!order) return apiError('NOT_FOUND', 'Pedido nao encontrado.', 404)
    return HttpResponse.json(order)
  }),

  http.get('/api/profile', ({ request }) => {
    const session = resolveSession(request)
    if (!session) return apiError('UNAUTHORIZED', 'Perfil exige autenticacao.', 401)
    return HttpResponse.json(getState().profiles[session.user.id])
  }),

  http.patch('/api/profile', async ({ request }) => {
    const session = resolveSession(request)
    if (!session) return apiError('UNAUTHORIZED', 'Perfil exige autenticacao.', 401)
    const body = await request.json() as UpdateProfileRequest
    const fields: Record<string, string> = {}
    if (body.email !== undefined && !body.email.includes('@')) fields.email = 'Informe um e-mail valido.'
    if (body.name !== undefined && body.name.trim().length < 2) fields.name = 'Informe pelo menos 2 caracteres.'
    if (Object.keys(fields).length) return apiError('VALIDATION_ERROR', 'Verifique os campos informados.', 422, fields)

    const state = getState()
    state.profiles[session.user.id] = { ...state.profiles[session.user.id], ...body }
    persistState()
    return HttpResponse.json(state.profiles[session.user.id])
  }),

  http.post('/api/profile/password', async ({ request }) => {
    const session = resolveSession(request)
    if (!session) return apiError('UNAUTHORIZED', 'Perfil exige autenticacao.', 401)
    const body = await request.json() as ChangePasswordRequest
    const state = getState()
    const user = state.users.find((item) => item.id === session.user.id)
    if (!user || user.passwordHash !== hashPassword(body.currentPassword)) {
      return apiError('VALIDATION_ERROR', 'Senha atual invalida.', 422, { currentPassword: 'Senha atual incorreta.' })
    }
    if (body.newPassword.length < 6) {
      return apiError('VALIDATION_ERROR', 'Senha fraca.', 422, { newPassword: 'Informe pelo menos 6 caracteres.' })
    }
    user.passwordHash = hashPassword(body.newPassword)
    persistState()
    return HttpResponse.json({ ok: true })
  }),

  http.get('/api/wallets', ({ request }) => {
    const session = resolveSession(request)
    if (!session) return apiError('UNAUTHORIZED', 'Carteiras exigem autenticacao.', 401)
    return HttpResponse.json({ items: getState().wallets[session.user.id] ?? [] })
  }),

  http.post('/api/wallets', async ({ request }) => {
    const session = resolveSession(request)
    if (!session) return apiError('UNAUTHORIZED', 'Carteiras exigem autenticacao.', 401)
    const body = await request.json() as WalletRequest
    const validation = validateWallet(body)
    if (Object.keys(validation).length) return apiError('VALIDATION_ERROR', 'Verifique os campos da carteira.', 422, validation)

    const wallet: Wallet = {
      id: `wallet-${crypto.randomUUID()}`,
      label: body.label,
      address: body.address,
      network: body.network,
      status: 'conectada',
    }
    const state = getState()
    state.wallets[session.user.id] ??= []
    state.wallets[session.user.id].push(wallet)
    persistState()
    return HttpResponse.json(wallet, { status: 201 })
  }),

  http.patch('/api/wallets/:walletId', async ({ request, params }) => {
    const session = resolveSession(request)
    if (!session) return apiError('UNAUTHORIZED', 'Carteiras exigem autenticacao.', 401)
    const body = await request.json() as Partial<WalletRequest>
    const state = getState()
    const wallets = state.wallets[session.user.id] ?? []
    const wallet = wallets.find((item) => item.id === params.walletId)
    if (!wallet) return apiError('NOT_FOUND', 'Carteira nao encontrada.', 404)
    Object.assign(wallet, body)
    persistState()
    return HttpResponse.json(wallet)
  }),

  http.post('/api/mock/reset', () => {
    resetState()
    return HttpResponse.json({ ok: true })
  }),

  http.get('/api/mock/scenario', () => {
    return HttpResponse.json(getState().scenario)
  }),

  http.patch('/api/mock/scenario', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json(setScenario(body))
  }),

  // Simula alteracao de preco/disponibilidade de um NFT (base para nft.updated na Fase 7).
  http.patch('/api/mock/nfts/:nftId', async ({ request, params }) => {
    const body = await request.json() as MockNftChange
    const nft = updateNft(String(params.nftId), body)
    if (!nft) return apiError('NOT_FOUND', 'NFT nao encontrado.', 404)
    return HttpResponse.json(nft)
  }),
]

function availabilityMessage(available: number, inCart: number) {
  if (available < 1) return 'Edicao esgotada.'
  if (inCart >= available) return `Voce ja tem todas as ${available} edicoes disponiveis no carrinho.`
  return `Apenas ${available} edicoes disponiveis${inCart ? ` (${inCart} ja no carrinho)` : ''}.`
}

function apiError(code: ApiErrorCode, message: string, status: number, fields?: Record<string, string>) {
  return HttpResponse.json({ error: { code, message, fields } }, { status })
}

function validateRegister(body: RegisterRequest) {
  const fields: Record<string, string> = {}
  if (!body.name || body.name.trim().length < 2) fields.name = 'Informe pelo menos 2 caracteres.'
  if (!body.email || !body.email.includes('@')) fields.email = 'Informe um e-mail valido.'
  if (!body.password || body.password.length < 6) fields.password = 'Informe pelo menos 6 caracteres.'
  return fields
}

function validateWallet(body: WalletRequest) {
  const fields: Record<string, string> = {}
  if (!body.label || body.label.trim().length < 2) fields.label = 'Informe um nome para a carteira.'
  if (!body.address || !/^0x/i.test(body.address)) fields.address = 'Informe um endereco 0x.'
  if (!body.network) fields.network = 'Selecione uma rede.'
  return fields
}

function positiveNumber(value: string | null, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}
