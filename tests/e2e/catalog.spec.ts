import { expect, test } from '@playwright/test'
import { expectNoHorizontalOverflow, nfts, resetMock, setScenario } from './helpers'

test.beforeEach(async ({ page }) => {
  await resetMock(page)
})

test('busca, filtro, ordenacao, paginacao e historico do catalogo', async ({ page }) => {
  await page.goto('/')
  await page.locator('input[name="q"]:visible').fill('Sage')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/q=Sage/)
  await expect(page.locator('a[href^="/nft/"]:visible').first()).toBeVisible()

  await page.goto('/?q=&rarity=raro&sort=preco-maior&page=1')
  await expect(page.getByRole('button', { name: /Em alta|Ordenar por/i }).first()).toBeVisible()
  await expect(page).toHaveURL(/rarity=raro/)

  await page.goto('/?q=zzzz&rarity=todos&sort=recentes&page=1')
  await expect(page.locator('div:visible, h2:visible', { hasText: /Nenhum NFT encontrado/i }).first()).toBeVisible()

  await page.goBack()
  await expect(page).toHaveURL(/rarity=raro/)
})

test('acesso direto ao detalhe e NFT inexistente', async ({ page }) => {
  await page.goto(`/nft/${nfts.emerald}`)
  await expect(page.getByRole('heading', { name: /Emerald Ape/i })).toBeVisible()

  await page.goto(`/nft/${nfts.missing}`)
  await expect(page.getByRole('heading', { name: /Pagina nao encontrada/i })).toBeVisible()
})

test('rotas principais nao geram overflow horizontal', async ({ page }) => {
  for (const route of ['/', '/carrinho']) {
    try {
      await page.goto(route)
    } catch {
      await page.goto(route, { waitUntil: 'domcontentloaded' })
    }
    await page.waitForLoadState('domcontentloaded')
    await expectNoHorizontalOverflow(page)
  }
})

test('skeletons aparecem em carregamento lento e falha permite nova tentativa', async ({ page }) => {
  await setScenario(page, { latencyMs: 800, jitterMs: 0 })
  await page.goto('/')
  await expect(page.locator('.animate-pulse:visible').first()).toBeVisible()

  await setScenario(page, { latencyMs: 0, failNextCount: 6 })
  await page.goto('/?q=falha&rarity=todos&sort=recentes&page=1')
  await expect(page.getByText(/Nao foi possivel carregar o catalogo/i)).toBeVisible()
  await setScenario(page, { failNextCount: 0 })
  await page.getByRole('button', { name: /Tentar novamente/i }).click()
  await expect(page.getByText(/Nao foi possivel carregar o catalogo/i)).toHaveCount(0)
})
