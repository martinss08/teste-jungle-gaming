import { expect, type Page } from '@playwright/test'

export const user = {
  email: 'julia@greenmint.dev',
  password: 'greenmint',
  name: 'Julia Monteiro',
}

export const secondUser = {
  email: 'caio@greenmint.dev',
  password: 'kurioaccess',
  name: 'Caio Araujo',
}

export const nfts = {
  emerald: 'emerald-ape-042',
  sage: 'sage-hood-804',
  missing: 'nft-inexistente',
}

export async function browserApi<T = unknown>(page: Page, path: string, options: { method?: string; data?: unknown } = {}) {
  await page.waitForLoadState('domcontentloaded')
  let last: { ok: boolean; status: number; body: T } | null = null
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      last = await page.evaluate(
        async ({ path, method, data }) => {
          const token = localStorage.getItem('kurio-session-token')
          let guestId = localStorage.getItem('kurio-guest-id')
          if (!guestId) {
            guestId = `guest-${crypto.randomUUID()}`
            localStorage.setItem('kurio-guest-id', guestId)
          }

          const response = await fetch(path, {
            method,
            headers: {
              'Content-Type': 'application/json',
              'X-Guest-Id': guestId,
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: data === undefined ? undefined : JSON.stringify(data),
          })
          const text = await response.text()
          return {
            ok: response.ok,
            status: response.status,
            body: text ? JSON.parse(text) : null,
          }
        },
        { path, method: options.method ?? 'GET', data: options.data },
      ) as { ok: boolean; status: number; body: T }
    } catch (error) {
      if (attempt === 2) throw error
      await page.waitForLoadState('domcontentloaded')
      await page.waitForTimeout(300)
      continue
    }
    if (last.ok || (last.status >= 400 && last.body !== null)) return last
    await page.waitForTimeout(300)
  }
  return last!
}

export async function resetMock(page: Page) {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  const reset = await browserApi(page, '/api/mock/reset', { method: 'POST' })
  expect(reset.ok).toBeTruthy()
  const scenario = await browserApi(page, '/api/mock/scenario', {
    method: 'PATCH',
    data: {
      latencyMs: 0,
      jitterMs: 0,
      failNext: false,
      forceSessionExpired: false,
      paymentResult: 'confirmado',
      paymentDelayMs: 100,
      walletConnection: 'aprovar',
      quoteChanged: false,
      timeoutNextOrder: false,
      offline: false,
      slowNextListMs: 0,
    },
  })
  expect(scenario.ok).toBeTruthy()
  await clearCart(page)
  const session = await browserApi<{ token: string }>(page, '/api/auth/login', {
    method: 'POST',
    data: { email: user.email, password: user.password },
  })
  expect(session.ok).toBeTruthy()
  await page.evaluate((token) => localStorage.setItem('kurio-session-token', token), session.body.token)
  await clearCart(page)
  await browserApi(page, '/api/auth/logout', { method: 'POST' })
  await page.evaluate(() => localStorage.removeItem('kurio-session-token'))
  await page.goto('/')
  await page.waitForLoadState('domcontentloaded')
}

export async function loginByApi(page: Page, credentials = user) {
  const response = await browserApi<{ token: string }>(page, '/api/auth/login', {
    method: 'POST',
    data: { email: credentials.email, password: credentials.password },
  })
  expect(response.ok).toBeTruthy()
  const session = response.body
  await page.evaluate((token) => {
    localStorage.setItem('kurio-session-token', token)
  }, session.token)
  await page.goto('/')
  await page.waitForLoadState('domcontentloaded')
  return session
}

export async function clearCart(page: Page) {
  const cart = await browserApi<{ items: Array<{ nftId: string }> }>(page, '/api/cart')
  expect(cart.ok).toBeTruthy()
  for (const item of cart.body.items) {
    const removed = await browserApi(page, `/api/cart/items/${encodeURIComponent(item.nftId)}`, { method: 'DELETE' })
    expect(removed.ok).toBeTruthy()
  }
}

export async function addCartItem(page: Page, nftId = nfts.emerald, quantity = 1) {
  const response = await browserApi(page, '/api/cart/items', {
    method: 'POST',
    data: { nftId, quantity },
  })
  expect(response, JSON.stringify({ status: response.status, body: response.body })).toMatchObject({ ok: true })
}

export async function applyCoupon(page: Page, code = 'KURIO10') {
  const response = await browserApi(page, '/api/cart/coupon', {
    method: 'POST',
    data: { code },
  })
  expect(response.ok).toBeTruthy()
}

export async function setScenario(page: Page, scenario: Record<string, unknown>) {
  const response = await browserApi(page, '/api/mock/scenario', { method: 'PATCH', data: scenario })
  expect(response.ok).toBeTruthy()
}

export async function patchNft(page: Page, nftId: string, data: Record<string, unknown>) {
  const response = await browserApi(page, `/api/mock/nfts/${nftId}`, { method: 'PATCH', data })
  expect(response.ok).toBeTruthy()
}

export async function postMock(page: Page, path: string) {
  const response = await browserApi(page, path, { method: 'POST' })
  expect(response, JSON.stringify({ status: response.status, body: response.body })).toMatchObject({ ok: true })
}

export async function expectNoHorizontalOverflow(page: Page) {
  await page.waitForLoadState('domcontentloaded')
  let sizes: { bodyWidth: number; viewportWidth: number } | null = null
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      sizes = await page.evaluate(() => ({
        bodyWidth: document.body.scrollWidth,
        viewportWidth: window.innerWidth,
      }))
      break
    } catch {
      await page.waitForLoadState('domcontentloaded')
    }
  }
  if (!sizes) throw new Error('Nao foi possivel medir overflow horizontal.')
  expect(sizes.bodyWidth).toBeLessThanOrEqual(sizes.viewportWidth + 1)
}

export async function expectToastOrStatus(page: Page, text: RegExp | string) {
  await expect(page.getByRole('status').filter({ hasText: text })).toBeVisible()
}

export async function loginByUi(page: Page, credentials: { email: string; password: string } = user) {
  await page.locator('input[name="email"]').fill(credentials.email)
  await page.locator('input[name="password"]').fill(credentials.password)
  await page.locator('form').getByRole('button', { name: /^Entrar$/i }).click()
}

export async function logoutByUi(page: Page) {
  if ((page.viewportSize()?.width ?? 0) < 768) {
    await page.getByRole('button', { name: 'Conta' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Sair' }).click()
  } else {
    await page.getByRole('banner').getByRole('button', { name: 'Sair' }).click()
  }
}

// No /pagamento: conecta a carteira principal e avanca para a revisao do pedido.
export async function reviewCheckout(page: Page) {
  await page.getByRole('button', { name: /Conectar carteira/i }).click()
  await expect(page.getByText(/Conectada via/i)).toBeVisible()
  await page.getByRole('button', { name: /Revisar pedido/i }).click()
  await expect(page.getByRole('heading', { name: /Revise seu pedido/i })).toBeVisible()
}
