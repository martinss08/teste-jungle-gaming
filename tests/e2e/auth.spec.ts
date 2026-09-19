import { expect, test } from '@playwright/test'
import { loginByApi, resetMock, setScenario, user } from './helpers'

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
    await page.evaluate(async () => {
      await fetch('/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('kurio-session-token') ?? ''}` } })
      localStorage.removeItem('kurio-session-token')
    })
    await page.goto('/login')
    await expect(page.locator('form').getByRole('button', { name: /^Entrar$/i })).toBeVisible()
  } else {
    await page.getByRole('button', { name: /Sair/i }).click()
    await expect(page.locator('#root').getByRole('button', { name: /Entrar/i })).toBeVisible()
  }
})

test('cadastro valida conflito e sessao expirada redireciona', async ({ page }) => {
  await page.goto('/cadastro')
  await page.locator('input[name="name"]').fill('Julia Clone')
  await page.locator('input[name="email"]').fill(user.email)
  await page.locator('input[name="password"]').fill('greenmint')
  await page.locator('input[name="confirm"]').fill('greenmint')
  await page.locator('form').getByRole('button', { name: /Criar conta/i }).click()
  await expect(page.getByText(/e-mail ja cadastrado|ja existe|já existe/i)).toBeVisible()

  await loginByApi(page)
  await setScenario(page, { forceSessionExpired: true })
  await page.goto('/perfil')
  await expect(page).toHaveURL(/\/login/)
})
