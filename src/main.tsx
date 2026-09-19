import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { AppShell } from './modules/layout/AppShell'
import { CartProvider } from './modules/cart/CartProvider'
import { AuthProvider } from './modules/auth/AuthProvider'
import { RealtimeProvider } from './modules/realtime/RealtimeProvider'
import { RequireAuth } from './modules/auth/RequireAuth'
import { validateCatalogSearch } from './modules/catalog/search'
import { HomePage } from './pages/HomePage'
import { NftDetailsPage } from './pages/NftDetailsPage'
import { CartPage } from './pages/CartPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { ConfirmationPage } from './pages/ConfirmationPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ProfilePage } from './pages/ProfilePage'
import { WalletsPage } from './pages/WalletsPage'
import { CreatorsPage } from './pages/CreatorsPage'
import { LearnPage } from './pages/LearnPage'
import { NotFoundPage } from './pages/NotFoundPage'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import '@fontsource/inter/latin-800.css'
import '@fontsource/space-grotesk/latin-600.css'
import '@fontsource/space-grotesk/latin-700.css'
import './styles.css'

async function enableMocking() {
  const shouldEnable =
    import.meta.env.DEV ||
    import.meta.env.VITE_ENABLE_MSW === 'true'

  if (!shouldEnable) return
  const { startMockWorker } = await import('./mocks/browser')
  await startMockWorker()
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 45_000,
      retry: 1,
    },
  },
})

const rootRoute = createRootRoute({
  component: AppShell,
  notFoundComponent: NotFoundPage,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
  validateSearch: validateCatalogSearch,
})

const nftRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/nft/$nftId',
  component: NftDetailsPage,
})

const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/carrinho',
  component: CartPage,
})

const creatorsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/criadores',
  component: CreatorsPage,
})

const learnRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/aprenda',
  component: LearnPage,
})

const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pagamento',
  component: () => (
    <RequireAuth>
      <CheckoutPage />
    </RequireAuth>
  ),
})

const confirmationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/confirmacao',
  validateSearch: (search: Record<string, unknown>) => ({
    pedido: typeof search.pedido === 'string' ? search.pedido : '',
  }),
  component: () => (
    <RequireAuth>
      <ConfirmationPage />
    </RequireAuth>
  ),
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : '/',
  }),
})

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cadastro',
  component: RegisterPage,
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : '/',
  }),
})

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/perfil',
  component: () => (
    <RequireAuth>
      <ProfilePage />
    </RequireAuth>
  ),
})

const walletsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/carteiras',
  component: () => (
    <RequireAuth>
      <WalletsPage />
    </RequireAuth>
  ),
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  nftRoute,
  creatorsRoute,
  learnRoute,
  cartRoute,
  checkoutRoute,
  confirmationRoute,
  loginRoute,
  registerRoute,
  profileRoute,
  walletsRoute,
])

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

await enableMocking()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RealtimeProvider>
          <CartProvider>
            <RouterProvider router={router} />
          </CartProvider>
        </RealtimeProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
