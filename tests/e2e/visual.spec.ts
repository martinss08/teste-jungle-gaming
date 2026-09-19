import { expect, test } from '@playwright/test'
import { addCartItem, loginByApi, nfts, resetMock } from './helpers'

async function waitForImages(page: import('@playwright/test').Page) {
  await page.waitForLoadState('domcontentloaded')
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.evaluate(async () => {
        for (const image of Array.from(document.images)) image.loading = 'eager'
        await Promise.race([
          Promise.all(
            Array.from(document.images)
              .filter((image) => !image.complete)
              .map((image) => new Promise((resolve) => {
                image.addEventListener('load', resolve, { once: true })
                image.addEventListener('error', resolve, { once: true })
              })),
          ),
          new Promise((resolve) => setTimeout(resolve, 5000)),
        ])
      })
      return
    } catch (error) {
      if (attempt === 2) throw error
      await page.waitForLoadState('domcontentloaded')
      await page.waitForTimeout(300)
    }
  }
}

function screenshotOptions(page: import('@playwright/test').Page) {
  return {
    fullPage: (page.viewportSize()?.width ?? 0) >= 768,
    animations: 'disabled' as const,
    timeout: 15_000,
    maxDiffPixelRatio: 0.02,
  }
}

test.beforeEach(async ({ page }) => {
  await resetMock(page)
})

test('regressao visual da inicio', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('a[href^="/nft/"]:visible').first()).toBeVisible()
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)
  await waitForImages(page)
  await expect(page).toHaveScreenshot('inicio.png', screenshotOptions(page))
})

test('regressao visual do detalhe', async ({ page }) => {
  await page.goto(`/nft/${nfts.emerald}`)
  await expect(page.getByRole('heading', { name: /Emerald Ape/i })).toBeVisible()
  await waitForImages(page)
  await expect(page).toHaveScreenshot('detalhe-nft.png', screenshotOptions(page))
})

test('regressao visual do carrinho', async ({ page }) => {
  await addCartItem(page, nfts.emerald)
  await addCartItem(page, nfts.sage)
  await page.goto('/carrinho')
  await expect(page.locator('h2:visible', { hasText: /Emerald|Sage/i }).first()).toBeVisible()
  await waitForImages(page)
  await expect(page).toHaveScreenshot('carrinho.png', screenshotOptions(page))
})

test('regressao visual do pagamento', async ({ page }) => {
  await loginByApi(page)
  await addCartItem(page, nfts.emerald)
  await page.goto('/pagamento')
  await expect(page.getByRole('heading', { name: /Pagamento|Perfil do colecionador/i }).first()).toBeVisible()
  await waitForImages(page)
  await expect(page).toHaveScreenshot('pagamento.png', screenshotOptions(page))
})
