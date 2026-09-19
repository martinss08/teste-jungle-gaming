import { delay, http, HttpResponse } from 'msw'
import type {
  AddCartItemRequest,
  ApiErrorCode,
  ApplyCouponRequest,
  ChangePasswordRequest,
  ConnectWalletRequest,
  CreateOrderRequest,
  LoginRequest,
  MockNftChange,
  MockScenario,
  RegisterRequest,
  UpdateAvatarRequest,
  UpdateCartItemRequest,
  UpdateProfileRequest,
  CatalogFacetsResponse,
  FavoriteResponse,
  NftFacet,
  NftReviewsResponse,
  WalletConnection,
  WalletListResponse,
  WalletRequest,
} from '../contracts/api'
import { SUPPORTED_NETWORKS } from '../contracts/api'
import { buildNftReviews } from '../data/reviews'
import { compareEth } from '../lib/eth'
import type { CartLine, Nft, NftTag, Rarity, Wallet } from '../types'
import {
  addToCart,
  createOrderFromQuote,
  createQuote,
  createSession,
  ensureCart,
  findIdempotentOrder,
  findUserWallet,
  getCartOwner,
  getNft,
  getOrderForUser,
  getState,
  hashPassword,
  listNfts,
  listUserWallets,
  mergeGuestCartIntoUser,
  persistState,
  rememberIdempotentOrder,
  removeSession,
  resetState,
  resolveSession,
  reviewCart,
  setPrimaryWallet,
  setScenario,
  syncUserIdentity,
  touchCart,
  updateNft,
} from './state'
import { dropConnections, realtimeHandler, replayLastEvent, replayStaleEvent } from './realtime'

// Jitter pseudoaleatorio mas reproduzivel: a sequencia de latencias se repete a cada reset da pagina.
let requestSequence = 0
function nextJitter(jitterMs: number) {
  requestSequence += 1
  return jitterMs ? (requestSequence * 7919) % jitterMs : 0
}

