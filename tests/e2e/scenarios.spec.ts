import { expect, test } from '@playwright/test'
import { resetMock, setScenario } from './helpers'

test.beforeEach(async ({ page }) => {
  await resetMock(page)
})

async function search(page: import('@playwright/test').Page, term: string) {
  const input = page.locator('input[name="q"]:visible')
  await input.fill(term)
  await input.press('Enter')
}

test('resposta atrasada de uma busca anterior nao sobrescreve a mais recente', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('a[href^="/nft/"]:visible').first()).toBeVisible()

  await setScenario(page, { slowNextListMs: 1500 })
  await search(page, 'Sage')
  await search(page, 'Onyx')
  await expect(page).toHaveURL(/q=Onyx/)
  const onyx = page.locator('a[href^="/nft/"]:visible', { hasText: /Onyx Visual/ })
  await expect(onyx).toBeVisible()

  // Espera a resposta lenta da busca anterior chegar e confirma que ela foi descartada.
  await page.waitForTimeout(2000)
  await expect(onyx).toBeVisible()
  await expect(page.locator('a[href^="/nft/"]:visible', { hasText: /Sage/ })).toHaveCount(0)
})

test('queda de conexao simulada mostra erro e a nova tentativa recupera', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('a[href^="/nft/"]:visible').first()).toBeVisible()

  await setScenario(page, { offline: true })
  await search(page, 'Emerald')
  const errorHeading = page.getByRole('heading', { name: /Nao foi possivel carregar o catalogo/i })
  await expect(errorHeading).toBeVisible()

  await setScenario(page, { offline: false })
  await page.getByRole('button', { name: /Tentar novamente/i }).click()
  await expect(errorHeading).toHaveCount(0)
  await expect(page.locator('a[href^="/nft/"]:visible', { hasText: /Emerald/ }).first()).toBeVisible()
})

test('preset de cenario pode ser aplicado pela URL', async ({ page }) => {
  await page.goto('/?cenario=offline')
  await expect(page.getByRole('heading', { name: /Nao foi possivel carregar o catalogo/i })).toBeVisible()
  const scenario = await page.evaluate(async () => (await fetch('/api/mock/scenario')).json())
  expect(scenario.offline).toBe(true)
})
