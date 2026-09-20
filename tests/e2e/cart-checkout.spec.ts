import { expect, test } from '@playwright/test'
import { addCartItem, applyCoupon, browserApi, loginByApi, loginByUi, nfts, patchNft, resetMock, reviewCheckout, setScenario } from './helpers'

test.beforeEach(async ({ page }) => {
  await resetMock(page)
})

test('carrinho altera quantidade, remove item e aplica cupom', async ({ page }) => {
  await addCartItem(page, nfts.sage)
  await page.goto('/carrinho')

  await expect(page.locator('h2:visible', { hasText: /Sage/i })).toBeVisible()
  await page.locator('button:visible[aria-label^="Aumentar quantidade"]').click()
  await expect(page.locator('dt:visible', { hasText: /^Total$/ })).toBeVisible()

  await page.locator('#coupon:visible, #coupon-mobile:visible').fill('KURIO10')
  await page.locator('button:visible', { hasText: /Aplicar/i }).click()
  await expect(page.locator('span:visible', { hasText: /Cupom KURIO10 aplicado/i })).toBeVisible()

  await page.locator('button:visible[aria-label^="Remover"]').click()
  await expect(page.locator('h2:visible', { hasText: /Sage/i })).toHaveCount(0)
  await expect(page.getByRole('status').filter({ hasText: 'Item removido do carrinho.' })).toBeVisible()
})

test('cupom invalido e expirado mostram erro e o carrinho sobrevive ao refresh', async ({ page }) => {
  await addCartItem(page, nfts.emerald)
  await page.goto('/carrinho')
  const coupon = page.locator('#coupon:visible, #coupon-mobile:visible')
  const apply = page.locator('button:visible', { hasText: /Aplicar/i })

  await coupon.fill('INVALIDO')
  await apply.click()
  await expect(page.getByRole('alert')).toContainText(/Cupom invalido/i)

  await coupon.fill('EXPIRADO')
  await apply.click()
  await expect(page.getByRole('alert')).toContainText(/Cupom expirado/i)
  await expect(page.locator('span:visible', { hasText: /Cupom .* aplicado/i })).toHaveCount(0)

  await page.reload()
  await expect(page.locator('h2:visible', { hasText: /Emerald Ape/i })).toBeVisible()
})

test('itens do visitante sao preservados e mesclados ao entrar', async ({ page }) => {
  await loginByApi(page)
  await addCartItem(page, nfts.emerald)
  await browserApi(page, '/api/auth/logout', { method: 'POST' })
  await page.evaluate(() => localStorage.removeItem('kurio-session-token'))

  await addCartItem(page, nfts.sage)
  await page.goto('/carrinho')
  await expect(page.locator('h2:visible', { hasText: /Sage Hood/i })).toBeVisible()
  await expect(page.locator('h2:visible', { hasText: /Emerald Ape/i })).toHaveCount(0)

  await page.goto('/login?redirect=/carrinho')
  await loginByUi(page)
  await expect(page).toHaveURL(/\/carrinho/)
  await expect(page.locator('h2:visible', { hasText: /Emerald Ape/i })).toBeVisible()
  await expect(page.locator('h2:visible', { hasText: /Sage Hood/i })).toBeVisible()

  await page.reload()
  await expect(page.locator('h2:visible', { hasText: /Sage Hood/i })).toBeVisible()
})

test('compra completa ate recibo confirmado', async ({ page }) => {
  await loginByApi(page)
  await page.goto(`/nft/${nfts.emerald}`)
  await page.getByRole('button', { name: /^Comprar(?: NFT)?$/ }).click()
  await expect(page).toHaveURL(/\/carrinho/)
  await applyCoupon(page)

  await page.getByRole('button', { name: /Conectar e finalizar/i }).click()
  await expect(page).toHaveURL(/\/pagamento/)

  await reviewCheckout(page)
  await page.getByRole('button', { name: /Confirmar compra/i }).click()

  await expect(page).toHaveURL(/\/confirmacao/)
  await expect(page.getByRole('heading', { name: /Pedido confirmado/i })).toBeVisible({ timeout: 10_000 })
  await expect(page.getByText('KURIO10', { exact: false }).first()).toBeVisible()
})

