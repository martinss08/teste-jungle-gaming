import { expect, test } from '@playwright/test'
import { addCartItem, browserApi, expectNoHorizontalOverflow, favoritesSection, loginByApi, nfts, patchNft, postMock, resetMock, reviewCheckout, secondUser, setScenario, user } from './helpers'

test.beforeEach(async ({ page }) => {
  await resetMock(page)
  await loginByApi(page)
})

test('perfil edita dados, valida formulario e altera senha', async ({ page }) => {
  await page.goto('/perfil')
  await page.locator('#profile-name').fill('Julia Monteiro QA')
  await page.getByRole('button', { name: /Salvar alteracoes/i }).click()
  await expect(page.getByText(/Perfil atualizado/i)).toBeVisible()
  await page.reload()
  await expect(page.locator('#profile-name')).toHaveValue('Julia Monteiro QA')

  await page.locator('#password-new').fill('123')
  await page.locator('#password-confirm').fill('456')
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.locator('#password-new-error')).toBeVisible()
  await expect(page.locator('#password-confirm-error')).toBeVisible()

  await page.locator('#password-current').fill(user.password)
  await page.locator('#password-new').fill('nova-senha-qa')
  await page.locator('#password-confirm').fill('nova-senha-qa')
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.getByText('Senha atualizada.')).toBeVisible()
})

test('avatar enviado pela interface valida o arquivo e persiste apos refresh', async ({ page }) => {
  await page.goto('/perfil')
  const fileInput = page.locator('#profile-avatar')
  const status = page.getByRole('status').filter({ hasText: /avatar|imagem/i })

  await fileInput.setInputFiles({ name: 'notas.txt', mimeType: 'text/plain', buffer: Buffer.from('nao e imagem') })
  await expect(status).toHaveText(/Envie uma imagem PNG, JPEG ou WebP/i)

  await fileInput.setInputFiles('src/assets/kurio-ape-1.png')
  await expect(status).toHaveText('Avatar atualizado.')
  const avatar = page.getByAltText(/Avatar de Julia Monteiro/i)
  await expect(avatar).toHaveAttribute('src', /^data:image\/jpeg;base64,/)
  const uploaded = await avatar.getAttribute('src')

  await page.reload()
  await expect(page.getByAltText(/Avatar de Julia Monteiro/i)).toHaveAttribute('src', uploaded!)
})

test('perfil mostra conflito de e-mail e nome de usuario retornado pela API', async ({ page }) => {
  await page.goto('/perfil')
  await page.locator('#profile-email').fill(secondUser.email)
  await page.locator('#profile-username').fill('caio')
  await page.getByRole('button', { name: /Salvar alteracoes/i }).click()
  await expect(page.locator('#profile-email-error')).toHaveText(/ja cadastrado/i)
  await expect(page.locator('#profile-username-error')).toHaveText(/indisponivel/i)
  await expect(page.locator('#profile-email')).toHaveAttribute('aria-invalid', 'true')

  await page.reload()
  await expect(page.locator('#profile-email')).toHaveValue(user.email)
})

test('carteira existente e editada, validada e promovida a principal', async ({ page }) => {
  await page.goto('/carteiras')
  const secondaryForm = page.locator('form', { has: page.locator('#wallet-wallet-secondary-label') })
  const mainForm = page.locator('form', { has: page.locator('#wallet-wallet-main-label') })

  await secondaryForm.locator('#wallet-wallet-secondary-label').fill('Reserva QA')
  await secondaryForm.locator('#wallet-wallet-secondary-address').fill('0x123')
  await secondaryForm.getByRole('button', { name: /Salvar carteira/i }).click()
  await expect(secondaryForm.locator('#wallet-wallet-secondary-address-error')).toBeVisible()

  await secondaryForm.locator('#wallet-wallet-secondary-address').fill('0x2222222222222222222222222222222222222222')
  await secondaryForm.getByLabel('Tipo de carteira').selectOption('principal')
  await secondaryForm.getByRole('button', { name: /Salvar carteira/i }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Carteira salva.' })).toBeVisible()
  await expect(mainForm.getByLabel('Tipo de carteira')).toHaveValue('secundaria')

  await page.reload()
  await expect(secondaryForm.locator('#wallet-wallet-secondary-label')).toHaveValue('Reserva QA')
  await expect(secondaryForm.getByLabel('Tipo de carteira')).toHaveValue('principal')
  await expect(mainForm.getByLabel('Tipo de carteira')).toHaveValue('secundaria')
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
  await page.goto('/perfil#favoritos')
  await expect(favoritesSection(page).getByRole('link', { name: /Sage Hood/i })).toBeVisible()
})

test('carteiras valida endereco e cadastra secundaria', async ({ page }) => {
  await page.goto('/carteiras')
  await page.getByRole('button', { name: 'Adicionar', expanded: false }).first().click()
  await page.locator('#wallet-new-label').fill('Carteira QA')
  await page.locator('#wallet-new-address').fill('0x123')
  await page.getByRole('button', { name: /Cadastrar carteira/i }).click()
  await expect(page.getByText(/endereco 0x/i)).toBeVisible()

  await page.locator('#wallet-new-address').fill('0x1111111111111111111111111111111111111111')
  await page.getByRole('button', { name: /Cadastrar carteira/i }).click()
  await expect(page.locator('#new-wallet')).toHaveCount(0)
  await expect.poll(() => page.locator('input[id^="wallet-"][id$="-label"]').evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value)))
    .toContain('Carteira QA')
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
  const routes = [
    ['/pagamento', /Perfil do colecionador|Seu carrinho esta vazio/],
    ['/perfil', /Perfil do colecionador/],
    ['/carteiras', /Carteira principal/],
  ] as const
  for (const [route, heading] of routes) {
    await page.goto(route)
    // Espera a rota carregar para que uma navegacao pendente nao interrompa a proxima.
    await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible()
    await expectNoHorizontalOverflow(page)
  }
})

