import { expect, test } from '@playwright/test'
import { addCartItem, browserApi, expectNoHorizontalOverflow, loginByApi, nfts, patchNft, postMock, resetMock, secondUser, setScenario, user } from './helpers'

test.beforeEach(async ({ page }) => {
  await resetMock(page)
  await loginByApi(page)
})

test('perfil edita dados, valida formulario e altera senha', async ({ page }) => {
  await page.goto('/perfil')
  await page.getByLabel(/Nome$/i).fill('Julia Monteiro QA')
  await page.getByRole('button', { name: /Salvar alteracoes/i }).click()
  await expect(page.getByText(/Perfil atualizado/i)).toBeVisible()

  await page.locator('#password-newPassword').fill('123')
  await page.getByLabel(/Confirmar nova senha/i).fill('456')
  await page.getByRole('button', { name: /Atualizar senha/i }).click()
  await expect(page.locator('#password-newPassword-error')).toBeVisible()
})

test('avatar simulado e troca de usuario nao vazam dados', async ({ page }) => {
  await page.goto('/perfil')
  const avatar = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAH/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAEFAqf/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/ASP/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/ASP/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAY/Aqf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/IV//2gAMAwEAAgADAAAAEP/EFBQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQMBAT8QH//EFBQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQIBAT8QH//EFBABAQAAAAAAAAAAAAAAAAAAABD/2gAIAQEAAT8QH//Z'
  await browserApi(page, '/api/profile/avatar', { method: 'POST', data: { dataUrl: avatar } })
  await page.reload()
  await expect(page.getByAltText(/Avatar de Julia Monteiro/i)).toHaveAttribute('src', avatar)

  await page.evaluate(async () => {
    await fetch('/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('kurio-session-token') ?? ''}` } })
    localStorage.removeItem('kurio-session-token')
  })
  await loginByApi(page, secondUser)
  await page.goto('/perfil')
  await expect(page.getByRole('heading', { name: secondUser.name })).toBeVisible()
  await expect(page.getByText(user.name)).toHaveCount(0)
})

test('favoritos fazem rollback quando a API falha e recuperam na nova tentativa', async ({ page }) => {
  await page.goto(`/nft/${nfts.sage}`)
  const favorite = page.getByRole('button', { name: /^(Favoritar|Favorito|Remover dos favoritos)$/ })
  await expect(favorite).toHaveAttribute('aria-pressed', 'false')

  await setScenario(page, { failNext: true })
  await favorite.click()
  await expect(page.getByRole('alert').filter({ hasText: /favoritos/i })).toBeVisible()
  await expect(favorite).toHaveAttribute('aria-pressed', 'false')

  await favorite.click()
  await expect(favorite).toHaveAttribute('aria-pressed', 'true')
  await page.goto('/perfil')
  await expect(page.locator('#favoritos').getByRole('link', { name: /Sage Hood/i })).toBeVisible()
})

test('carteiras valida endereco e cadastra secundaria', async ({ page }) => {
  await page.goto('/carteiras')
  await page.getByRole('button', { name: /Nova carteira/i }).click()
  await page.locator('#wallet-new-label').fill('Carteira QA')
  await page.locator('#wallet-new-address').fill('0x123')
  await page.getByRole('button', { name: /Cadastrar carteira/i }).click()
  await expect(page.getByText(/endereco 0x/i)).toBeVisible()

  await page.locator('#wallet-new-address').fill('0x1111111111111111111111111111111111111111')
  await page.getByRole('button', { name: /Cadastrar carteira/i }).click()
  await expect(page.getByText(/Carteira QA/i)).toBeVisible()
})

test('eventos em tempo real atualizam carrinho e ignoram duplicados/antigos', async ({ page }) => {
  await addCartItem(page, nfts.emerald)
  await page.goto('/carrinho')
  await page.evaluate(() => {
    window.__kurioRealtimeOutcomes = []
    const handler = (event: Event) => {
      window.__kurioRealtimeOutcomes.push((event as CustomEvent<{ outcome: string }>).detail.outcome)
      if (window.__kurioRealtimeOutcomes.includes('duplicate') && window.__kurioRealtimeOutcomes.includes('stale')) {
        window.removeEventListener('kurio:realtime', handler)
      }
    }
    window.addEventListener('kurio:realtime', handler)
  })
  await patchNft(page, nfts.emerald, { priceEth: '7.770' })
  await patchNft(page, nfts.emerald, { priceEth: '7.880' })
  await expect(page.getByRole('alert').filter({ hasText: /cotacao do seu carrinho mudou/i })).toBeVisible()
  await postMock(page, '/api/mock/realtime/replay-last')
  await postMock(page, '/api/mock/realtime/replay-stale')
  await expect.poll(() => page.evaluate(() => window.__kurioRealtimeOutcomes), {
    timeout: 3000,
  }).toEqual(expect.arrayContaining(['duplicate', 'stale']))
  const outcomes = await page.evaluate(() => window.__kurioRealtimeOutcomes)
  expect(outcomes).toEqual(expect.arrayContaining(['duplicate', 'stale']))
})

test('navegacao por teclado, foco do modal e validacoes acessiveis', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  await expect(page.getByText(/Pular para o conteudo principal/i)).toBeVisible()

  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('kurio:auth-required', { detail: { mode: 'login', redirect: '/' } }))
  })
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(page.locator('input[name="email"]')).toBeFocused()

  await page.keyboard.press('Shift+Tab')
  await expect.poll(() => dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true)
  for (let index = 0; index < 12; index += 1) await page.keyboard.press('Tab')
  await expect.poll(() => dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true)

  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
})

test('responsividade das rotas autenticadas', async ({ page }) => {
  for (const route of ['/pagamento', '/perfil', '/carteiras']) {
    await page.goto(route)
    await expectNoHorizontalOverflow(page)
  }
})
