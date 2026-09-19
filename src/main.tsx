import { StrictMode, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { AppShell } from './modules/layout/AppShell'
import { CartProvider } from './modules/cart/CartProvider'
import { AuthProvider } from './modules/auth/AuthProvider'
import { RealtimeProvider } from './modules/realtime/RealtimeProvider'
import { RequireAuth } from './modules/auth/RequireAuth'
import { validateCatalogSearch } from './modules/catalog/search'
import { RouteSuspense } from './routes/RouteSuspense'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import '@fontsource/inter/latin-800.css'
import '@fontsource/space-grotesk/latin-600.css'
import '@fontsource/space-grotesk/latin-700.css'
import './styles.css'

const NftDetailsPage = lazy(() => import('./pages/NftDetailsPage').then((module) => ({ default: module.NftDetailsPage })))
const CartPage = lazy(() => import('./pages/CartPage').then((module) => ({ default: module.CartPage })))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then((module) => ({ default: module.CheckoutPage })))
const ConfirmationPage = lazy(() => import('./pages/ConfirmationPage').then((module) => ({ default: module.ConfirmationPage })))
const LoginPage = lazy(() => import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })))
const RegisterPage = lazy(() => import('./pages/RegisterPage').then((module) => ({ default: module.RegisterPage })))
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((module) => ({ default: module.ProfilePage })))
const WalletsPage = lazy(() => import('./pages/WalletsPage').then((module) => ({ default: module.WalletsPage })))
const CreatorsPage = lazy(() => import('./pages/CreatorsPage').then((module) => ({ default: module.CreatorsPage })))
const LearnPage = lazy(() => import('./pages/LearnPage').then((module) => ({ default: module.LearnPage })))

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
  component: () => <RouteSuspense><NftDetailsPage /></RouteSuspense>,
})

const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/carrinho',
  component: () => <RouteSuspense><CartPage /></RouteSuspense>,
})

const creatorsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/criadores',
  component: () => <RouteSuspense><CreatorsPage /></RouteSuspense>,
})

const learnRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/aprenda',
  component: () => <RouteSuspense><LearnPage /></RouteSuspense>,
})

const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pagamento',
  component: () => (
    <RequireAuth>
      <RouteSuspense><CheckoutPage /></RouteSuspense>
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
      <RouteSuspense><ConfirmationPage /></RouteSuspense>
    </RequireAuth>
  ),
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: () => <RouteSuspense><LoginPage /></RouteSuspense>,
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : '/',
  }),
})

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cadastro',
  component: () => <RouteSuspense><RegisterPage /></RouteSuspense>,
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : '/',
  }),
})

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/perfil',
  component: () => (
    <RequireAuth>
      <RouteSuspense><ProfilePage /></RouteSuspense>
    </RequireAuth>
  ),
})

const walletsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/carteiras',
  component: () => (
    <RequireAuth>
      <RouteSuspense><WalletsPage /></RouteSuspense>
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
