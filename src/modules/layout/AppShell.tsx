import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { Heart, Home, Instagram, Linkedin, Search, ShoppingCart, UserRound, X, Youtube } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { buttonVariants } from '../../components/ui/buttonVariants'
import { Dialog } from '../../components/ui/Dialog'
import { useCart } from '../cart/useCart'
import { cn } from '../../lib/utils'
import { useAuth } from '../auth/useAuth'
import { AuthModalPage } from '../../pages/LoginPage'
import { useRealtime } from '../realtime/useRealtime'
import { defaultCatalogSearch } from '../catalog/search'

// Paginas editoriais ficam fora do escopo: aparecem no menu, mas sem aparentar navegacao.
const editorialLinks = ['Criadores', 'Aprenda']

type AuthMode = 'login' | 'register'

export function AppShell() {
  const [accountOpen, setAccountOpen] = useState(false)
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [authOpen, setAuthOpen] = useState(false)
  const [authRedirect, setAuthRedirect] = useState('/')
  const { itemCount } = useCart()
  const { session, isAuthenticated, sessionExpired, logout } = useAuth()
  const { status: realtimeStatus } = useRealtime()
  const [announcement, setAnnouncement] = useState('')
  const [hash, setHash] = useState(() => window.location.hash)
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const realtimeAnnouncement =
    realtimeStatus === 'connected'
      ? 'Atualizacoes em tempo real conectadas.'
      : realtimeStatus === 'reconnecting'
        ? 'Reconectando atualizacoes em tempo real.'
        : ''
  const isHome = pathname === '/' && hash !== '#catalogo'
  const isMarket = pathname.startsWith('/nft/') || (pathname === '/' && hash === '#catalogo')

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  useEffect(() => {
    const handleAuthRequired = (event: Event) => {
      const detail = (event as CustomEvent<{ mode?: AuthMode; redirect?: string }>).detail
      setAuthMode(detail?.mode ?? 'login')
      setAuthRedirect(detail?.redirect ?? pathname)
      setAuthOpen(true)
    }

    window.addEventListener('kurio:auth-required', handleAuthRequired)
    return () => window.removeEventListener('kurio:auth-required', handleAuthRequired)
  }, [pathname])

  const openAuth = (mode: AuthMode) => {
    setAccountOpen(false)
    setAuthMode(mode)
    setAuthRedirect(pathname)
    setAuthOpen(true)
  }

  useEffect(() => {
    const handleRealtime = (event: Event) => {
      const detail = (event as CustomEvent<{ type?: string; outcome?: string }>).detail
      if (detail?.outcome !== 'applied') return
      if (detail.type === 'nft.updated') setAnnouncement('NFT atualizado em tempo real.')
      if (detail.type === 'order.updated') setAnnouncement('Pedido atualizado em tempo real.')
    }

    window.addEventListener('kurio:realtime', handleRealtime)
    return () => window.removeEventListener('kurio:realtime', handleRealtime)
  }, [])

  return (
    <div className="min-h-screen">
      <a
        href="#conteudo-principal"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:font-bold focus:text-[#160b08]"
      >
        Pular para o conteudo principal
      </a>
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement || realtimeAnnouncement}
      </div>
      <header className="hidden bg-[#110907]/94 backdrop-blur-xl md:sticky md:top-0 md:z-40 md:block">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between border-b border-border/70 px-4 sm:px-6 lg:px-[120px]">
          <Link to="/" search={defaultCatalogSearch} className="font-display text-sm font-bold uppercase tracking-[0.18em] text-foreground" aria-label="Kurio inicio">
            Kurio
          </Link>

          <nav className="hidden items-center gap-9 md:flex" aria-label="Navegacao principal">
            <Link
              to="/"
              search={defaultCatalogSearch}
              className={cn(
                'border-b-2 py-5 font-display text-sm font-bold transition hover:border-primary/60 hover:text-primarySoft',
                isHome ? 'border-primary text-primary' : 'border-transparent text-foreground/62',
              )}
            >
              Inicio
            </Link>
            <a href="/#catalogo" className={cn('border-b-2 py-5 font-display text-sm font-bold transition hover:border-primary/60 hover:text-primarySoft', isMarket ? 'border-primary text-primary' : 'border-transparent text-foreground/62')}>
              Mercado
            </a>
            {editorialLinks.map((label) => (
              <span key={label} className="cursor-not-allowed border-b-2 border-transparent py-5 font-display text-sm font-bold text-foreground/35" aria-disabled="true" title="Em breve">
                {label}
              </span>
            ))}
          </nav>

          <div className="hidden items-center gap-5 md:flex">
            <Link to="/" search={defaultCatalogSearch} hash="catalogo" className="text-foreground/70 hover:text-primarySoft" aria-label="Buscar no catalogo">
              <Search size={21} />
            </Link>
            <Link to="/carrinho" aria-label={`Carrinho com ${itemCount} itens`}>
              <span className="relative inline-grid size-8 place-items-center text-foreground/70 hover:text-primarySoft">
                <ShoppingCart size={21} />
                <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-primary text-[0.62rem] font-bold text-[#160b08]">
                  {itemCount}
                </span>
              </span>
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/perfil" className="font-display text-sm font-bold text-primarySoft hover:text-primary">
                  {session?.user.name}
                </Link>
                <Link to="/carteiras" className="font-display text-sm font-bold text-foreground/70 hover:text-primarySoft" activeProps={{ className: 'text-primary' }}>
                  Carteiras
                </Link>
                <Button type="button" size="sm" variant="secondary" onClick={() => void logout()}>
                  Sair
                </Button>
              </>
            ) : (
              <Link to="/login" search={{ redirect: pathname }} className={buttonVariants({ size: 'sm' })}>
                <UserRound size={15} />
                Entrar
              </Link>
            )}
          </div>
        </div>
      </header>

      {sessionExpired && !isAuthenticated && !authOpen && (
        <div role="status" className="border-b border-primary/60 bg-[#3a1d09] px-4 py-3 text-center text-sm">
          Sua sessao expirou.{' '}
          <button type="button" className="font-bold text-primarySoft underline" onClick={() => openAuth('login')}>
            Entrar novamente
          </button>
        </div>
      )}

      <main id="conteudo-principal" tabIndex={-1} className="pb-[110px] md:pb-0">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto flex h-[94px] max-w-md items-center justify-around rounded-t-[28px] bg-card px-7 text-[#dfb98c] shadow-[0_-18px_50px_rgba(0,0,0,0.3)] md:hidden" aria-label="Navegacao mobile">
        <Link to="/" search={defaultCatalogSearch} aria-label="Inicio">
          <Home size={22} className="fill-current" />
        </Link>
        <Link to="/perfil" hash="favoritos" aria-label="Favoritos">
          <Heart size={22} className="fill-current" />
        </Link>
        <Link to="/" search={defaultCatalogSearch} hash="busca" className="-mt-12 grid size-16 place-items-center rounded-full bg-[#c57d3b] text-white shadow-glow" aria-label="Buscar no catalogo">
          <Search size={26} />
        </Link>
        <Link to="/carrinho" aria-label={`Carrinho com ${itemCount} itens`} className="relative">
          <ShoppingCart size={22} className="fill-current" />
          {itemCount > 0 && <span className="absolute -right-2 -top-2 grid size-4 place-items-center rounded-full bg-primary text-[0.58rem] text-[#120906]" aria-hidden="true">{itemCount}</span>}
        </Link>
        <button type="button" aria-label="Conta" aria-haspopup="dialog" aria-expanded={accountOpen} onClick={() => setAccountOpen(true)}>
          <UserRound size={22} className="fill-current" />
        </button>
      </nav>

      {accountOpen && (
        <Dialog labelledBy="account-title" placement="bottom" onClose={() => setAccountOpen(false)} className="w-full rounded-t-[28px] bg-card px-6 pb-10 pt-6 font-mono">
          <div className="flex items-center justify-between">
            <h2 id="account-title" className="text-lg font-black">{isAuthenticated ? session?.user.name : 'Sua conta'}</h2>
            <button type="button" className="grid size-9 place-items-center rounded-full border border-border text-primarySoft" aria-label="Fechar menu da conta" onClick={() => setAccountOpen(false)}>
              <X size={18} />
            </button>
          </div>
          {isAuthenticated ? (
            <div className="mt-6 grid gap-3">
              <p className="text-sm text-[#caa677]">{session?.user.email}</p>
              <Link to="/perfil" className={buttonVariants({ variant: 'secondary' })} onClick={() => setAccountOpen(false)}>Perfil</Link>
              <Link to="/carteiras" className={buttonVariants({ variant: 'secondary' })} onClick={() => setAccountOpen(false)}>Carteiras</Link>
              <Button
                type="button"
                onClick={() => {
                  setAccountOpen(false)
                  void logout()
                }}
              >
                Sair
              </Button>
            </div>
          ) : (
            <div className="mt-6 grid gap-3">
              <p className="text-sm text-[#caa677]">Entre para acessar perfil, carteiras, favoritos e pedidos.</p>
              <Button type="button" onClick={() => openAuth('login')}>Entrar</Button>
              <Button type="button" variant="secondary" onClick={() => openAuth('register')}>Criar conta</Button>
            </div>
          )}
        </Dialog>
      )}

      <footer className="hidden bg-[#160b08] md:block">
        <div className="mx-auto max-w-[1440px] px-4 pb-10 sm:px-6 lg:px-[120px]">
          <div className="grid gap-6 border-t border-border bg-[#3a1d09] px-7 py-7 text-sm font-bold text-[#b89c85] md:grid-cols-4">
            <span className="font-display uppercase tracking-[0.14em] text-foreground">Kurio</span>
            <span>Feito para colecionadores, criadores e cultura</span>
            <span>contato@email.com</span>
            <span>+55 11 4002 8922</span>
          </div>

          <div className="grid gap-8 bg-card px-7 py-10 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Meu perfil', 'Meu perfil', 'Minha colecao', 'Atividade', 'Estudio do criador', 'Lista de interesse'],
              ['Central de ajuda', 'Central de ajuda', 'Como comprar NFTs', 'Carteira e seguranca', 'Politica do mercado', 'Denunciar item'],
              ['Colecoes', 'Arte digital', 'Fotografia', 'Musica', 'Arte 3D', 'Utilidade'],
            ].map(([title, ...items]) => (
            <div key={title}>
              <h2 className="mb-4 font-display text-base font-bold">{title}</h2>
              <ul className="grid gap-2 text-sm font-bold text-[#9b826d]">
                {items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            ))}

            <div>
              <h2 className="mb-4 font-display text-base font-bold">Redes sociais</h2>
              <div className="flex gap-2">
                {[Instagram, Search, Linkedin, Youtube].map((Icon, index) => (
                  <span key={index} className="grid size-8 place-items-center rounded-sm border border-primary text-primary">
                    <Icon size={16} />
                  </span>
                ))}
              </div>
              <h2 className="mb-4 mt-8 font-display text-base font-bold">Carteiras compativeis</h2>
              <div className="flex flex-wrap gap-2 text-[0.62rem] font-bold uppercase text-primary">
                {['Metamask', 'WalletConnect', 'Coinbase'].map((wallet) => (
                  <span key={wallet} className="rounded-sm bg-[#3a1d09] px-2 py-1">
                    {wallet}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-[#160b08] px-4 py-5 text-center text-xs font-bold text-foreground/45">
            2026 Kurio. Propriedade digital para todos.
          </div>
        </div>
      </footer>

      {authOpen && (
        <AuthModalPage
          mode={authMode}
          onModeChange={setAuthMode}
          redirect={authRedirect}
          onClose={() => setAuthOpen(false)}
        />
      )}
    </div>
  )
}
