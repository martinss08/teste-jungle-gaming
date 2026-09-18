import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { AppShell } from './modules/layout/AppShell'
import { CartProvider } from './modules/cart/CartProvider'
import { AuthProvider } from './modules/auth/AuthProvider'
import { RequireAuth } from './modules/auth/RequireAuth'
import { HomePage } from './pages/HomePage'
import { NftDetailsPage } from './pages/NftDetailsPage'
import { CartPage } from './pages/CartPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { ConfirmationPage } from './pages/ConfirmationPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ProfilePage } from './pages/ProfilePage'
import { WalletsPage } from './pages/WalletsPage'
import { NotFoundPage } from './pages/NotFoundPage'
import './styles.css'

async function enableMocking() {
  const shouldEnable =
    import.meta.env.DEV ||
    import.meta.env.VITE_ENABLE_MSW === 'true'

  if (!shouldEnable) return

  const { worker } = await import('./mocks/browser')
  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: {
      url: '/mockServiceWorker.js',
    },
  })
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
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === 'string' ? search.q : '',
    rarity: typeof search.rarity === 'string' ? search.rarity : 'todos',
    sort: typeof search.sort === 'string' ? search.sort : 'recentes',
    page: Number(search.page || 1),
  }),
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
        <CartProvider>
          <RouterProvider router={router} />
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