test('nft.updated durante a revisao do checkout exige nova confirmacao', async ({ page }) => {
  await addCartItem(page, nfts.emerald)
  await page.goto('/pagamento')
  await reviewCheckout(page)
  const confirm = page.getByRole('button', { name: /Confirmar compra/i })
  await expect(confirm).toBeEnabled()

  await page.evaluate(() => {
    window.__kurioRealtimeOutcomes = []
    window.addEventListener('kurio:realtime', (event) => {
      window.__kurioRealtimeOutcomes.push((event as CustomEvent<{ outcome: string }>).detail.outcome)
    })
  })
  await patchNft(page, nfts.emerald, { priceEth: '9.990' })
  await expect.poll(() => page.evaluate(() => window.__kurioRealtimeOutcomes)).toContain('applied')
  await expect(page.getByText(/A cotacao mudou desde a sua revisao/i)).toBeVisible()
  await expect(confirm).toBeDisabled()

  await page.getByRole('button', { name: /Revisar novamente/i }).click()
  await page.getByRole('button', { name: /Aceitar valores atuais/i }).click()
  await page.getByRole('button', { name: /Revisar pedido/i }).click()
  await expect(page.getByRole('heading', { name: /Revise seu pedido/i })).toBeVisible()
  await expect(page.getByText(/9\.990 ETH/).first()).toBeVisible()
  await confirm.click()

  await expect(page.getByRole('heading', { name: /Pedido confirmado/i })).toBeVisible({ timeout: 10_000 })
  await expect(page.getByText(/1 x 9\.990 ETH/)).toBeVisible()
})

test('pedido pendente sobrevive a queda de conexao e refresh ate a confirmacao', async ({ page }) => {
  await page.clock.install()
  await addCartItem(page, nfts.emerald)
  await setScenario(page, { paymentDelayMs: 60_000 })
  await page.goto('/pagamento')
  await reviewCheckout(page)
  await page.getByRole('button', { name: /Confirmar compra/i }).click()

  const pending = page.getByRole('heading', { name: /Aguardando confirmacao/i })
  await expect(pending).toBeVisible()
  await expect(page).toHaveURL(/pedido=GM-2049/)

  await postMock(page, '/api/mock/realtime/disconnect')
  await page.reload()
  await expect(pending).toBeVisible()

  // O relogio controlado liquida o pagamento sem esperar 60 s reais.
  await page.clock.fastForward(60_000)
  await expect(page.getByRole('heading', { name: /Pedido confirmado/i })).toBeVisible()
  await expect(page).toHaveURL(/pedido=GM-2049/)
  const duplicate = await browserApi(page, '/api/orders/GM-2050')
  expect(duplicate.status).toBe(404)
})

test('rotas principais em tablet (768px) nao geram overflow horizontal', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'A largura de tablet e definida no proprio teste.')
  await page.setViewportSize({ width: 768, height: 1024 })
  await addCartItem(page, nfts.emerald)
  const routes = [
    ['/', /Seja dono do futuro/],
    [`/nft/${nfts.emerald}`, /Emerald Ape/],
    ['/carrinho', /Resumo da carteira/],
    ['/pagamento', /Perfil do colecionador/],
    ['/perfil', /Perfil do colecionador/],
    ['/carteiras', /Carteira principal/],
  ] as const
  for (const [route, heading] of routes) {
    await page.goto(route)
    await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible()
    await expectNoHorizontalOverflow(page)
  }
})
