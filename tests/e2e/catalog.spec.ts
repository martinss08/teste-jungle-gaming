import { expect, test } from '@playwright/test'
import { catalogSearchInput, expectNoHorizontalOverflow, nfts, resetMock, searchCatalog, setScenario } from './helpers'

test.beforeEach(async ({ page }) => {
  await resetMock(page)
})

test('busca, filtros combinados, ordenacao, paginacao e historico do catalogo', async ({ page }) => {
  const isMobile = (page.viewportSize()?.width ?? 0) < 768
  await page.goto('/')
  await page.getByRole('button', { name: 'Pagina 2' }).click()
  await expect(page).toHaveURL(/page=2/)

  if (isMobile) await page.getByRole('button', { name: /^Filtros/ }).click()
  await page.getByRole('button', { name: /^Fotografia/ }).click()
  await expect(page).toHaveURL(/category=Fotografia/)
  await expect(page).toHaveURL(/page=1/)
  await page.getByRole('button', { name: /^Polygon/ }).click()
  await expect(page).toHaveURL(/network=Polygon/)
  await page.getByRole('combobox', { name: 'Ordenar por:' }).selectOption('preco-maior')
  await expect(page).toHaveURL(/sort=preco-maior/)
  if (isMobile) await page.getByRole('button', { name: 'Ver resultados' }).click()
  await expect(page.locator('a[href^="/nft/"]:visible').first()).toBeVisible()

  await searchCatalog(page, 'Sage')
  await expect(page).toHaveURL(/q=Sage/)
  await expect(page).toHaveURL(/category=Fotografia/)
  await expect(page).toHaveURL(/network=Polygon/)

  await page.goBack()
  await expect(page).not.toHaveURL(/q=Sage/)
  await expect(page).toHaveURL(/network=Polygon/)
  await expect(catalogSearchInput(page)).toHaveValue('')

  await page.goForward()
  await expect(catalogSearchInput(page)).toHaveValue('Sage')

  await page.goto('/?q=zzzz')
  await expect(page.getByRole('heading', { name: /Nenhum NFT encontrado/i })).toBeVisible()
})

test('acesso direto ao detalhe e NFT inexistente', async ({ page }) => {
  await page.goto(`/nft/${nfts.emerald}`)
  await expect(page.getByRole('heading', { name: /Emerald Ape/i })).toBeVisible()

  await page.goto(`/nft/${nfts.missing}`)
  await expect(page.getByRole('heading', { name: /Pagina nao encontrada/i })).toBeVisible()
})

test('falha de rede no detalhe permite nova tentativa', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator(`a[href="/nft/${nfts.emerald}"]:visible`).first()).toBeVisible()
  // Carrinho e cotacao ja estao em cache: a proxima requisicao REST e a do detalhe.
  await setScenario(page, { failNextCount: 1 })
  await page.locator(`a[href="/nft/${nfts.emerald}"]:visible`).first().click()
  await expect(page.getByRole('heading', { name: /Nao foi possivel carregar este NFT/i })).toBeVisible()
  await page.getByRole('button', { name: /Tentar novamente/i }).click()
  await expect(page.getByRole('heading', { name: /Emerald Ape/i })).toBeVisible()
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
  await expect(page.locator('.skeleton:visible').first()).toBeVisible()

  await setScenario(page, { latencyMs: 0 })
  await page.goto('/')
  await expect(page.locator('a[href^="/nft/"]:visible').first()).toBeVisible()
  // A listagem tem 1 retry automatico: duas falhas seguidas levam ao estado de erro.
  await setScenario(page, { failNextCount: 2 })
  await searchCatalog(page, 'falha')
  const errorHeading = page.getByRole('heading', { name: /Nao foi possivel carregar o catalogo/i })
  await expect(errorHeading).toBeVisible()
  await setScenario(page, { failNextCount: 0 })
  await page.getByRole('button', { name: /Tentar novamente/i }).click()
  await expect(errorHeading).toHaveCount(0)
})