test('adicionar ao carrinho abre painel lateral com acoes', async ({ page }) => {
  await page.goto(`/nft/${nfts.sage}`)
  await page.getByRole('button', { name: /Adicionar ao carrinho/i }).click()

  const drawer = page.getByRole('dialog', { name: /Item no carrinho/i })
  await expect(drawer).toBeVisible()
  await expect(drawer.getByText(/Sage Hood #804/i)).toBeVisible()
  await expect(drawer.getByRole('link', { name: /Ver carrinho/i })).toBeVisible()

  await drawer.getByRole('button', { name: /Continuar comprando/i }).click()
  await expect(drawer).toBeHidden()
  await expect(page).toHaveURL(/\/nft\/sage-hood-804/)
})

test('pagamento recusado, clique repetido e timeout recuperam estado correto', async ({ page }) => {
  await loginByApi(page)
  await addCartItem(page, nfts.emerald)
  await setScenario(page, { paymentResult: 'recusado', paymentDelayMs: 100 })
  await page.goto('/pagamento')
  await reviewCheckout(page)
  await page.getByRole('button', { name: /Confirmar compra/i }).dblclick()
  await expect(page.getByRole('heading', { name: /Pagamento recusado/i })).toBeVisible({ timeout: 10_000 })
  await expect(page).toHaveURL(/pedido=GM-2049/)
  await page.getByRole('link', { name: /Voltar ao carrinho/i }).click()
  await expect(page.locator('h2:visible', { hasText: /Emerald Ape/i })).toBeVisible()

  await resetMock(page)
  await loginByApi(page)
  await addCartItem(page, nfts.emerald)
  await setScenario(page, { timeoutNextOrder: true, paymentDelayMs: 100 })
  await page.goto('/pagamento')
  await reviewCheckout(page)
  await page.getByRole('button', { name: /Confirmar compra/i }).click()
  await expect(page).toHaveURL(/pedido=GM-2049/)
  await expect(page.getByRole('heading', { name: /Pedido confirmado/i })).toBeVisible({ timeout: 10_000 })
})

test('refresh durante o envio do pedido retoma a mesma tentativa sem duplicar', async ({ page }) => {
  await loginByApi(page)
  await addCartItem(page, nfts.emerald)
  await setScenario(page, { paymentDelayMs: 100 })
  await page.goto('/pagamento')
  await reviewCheckout(page)

  await setScenario(page, { offline: true })
  await page.getByRole('button', { name: /Confirmar compra/i }).click()
  await expect(page.getByRole('button', { name: /Enviando pedido/i })).toBeVisible()

  await setScenario(page, { offline: false })
  await page.reload()
  await expect(page).toHaveURL(/pedido=GM-2049/)
  await expect(page.getByRole('heading', { name: /Pedido confirmado/i })).toBeVisible({ timeout: 10_000 })

  const duplicate = await browserApi(page, '/api/orders/GM-2050')
  expect(duplicate.status).toBe(404)
  await page.goto('/carrinho')
  await expect(page.getByText(/Seu carrinho esta vazio/i).filter({ visible: true })).toBeVisible()
})

test('mudanca de preco/disponibilidade bloqueia checkout ate revisar carrinho', async ({ page }) => {
  await loginByApi(page)
  await addCartItem(page, nfts.emerald)
  await patchNft(page, nfts.emerald, { priceEth: '9.990', available: 1 })
  await page.goto('/carrinho')
  await expect(page.getByRole('alert').filter({ hasText: /cotacao do seu carrinho mudou/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Conectar e finalizar/i })).toBeDisabled()
  await page.locator('button:visible', { hasText: /Aceitar valores atuais/i }).click()
  await expect(page.getByRole('alert').filter({ hasText: /cotacao do seu carrinho mudou/i })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Conectar e finalizar/i })).toBeEnabled()
})
