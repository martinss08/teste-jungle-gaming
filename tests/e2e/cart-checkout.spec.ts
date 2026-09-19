import { expect, test } from '@playwright/test'
import { addCartItem, applyCoupon, loginByApi, nfts, patchNft, resetMock, setScenario } from './helpers'

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

test('cupom invalido mostra erro e persistencia sobrevive ao refresh/login', async ({ page }) => {
  await addCartItem(page, nfts.emerald)
  await page.goto('/carrinho')
  await page.locator('#coupon:visible, #coupon-mobile:visible').fill('INVALIDO')
  await page.locator('button:visible', { hasText: /Aplicar/i }).click()
  await expect(page.getByRole('alert')).toContainText(/cupom|codigo/i)

  await page.reload()
  await expect(page.locator('h2:visible', { hasText: /Emerald Ape/i })).toBeVisible()

  await loginByApi(page)
  await page.goto('/carrinho')
  await addCartItem(page, nfts.emerald)
  await page.goto('/carrinho')
  await expect(page.locator('h2:visible', { hasText: /Emerald Ape/i })).toBeVisible()
})

test('compra completa ate recibo confirmado', async ({ page }) => {
  await loginByApi(page)
  await page.goto(`/nft/${nfts.emerald}`)
  await page.getByRole('button', { name: /^Comprar$|Adicionar ao carrinho/ }).click()
  await expect(page.getByRole('status').filter({ hasText: /Adicionado ao carrinho/i })).toBeVisible()
  await applyCoupon(page)

  await page.goto('/carrinho')
  await page.getByRole('button', { name: /Conectar e finalizar/i }).click()
  await expect(page).toHaveURL(/\/pagamento/)

  await page.getByRole('button', { name: /Conectar carteira/i }).click()
  await expect(page.getByText(/Conectada via/i)).toBeVisible()
  await page.getByRole('button', { name: /Revisar pedido/i }).click()
  await page.getByRole('button', { name: /Confirmar e pagar/i }).click()

  await expect(page).toHaveURL(/\/confirmacao/)
  await expect(page.getByRole('heading', { name: /Pedido confirmado/i })).toBeVisible({ timeout: 10_000 })
  await expect(page.getByText('KURIO10', { exact: false }).first()).toBeVisible()
})

test('pagamento recusado, clique repetido e timeout recuperam estado correto', async ({ page }) => {
  await loginByApi(page)
  await addCartItem(page, nfts.emerald)
  await setScenario(page, { paymentResult: 'recusado', paymentDelayMs: 100 })
  await page.goto('/pagamento')
  await page.getByRole('button', { name: /Conectar carteira/i }).click()
  await page.getByRole('button', { name: /Revisar pedido/i }).click()
  await page.getByRole('button', { name: /Confirmar e pagar/i }).dblclick()
  await expect(page.getByRole('heading', { name: /Pagamento recusado/i })).toBeVisible({ timeout: 10_000 })
  // O primeiro pedido apos o reset e GM-2049; um pedido duplicado apareceria como GM-2050.
  await expect(page).toHaveURL(/pedido=GM-2049/)
  await page.getByRole('link', { name: /Voltar ao carrinho/i }).click()
  await expect(page.locator('h2:visible', { hasText: /Emerald Ape/i })).toBeVisible()

  await resetMock(page)
  await loginByApi(page)
  await addCartItem(page, nfts.emerald)
  await setScenario(page, { timeoutNextOrder: true, paymentDelayMs: 100 })
  await page.goto('/pagamento')
  await page.getByRole('button', { name: /Conectar carteira/i }).click()
  await page.getByRole('button', { name: /Revisar pedido/i }).click()
  await page.getByRole('button', { name: /Confirmar e pagar/i }).click()
  await expect(page).toHaveURL(/pedido=GM-2049/)
  await expect(page.getByRole('heading', { name: /Pedido confirmado/i })).toBeVisible({ timeout: 10_000 })
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
