import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { EyeOff, Instagram, Linkedin, Menu, Search, ShoppingCart, UserRound, X, Youtube } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { useCart } from '../cart/useCart'
import { cn } from '../../lib/utils'
import { useAuth } from '../auth/useAuth'

const links = [
  { to: '/', label: 'Inicio' },
  { to: '/perfil', label: 'Criadores' },
  { to: '/carteiras', label: 'Aprenda' },
] as const

const homeSearch = { q: '', rarity: 'todos', sort: 'recentes', page: 1 }
type AuthMode = 'login' | 'register'

function AuthModal({
  mode,
  onModeChange,
  onClose,
}: {
  mode: AuthMode
  onModeChange: (mode: AuthMode) => void
  onClose: () => void
}) {
  const isLogin = mode === 'login'

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#080403]/70 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={isLogin ? 'Entrar' : 'Criar conta'}>
      <div className="relative w-full max-w-[500px] overflow-hidden rounded-b-md border-b-8 border-primary bg-card shadow-glow">
        <button
          type="button"
          className="absolute right-4 top-4 grid size-8 place-items-center text-primarySoft transition hover:text-primary"
          onClick={onClose}
          aria-label="Fechar modal"
        >
          <X size={22} />
        </button>

        <div className="px-10 pb-10 pt-12 sm:px-20">
          <div className="flex justify-center font-display text-2xl font-bold tracking-[0.08em]">
            <button
              type="button"
              className={isLogin ? 'text-primary' : 'text-foreground'}
              onClick={() => onModeChange('login')}
            >
              Entrar
            </button>
            <span className="px-2 text-[#9b826d]">|</span>
            <button
              type="button"
              className={!isLogin ? 'text-primary' : 'text-foreground'}
              onClick={() => onModeChange('register')}
            >
              Criar conta
            </button>
          </div>

          <p className="mx-auto mt-9 max-w-[360px] text-center font-display text-sm leading-6 text-foreground">
            {isLogin
              ? 'Entre para gerenciar sua carteira, colecao e perfil de criador.'
              : 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.'}
          </p>

          <form key={mode} className="mt-6 grid gap-3">
            {!isLogin && (
              <input
                className="h-10 rounded-md border border-border bg-[#23110c] px-4 font-display text-sm text-foreground placeholder:text-[#a98461] outline-none focus:border-primary"
                placeholder="Nome de usuario"
              />
            )}
            <input
              className="h-10 rounded-md border border-border bg-[#23110c] px-4 font-display text-sm text-foreground placeholder:text-[#a98461] outline-none focus:border-primary"
              type="email"
              defaultValue={isLogin ? 'contato@email.com' : undefined}
              placeholder={isLogin ? 'contato@email.com' : 'Digite seu e-mail'}
            />
            <div className="relative">
              <input
                className="h-10 w-full rounded-md border border-primary bg-[#23110c] px-4 pr-11 font-display text-sm text-foreground placeholder:text-[#a98461] outline-none"
                type="password"
                defaultValue={isLogin ? 'kurioaccess' : undefined}
                placeholder="Senha"
              />
              <EyeOff className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#a98461]" size={20} />
            </div>
            {!isLogin && (
              <input
                className="h-10 rounded-md border border-border bg-[#23110c] px-4 font-display text-sm text-foreground placeholder:text-[#a98461] outline-none focus:border-primary"
                type="password"
                placeholder="Confirmar senha"
              />
            )}
            {isLogin && (
              <button type="button" className="mt-1 self-end font-display text-sm text-primarySoft hover:text-primary">
                Esqueceu a senha?
              </button>
            )}
            <Button type="button" className="mt-5 h-[45px] w-full font-display text-lg">
              {isLogin ? 'Entrar' : 'Criar conta'}
            </Button>
          </form>

          <div className="mt-7 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="font-display text-sm text-foreground">Ou continue com</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="mt-4 grid gap-3">
            <button type="button" className="flex h-10 items-center justify-center gap-4 rounded-md border border-border bg-[#23110c] font-display text-sm text-[#ccb59d]">
              <span className="text-xl font-bold text-[#4285f4]">G</span>
              Continuar com Google
            </button>
            <button type="button" className="flex h-10 items-center justify-center gap-4 rounded-md border border-border bg-[#23110c] font-display text-sm text-[#ccb59d]">
              <span className="text-2xl font-bold text-[#4267b2]">f</span>
              Continuar com Facebook
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AppShell() {
  const [open, setOpen] = useState(false)
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [authOpen, setAuthOpen] = useState(false)
  const { itemCount } = useCart()
  const { session, isAuthenticated, logout } = useAuth()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const isMarket = pathname.startsWith('/nft/')

  return (
    <div className="min-h-screen">
      <header className="hidden bg-[#110907]/94 backdrop-blur-xl md:sticky md:top-0 md:z-40 md:block">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between border-b border-border/70 px-4 sm:px-6 lg:px-[120px]">
          <Link to="/" search={homeSearch} className="font-display text-sm font-bold uppercase tracking-[0.18em] text-foreground" aria-label="Kurio inicio">
            Kurio
          </Link>

          <nav className="hidden items-center gap-9 md:flex" aria-label="Navegacao principal">
            <Link
              to="/"
              search={homeSearch}
              className="border-b-2 border-transparent py-5 font-display text-sm font-bold text-foreground/62 transition hover:text-primarySoft"
              activeProps={{ className: 'border-primary text-primary' }}
            >
              Inicio
            </Link>
            <a href="/#catalogo" className={cn('border-b-2 py-5 font-display text-sm font-bold transition hover:text-primarySoft', isMarket ? 'border-primary text-primary' : 'border-transparent text-foreground/62')}>
              Mercado
            </a>
            {links.slice(1).map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="border-b-2 border-transparent py-5 font-display text-sm font-bold text-foreground/62 transition hover:text-primarySoft"
                activeProps={{ className: 'border-primary text-primary' }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-5 md:flex">
            <button type="button" className="text-foreground/70 hover:text-primarySoft" aria-label="Buscar">
              <Search size={21} />
            </button>
            <Link to="/carrinho">
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
                <Button type="button" size="sm" variant="secondary" onClick={() => void logout()}>
                  Sair
                </Button>
              </>
            ) : (
              <Link to="/login" search={{ redirect: pathname }}>
                <Button type="button" size="sm">
                  <UserRound size={15} />
                  Entrar
                </Button>
              </Link>
            )}
          </div>

          <button
            className="grid size-10 place-items-center rounded-md border border-border md:hidden"
            type="button"
            aria-label="Abrir menu"
            onClick={() => setOpen((value) => !value)}
          >
            <Menu size={20} />
          </button>
        </div>
        <div className={cn('border-t border-border bg-[#110907] px-4 py-3 md:hidden', !open && 'hidden')}>
          <nav className="grid gap-2">
            <Link
              to="/"
              search={homeSearch}
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              Inicio
            </Link>
            <a
              href="/#catalogo"
              className={cn('rounded-md px-3 py-2 text-sm font-medium hover:bg-muted', isMarket ? 'text-primary' : 'text-foreground/80')}
              onClick={() => setOpen(false)}
            >
              Mercado
            </a>
            {links.slice(1).map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <Button type="button" variant="secondary" className="w-full" onClick={() => void logout()}>
                Sair
              </Button>
            ) : (
              <Link to="/login" search={{ redirect: pathname }} onClick={() => setOpen(false)}>
                <Button type="button" variant="secondary" className="w-full">
                  <UserRound size={16} />
                  Entrar ou cadastrar
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

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
        <AuthModal
          mode={authMode}
          onModeChange={setAuthMode}
          onClose={() => setAuthOpen(false)}
        />
      )}
    </div>
  )
}
