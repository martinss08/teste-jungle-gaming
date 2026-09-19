import { expect, test } from '@playwright/test'
import { addCartItem, loginByApi, resetMock, setScenario, user } from './helpers'

test.beforeEach(async ({ page }) => {
  await resetMock(page)
})

test('login, rota protegida e logout', async ({ page }) => {
  await page.goto('/pagamento')
  await expect(page).toHaveURL(/\/login/)

  await page.locator('input[name="email"]').fill(user.email)
  await page.locator('input[name="password"]').fill(user.password)
  await page.locator('form').getByRole('button', { name: /^Entrar$/i }).click()
  await expect(page).toHaveURL(/\/pagamento/)

  if ((page.viewportSize()?.width ?? 0) < 768) {
    await page.getByRole('button', { name: 'Conta' }).click()
    await expect(page.getByRole('dialog', { name: user.name })).toBeVisible()
    await page.getByRole('dialog').getByRole('button', { name: 'Sair' }).click()
  } else {
    await page.getByRole('button', { name: /Sair/i }).click()
  }
  await expect(page).toHaveURL(/\/login/)
  await expect(page.locator('form').getByRole('button', { name: /^Entrar$/i })).toBeVisible()
})

test('login valida campos e mostra erro da API', async ({ page }) => {
  await page.goto('/login')
  await page.locator('form').getByRole('button', { name: /^Entrar$/i }).click()
  await expect(page.locator('#auth-email')).toHaveAttribute('aria-invalid', 'true')
  await expect(page.locator('#auth-email-error')).toBeVisible()

  await page.locator('input[name="email"]').fill(user.email)
  await page.locator('input[name="password"]').fill('senha-errada')
  await page.locator('form').getByRole('button', { name: /^Entrar$/i }).click()
  await expect(page.getByRole('alert')).toContainText(/e-mail ou senha invalidos/i)
})

test('cadastro valida conflito e sessao expirada redireciona', async ({ page }) => {
  await page.goto('/cadastro')
  await page.locator('input[name="name"]').fill('Julia Clone')
  await page.locator('input[name="email"]').fill(user.email)
  await page.locator('input[name="password"]').fill('greenmint')
  await page.locator('input[name="confirm"]').fill('greenmint')
  await page.locator('form').getByRole('button', { name: /Criar conta/i }).click()
  await expect(page.getByRole('alert')).toContainText(/ja existe/i)
  await expect(page.locator('#auth-email-error')).toContainText(/ja cadastrado/i)

  await loginByApi(page)
  await setScenario(page, { forceSessionExpired: true })
  await page.goto('/perfil')
  await expect(page).toHaveURL(/\/login/)
  await expect(page.getByText(/Sua sessao expirou/i).first()).toBeVisible()
})

test('cadastro cria conta e entra no fluxo', async ({ page }) => {
  await page.goto('/cadastro?redirect=/perfil')
  await page.locator('input[name="name"]').fill('Nova Colecionadora')
  await page.locator('input[name="email"]').fill('nova@greenmint.dev')
  await page.locator('input[name="password"]').fill('segredo1')
  await page.locator('input[name="confirm"]').fill('segredo1')
  await page.locator('form').getByRole('button', { name: /Criar conta/i }).click()
  await expect(page).toHaveURL(/\/perfil/)
  await expect(page.getByLabel(/^Nome$/i)).toHaveValue('Nova Colecionadora')
})

test('sessao expirada durante a navegacao encerra a sessao local', async ({ page }) => {
  await loginByApi(page)
  await addCartItem(page)
  await page.goto('/carrinho')
  await expect(page.locator('h2:visible', { hasText: /Emerald Ape/i })).toBeVisible()

  await setScenario(page, { forceSessionExpired: true })
  await page.locator('#coupon:visible, #coupon-mobile:visible').fill('KURIO10')
  await page.locator('button:visible', { hasText: /Aplicar/i }).click()
  await expect(page.getByRole('status').filter({ hasText: /Sua sessao expirou/i })).toBeVisible()
  await page.getByRole('button', { name: /Entrar novamente/i }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
})