export const handlers = [
  http.all('/api/*', async ({ request }) => {
    const url = new URL(request.url)
    // Os controles do mock nunca sofrem as falhas simuladas, para que o cenario possa ser desfeito.
    if (url.pathname.startsWith('/api/mock/')) return undefined

    const { scenario } = getState()
    if (scenario.offline) return HttpResponse.error()

    let wait = scenario.latencyMs + nextJitter(scenario.jitterMs)
    if (scenario.slowNextListMs > 0 && request.method === 'GET' && url.pathname === '/api/nfts') {
      wait += scenario.slowNextListMs
      setScenario({ slowNextListMs: 0 })
    }
    await delay(wait)

    if (scenario.failNext || (scenario.failNextCount ?? 0) > 0) {
      setScenario({
        failNext: false,
        failNextCount: Math.max(0, (scenario.failNextCount ?? 0) - 1),
      })
      return apiError('TRANSIENT_FAILURE', 'Falha transitoria simulada.', 503)
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
    const category = url.searchParams.get('category')
    const network = url.searchParams.get('network')
    const minPrice = cleanPriceParam(url.searchParams.get('minPrice'))
    const maxPrice = cleanPriceParam(url.searchParams.get('maxPrice'))
    const tag = url.searchParams.get('tag') as NftTag | null
    const featured = url.searchParams.get('featured') === 'true'
    const sort = url.searchParams.get('sort') ?? 'recentes'
    const page = positiveNumber(url.searchParams.get('page'), 1)
    const pageSize = positiveNumber(url.searchParams.get('pageSize'), 6)

    let items = listNfts().filter((nft) => {
      const matchesQuery =
        !q ||
        nft.title.toLowerCase().includes(q) ||
        nft.creator.toLowerCase().includes(q) ||
        nft.collection.toLowerCase().includes(q) ||
        nft.category.toLowerCase().includes(q)
      const matchesRarity = !rarity || rarity === 'todos' || nft.rarity === rarity
      const matchesCollection = !collection || nft.collection === collection
      const matchesCategory = !category || category === 'todos' || nft.category === category
      const matchesNetwork = !network || nft.network === network
      const matchesMinPrice = !minPrice || compareEth(nft.priceEth, minPrice) >= 0
      const matchesMaxPrice = !maxPrice || compareEth(nft.priceEth, maxPrice) <= 0
      const matchesTag = !tag || Boolean(nft.tags?.includes(tag))
      const matchesFeatured = !featured || Boolean(nft.featured)
      return matchesQuery && matchesRarity && matchesCollection && matchesCategory && matchesNetwork && matchesMinPrice && matchesMaxPrice && matchesTag && matchesFeatured
    })

    items = [...items].sort((a, b) => {
      if (sort === 'preco-menor') return compareEth(a.priceEth, b.priceEth)
      if (sort === 'preco-maior') return compareEth(b.priceEth, a.priceEth)
      return b.listedAt.localeCompare(a.listedAt)
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

  http.get('/api/nfts/facets', () => {
    const items = listNfts()
    const prices = items.map((nft) => nft.priceEth).sort(compareEth)
    const response: CatalogFacetsResponse = {
      total: items.length,
      categories: countBy(items, (nft) => nft.category),
      rarities: countBy(items, (nft) => nft.rarity),
      networks: countBy(items, (nft) => nft.network),
      priceRange: { minEth: prices[0] ?? '0', maxEth: prices.at(-1) ?? '0' },
    }
    return HttpResponse.json(response)
  }),

  http.get('/api/nfts/:nftId/reviews', ({ params }) => {
    const nftId = String(params.nftId)
    if (!getNft(nftId)) return apiError('NOT_FOUND', 'NFT nao encontrado.', 404)
    const items = buildNftReviews(nftId)
    const response: NftReviewsResponse = {
      items,
      total: items.length,
      averageRating: Math.round((items.reduce((sum, review) => sum + review.rating, 0) / items.length) * 10) / 10,
    }
    return HttpResponse.json(response)
  }),

  http.get('/api/nfts/:nftId', ({ params }) => {
    const nft = getNft(String(params.nftId))
    if (!nft) return apiError('NOT_FOUND', 'NFT nao encontrado.', 404)
    return HttpResponse.json(nft)
  }),

  http.get('/api/favorites', ({ request }) => {
    const session = resolveSession(request)
    if (!session) return apiError('UNAUTHORIZED', 'Favoritos exigem autenticacao.', 401)
    return HttpResponse.json(favoritesResponse(session.user.id))
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
    return HttpResponse.json(favoritesResponse(session.user.id))
  }),

  http.delete('/api/favorites/:nftId', ({ request, params }) => {
    const session = resolveSession(request)
    if (!session) return apiError('UNAUTHORIZED', 'Favoritos exigem autenticacao.', 401)
    const state = getState()
    state.favorites[session.user.id] = (state.favorites[session.user.id] ?? []).filter((id) => id !== params.nftId)
    persistState()
    return HttpResponse.json(favoritesResponse(session.user.id))
  }),

  http.get('/api/cart', ({ request }) => {
    const owner = getCartOwner(request)
    if (!owner) return expiredSession()
    return HttpResponse.json(ensureCart(owner))
  }),

  http.post('/api/cart/items', async ({ request }) => {
    const body = await request.json() as AddCartItemRequest
    const owner = getCartOwner(request)
    if (!owner) return expiredSession()
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
    if (!owner) return expiredSession()
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
    if (!owner) return expiredSession()
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
    if (!owner) return expiredSession()
    const cart = ensureCart(owner)
    cart.couponCode = code
    touchCart(owner)
    return HttpResponse.json(cart)
  }),

  http.delete('/api/cart/coupon', ({ request }) => {
    const owner = getCartOwner(request)
    if (!owner) return expiredSession()
    const cart = ensureCart(owner)
    delete cart.couponCode
    touchCart(owner)
    return HttpResponse.json(cart)
  }),

  http.post('/api/cart/review', ({ request }) => {
    const owner = getCartOwner(request)
    if (!owner) return expiredSession()
    return HttpResponse.json(reviewCart(owner))
  }),

  http.get('/api/quote', ({ request }) => {
    const owner = getCartOwner(request)
    if (!owner) return expiredSession()
    return HttpResponse.json(createQuote(owner))
  }),

  http.post('/api/orders', async ({ request }) => {
    const session = resolveSession(request)
    if (!session) return apiError('UNAUTHORIZED', 'Checkout exige autenticacao.', 401)

    const body = await request.json() as CreateOrderRequest
    if (!body.idempotencyKey) {
      return apiError('VALIDATION_ERROR', 'Chave de idempotencia obrigatoria.', 422, { idempotencyKey: 'Campo obrigatorio.' })
    }

    // Idempotencia vem antes de qualquer revalidacao: reenvio da mesma tentativa devolve o mesmo pedido.
    const fingerprint = JSON.stringify({ ...body, idempotencyKey: undefined })
    const previous = findIdempotentOrder(body.idempotencyKey)
    if (previous) {
      if (previous.userId !== session.user.id || previous.fingerprint !== fingerprint) {
        return apiError('IDEMPOTENCY_CONFLICT', 'Chave reutilizada com conteudo diferente.', 409)
      }
      return HttpResponse.json(getOrderForUser(previous.orderId, session.user.id))
    }

    const fields = validateCollector(body)
    const wallet = findUserWallet(session.user.id, body.walletId)
    if (!wallet) fields.walletId = 'Selecione uma carteira cadastrada.'
    else if (wallet.network !== body.network) fields.network = `A carteira ${wallet.label} opera na rede ${wallet.network}.`
    if (Object.keys(fields).length) return apiError('VALIDATION_ERROR', 'Verifique os dados do pagamento.', 422, fields)

    const quote = createQuote(session.user.id)
    if (!quote.lines.length) return apiError('VALIDATION_ERROR', 'Carrinho vazio.', 422)
    if (quote.stale || body.quoteVersion !== quote.quoteVersion || compareEth(body.expectedTotalEth, quote.totalEth) !== 0) {
      return apiError('QUOTE_CHANGED', 'A cotacao mudou. Revise os valores antes de confirmar.', 409)
    }

    const order = createOrderFromQuote(session.user.id, {
      wallet: wallet!,
      network: body.network,
      provider: body.provider,
      collector: body.collector,
    })
    rememberIdempotentOrder(body.idempotencyKey, { userId: session.user.id, fingerprint, orderId: order.id })

    if (getState().scenario.timeoutNextOrder) {
      setScenario({ timeoutNextOrder: false })
      return apiError('TRANSIENT_FAILURE', 'Timeout simulado apos criacao do pedido. Reenvie com a mesma chave para recuperar.', 504)
    }

    return HttpResponse.json(order, { status: 201 })
  }),

  http.get('/api/orders/:orderId', ({ request, params }) => {
    const session = resolveSession(request)
    if (!session) return apiError('UNAUTHORIZED', 'Pedidos exigem autenticacao.', 401)
    const orderId = String(params.orderId)
    if (!getState().orders[orderId]) return apiError('NOT_FOUND', 'Pedido nao encontrado.', 404)
    const order = getOrderForUser(orderId, session.user.id)
    if (!order) return apiError('FORBIDDEN', 'Este pedido pertence a outra conta.', 403)
    return HttpResponse.json(order)
  }),

  // Conexao simulada: nao ha extensao real; o cenario decide se o usuario aprova ou recusa.
  http.post('/api/wallets/connect', async ({ request }) => {
    const session = resolveSession(request)
    if (!session) return apiError('UNAUTHORIZED', 'Carteiras exigem autenticacao.', 401)
    const body = await request.json() as ConnectWalletRequest
    const wallet = findUserWallet(session.user.id, body.walletId)
    if (!wallet) return apiError('NOT_FOUND', 'Carteira nao encontrada.', 404)
    if (wallet.status !== 'conectada') {
      return apiError('VALIDATION_ERROR', 'Carteira pendente de verificacao.', 422, { walletId: 'Verifique esta carteira antes de usa-la.' })
    }
    if (wallet.network !== body.network) {
      return apiError('VALIDATION_ERROR', 'Rede incompativel com a carteira.', 422, { network: `A carteira ${wallet.label} opera na rede ${wallet.network}.` })
    }
    if (getState().scenario.walletConnection === 'recusar') {
      return apiError('WALLET_REJECTED', 'Conexao recusada na carteira.', 403)
    }

    const connection: WalletConnection = {
      connectionId: `conn-${crypto.randomUUID()}`,
      walletId: wallet.id,
      address: wallet.address,
      network: wallet.network,
      provider: body.provider,
      connectedAt: new Date().toISOString(),
    }
    return HttpResponse.json(connection)
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
    const state = getState()
    const current = state.profiles[session.user.id]
    const next = {
      ...current,
      name: body.name?.trim() ?? current.name,
      email: body.email?.trim().toLowerCase() ?? current.email,
      username: body.username?.trim() ?? current.username,
      bio: body.bio?.trim() ?? current.bio,
    }

    const fields = validateProfile(next)
    if (!fields.email && state.users.some((user) => user.id !== session.user.id && user.email === next.email)) {
      fields.email = 'E-mail ja cadastrado por outra conta.'
    }
    if (!fields.username && Object.values(state.profiles).some((profile) => profile.userId !== session.user.id && profile.username === next.username)) {
      fields.username = 'Nome de usuario indisponivel.'
    }
    if (Object.keys(fields).length) {
      const conflict = Object.values(fields).some((message) => message.includes('cadastrado') || message.includes('indisponivel'))
      return apiError(conflict ? 'CONFLICT' : 'VALIDATION_ERROR', 'Verifique os campos informados.', conflict ? 409 : 422, fields)
    }

    state.profiles[session.user.id] = next
    syncUserIdentity(session.user.id, { name: next.name, email: next.email })
    persistState()
    return HttpResponse.json(next)
  }),

  http.post('/api/profile/avatar', async ({ request }) => {
    const session = resolveSession(request)
    if (!session) return apiError('UNAUTHORIZED', 'Perfil exige autenticacao.', 401)
    const body = await request.json() as UpdateAvatarRequest
    const match = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.exec(body.dataUrl ?? '')
    if (!match) return apiError('VALIDATION_ERROR', 'Formato de imagem invalido.', 422, { avatar: 'Envie uma imagem PNG, JPEG ou WebP.' })
    if (body.dataUrl.length > maxAvatarDataUrlLength) {
      return apiError('VALIDATION_ERROR', 'Imagem muito grande.', 422, { avatar: 'A imagem processada deve ter ate 150 KB.' })
    }

    const state = getState()
    state.profiles[session.user.id] = { ...state.profiles[session.user.id], avatarUrl: body.dataUrl }
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
    if (!body.newPassword || body.newPassword.length < 6) {
      return apiError('VALIDATION_ERROR', 'Senha fraca.', 422, { newPassword: 'Informe pelo menos 6 caracteres.' })
    }
    if (body.newPassword === body.currentPassword) {
      return apiError('VALIDATION_ERROR', 'Senha repetida.', 422, { newPassword: 'A nova senha deve ser diferente da atual.' })
    }
    user.passwordHash = hashPassword(body.newPassword)
    persistState()
    return HttpResponse.json({ ok: true })
  }),

  http.get('/api/wallets', ({ request }) => {
    const session = resolveSession(request)
    if (!session) return apiError('UNAUTHORIZED', 'Carteiras exigem autenticacao.', 401)
    const response: WalletListResponse = { items: listUserWallets(session.user.id) }
    return HttpResponse.json(response)
  }),

  http.post('/api/wallets', async ({ request }) => {
    const session = resolveSession(request)
    if (!session) return apiError('UNAUTHORIZED', 'Carteiras exigem autenticacao.', 401)
    const body = await request.json() as WalletRequest
    const wallets = listUserWallets(session.user.id)
    const validation = validateWallet(body, wallets)
    if (Object.keys(validation).length) return walletValidationError(validation)

    const wallet: Wallet = {
      id: `wallet-${crypto.randomUUID()}`,
      label: body.label.trim(),
      address: body.address.trim(),
      network: body.network,
      status: 'conectada',
      // A primeira carteira do usuario e sempre a principal.
      kind: wallets.length ? body.kind : 'principal',
    }
    wallets.push(wallet)
    if (wallet.kind === 'principal') setPrimaryWallet(session.user.id, wallet.id)
    persistState()
    return HttpResponse.json(wallet, { status: 201 })
  }),

  http.patch('/api/wallets/:walletId', async ({ request, params }) => {
    const session = resolveSession(request)
    if (!session) return apiError('UNAUTHORIZED', 'Carteiras exigem autenticacao.', 401)
    const body = await request.json() as Partial<WalletRequest>
    const wallets = listUserWallets(session.user.id)
    const wallet = wallets.find((item) => item.id === params.walletId)
    if (!wallet) return apiError('NOT_FOUND', 'Carteira nao encontrada.', 404)

    const next: WalletRequest = {
      label: body.label?.trim() ?? wallet.label,
      address: body.address?.trim() ?? wallet.address,
      network: body.network ?? wallet.network,
      kind: body.kind ?? wallet.kind,
    }
    if (wallet.kind === 'principal' && next.kind === 'secundaria') {
      return apiError('VALIDATION_ERROR', 'Defina outra carteira como principal primeiro.', 422, {
        kind: 'Deve existir uma carteira principal. Promova outra carteira para trocar.',
      })
    }
    const validation = validateWallet(next, wallets.filter((item) => item.id !== wallet.id))
    if (Object.keys(validation).length) return walletValidationError(validation)

    Object.assign(wallet, next)
    if (next.kind === 'principal') setPrimaryWallet(session.user.id, wallet.id)
    persistState()
    return HttpResponse.json(wallet)
  }),

  http.post('/api/mock/reset', () => {
    resetState()
    requestSequence = 0
    return HttpResponse.json({ ok: true })
  }),

  http.get('/api/mock/scenario', () => {
    return HttpResponse.json(getState().scenario)
  }),

  http.patch('/api/mock/scenario', async ({ request }) => {
    const body = await request.json() as Partial<MockScenario>
    const scenario = setScenario(body)
    if (scenario.offline) dropConnections()
    return HttpResponse.json(scenario)
  }),

  // Simula alteracao de preco/disponibilidade de um NFT (base para nft.updated na Fase 7).
  http.patch('/api/mock/nfts/:nftId', async ({ request, params }) => {
    const body = await request.json() as MockNftChange
    const nft = updateNft(String(params.nftId), body)
    if (!nft) return apiError('NOT_FOUND', 'NFT nao encontrado.', 404)
    return HttpResponse.json(nft)
  }),

  // Controles do tempo real: duplicata, evento antigo e queda de conexao.
  http.post('/api/mock/realtime/replay-last', () => {
    const event = replayLastEvent()
    return event ? HttpResponse.json(event) : apiError('NOT_FOUND', 'Nenhum evento publicado ainda.', 404)
  }),

  http.post('/api/mock/realtime/replay-stale', () => {
    const event = replayStaleEvent()
    return event ? HttpResponse.json(event) : apiError('NOT_FOUND', 'Nenhum evento anterior para este recurso.', 404)
  }),

  http.post('/api/mock/realtime/disconnect', () => {
    return HttpResponse.json({ dropped: dropConnections() })
  }),

  realtimeHandler,
]

function availabilityMessage(available: number, inCart: number) {
  if (available < 1) return 'Edicao esgotada.'
  if (inCart >= available) return `Voce ja tem todas as ${available} edicoes disponiveis no carrinho.`
  return `Apenas ${available} edicoes disponiveis${inCart ? ` (${inCart} ja no carrinho)` : ''}.`
}

function expiredSession() {
  return apiError('EXPIRED_SESSION', 'Sessao expirada. Entre novamente.', 401)
}

function favoritesResponse(userId: string): FavoriteResponse {
  const nftIds = getState().favorites[userId] ?? []
  return { nftIds, items: nftIds.map((id) => getNft(id)).filter((nft): nft is Nft => Boolean(nft)) }
}

function countBy(items: Nft[], key: (nft: Nft) => string): NftFacet[] {
  const counts = new Map<string, number>()
  for (const item of items) counts.set(key(item), (counts.get(key(item)) ?? 0) + 1)
  return [...counts].map(([value, count]) => ({ value, count }))
}

function apiError(code: ApiErrorCode, message: string, status: number, fields?: Record<string, string>) {
  return HttpResponse.json({ error: { code, message, fields } }, { status })
}

function cleanPriceParam(value: string | null) {
  return value?.trim().replace(/^"|"$/g, '') ?? ''
}

function validateRegister(body: RegisterRequest) {
  const fields: Record<string, string> = {}
  if (!body.name || body.name.trim().length < 2) fields.name = 'Informe pelo menos 2 caracteres.'
  if (!body.email || !body.email.includes('@')) fields.email = 'Informe um e-mail valido.'
  if (!body.password || body.password.length < 6) fields.password = 'Informe pelo menos 6 caracteres.'
  return fields
}

const maxAvatarDataUrlLength = 200_000 // ~150 KB de imagem apos base64

function validateProfile(profile: { name: string; email: string; username: string; bio: string }) {
  const fields: Record<string, string> = {}
  if (profile.name.length < 2 || profile.name.length > 60) fields.name = 'Informe de 2 a 60 caracteres.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) fields.email = 'Informe um e-mail valido.'
  if (!/^[a-z0-9._]{3,24}$/.test(profile.username)) fields.username = 'Use 3 a 24 letras minusculas, numeros, ponto ou _.'
  if (profile.bio.length > 280) fields.bio = 'Use no maximo 280 caracteres.'
  return fields
}

// Redes suportadas sao EVM: endereco 0x + 40 caracteres hexadecimais.
function validateWallet(body: WalletRequest, otherWallets: Wallet[]) {
  const fields: Record<string, string> = {}
  const address = body.address?.trim() ?? ''
  if (!body.label || body.label.trim().length < 2 || body.label.trim().length > 40) fields.label = 'Informe um nome de 2 a 40 caracteres.'
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) fields.address = 'Informe um endereco 0x com 40 caracteres hexadecimais.'
  if (!SUPPORTED_NETWORKS.includes(body.network as (typeof SUPPORTED_NETWORKS)[number])) fields.network = 'Selecione uma rede suportada.'
  if (body.kind !== 'principal' && body.kind !== 'secundaria') fields.kind = 'Informe se a carteira e principal ou secundaria.'
  if (!fields.address && otherWallets.some((wallet) => wallet.address.toLowerCase() === address.toLowerCase() && wallet.network === body.network)) {
    fields.address = 'Esta carteira ja esta cadastrada nesta rede.'
  }
  return fields
}

function walletValidationError(fields: Record<string, string>) {
  const duplicated = fields.address?.includes('ja esta cadastrada')
  return apiError(duplicated ? 'CONFLICT' : 'VALIDATION_ERROR', 'Verifique os campos da carteira.', duplicated ? 409 : 422, fields)
}

function positiveNumber(value: string | null, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function validateCollector(body: CreateOrderRequest) {
  const fields: Record<string, string> = {}
  const collector = body.collector ?? { displayName: '', username: '', email: '' }
  if (!collector.displayName || collector.displayName.trim().length < 2) fields['collector.displayName'] = 'Informe pelo menos 2 caracteres.'
  if (!/^[a-z0-9._]{3,24}$/.test(collector.username ?? '')) fields['collector.username'] = 'Use 3 a 24 letras minusculas, numeros, ponto ou _.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(collector.email ?? '')) fields['collector.email'] = 'Informe um e-mail valido.'
  if ((collector.note ?? '').length > 280) fields['collector.note'] = 'Use no maximo 280 caracteres.'
  if (!SUPPORTED_NETWORKS.includes(body.network as (typeof SUPPORTED_NETWORKS)[number])) fields.network = 'Selecione uma rede suportada.'
  if (!['metamask', 'walletconnect', 'coinbase'].includes(body.provider)) fields.provider = 'Selecione o tipo de carteira.'
  return fields
}
