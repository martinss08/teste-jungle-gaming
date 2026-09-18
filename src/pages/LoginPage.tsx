import { Link } from '@tanstack/react-router'
import { EyeOff } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input, Label } from '../components/ui/Field'
import { cn } from '../lib/utils'

export function LoginPage() {
  return (
    <>
      <MobileAuthShell title="Entrar" footer="Novo na Kurio? Crie uma conta" footerTo="/cadastro" submitLabel="Entrar" />

      <div className="hidden md:block">
        <AuthLayout title="Entrar na conta" subtitle="Retome carrinho, favoritos e pedidos recentes.">
          <form className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="julia@greenmint.dev" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" defaultValue="greenmint" />
            </div>
            <Button type="button" size="lg">Entrar</Button>
          </form>
          <p className="mt-5 text-center text-sm text-foreground/60">
            Ainda nao tem conta?{' '}
            <Link to="/cadastro" className="font-semibold text-primarySoft hover:underline">
              Criar cadastro
            </Link>
          </p>
        </AuthLayout>
      </div>
    </>
  )
}

export function MobileAuthShell({
  title,
  submitLabel,
  footer,
  footerTo,
  register = false,
}: {
  title: string
  submitLabel: string
  footer: string
  footerTo: '/login' | '/cadastro'
  register?: boolean
}) {
  return (
    <div className="min-h-screen bg-[#120906] px-7 pb-8 pt-[132px] font-mono text-[#f8ead6] md:hidden">
      <Link to="/" search={{ q: '', rarity: 'todos', sort: 'recentes', page: 1 }} className="mx-auto block w-max text-[2rem] font-black tracking-[0.16em]">
        KURIO
      </Link>

      <h1 className={cn('mt-[86px] text-center font-black tracking-[0.08em]', register ? 'whitespace-nowrap text-base' : 'text-[1.35rem]')}>
        {title}
      </h1>

      <form className="mt-9 grid gap-3">
        {register && (
          <MobileAuthInput placeholder="Nome de usuario" centered />
        )}
        <MobileAuthInput placeholder={register ? 'Digite seu e-mail' : 'contato@email.com'} type="email" />
        <MobileAuthInput placeholder={register ? 'Senha' : '***********'} type="password" highlighted={!register} />
        {register && <MobileAuthInput placeholder="Confirmar senha" type="password" />}
        {!register && (
          <button type="button" className="justify-self-end text-sm font-bold tracking-[0.06em] text-primarySoft">
            Esqueceu a senha?
          </button>
        )}
        <button type="button" className="mt-7 h-[60px] rounded-[9px] bg-[#dc8f4c] text-base font-black tracking-[0.08em] text-[#120906]">
          {submitLabel}
        </button>
      </form>

      <div className="mt-10 flex items-center gap-3 text-xs tracking-[0.04em]">
        <span className="h-px flex-1 bg-border" />
        <span>Ou continue com</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="mt-4 grid gap-4 text-sm font-bold text-[#ceb18f]">
        <button type="button" className="flex h-10 items-center justify-center gap-4 rounded-md border border-border bg-transparent">
          <span className="text-xl font-black text-[#4285f4]">G</span>
          Continuar com Google
        </button>
        <button type="button" className="flex h-10 items-center justify-center gap-4 rounded-md border border-border bg-transparent">
          <span className="text-2xl font-black text-[#4267b2]">f</span>
          Continuar com Facebook
        </button>
      </div>

      <Link to={footerTo} className="mt-10 block text-center text-sm tracking-[0.07em] text-[#ceb18f]">
        {footer}
      </Link>
    </div>
  )
}

function MobileAuthInput({
  placeholder,
  type = 'text',
  highlighted = false,
  centered = false,
}: {
  placeholder: string
  type?: string
  highlighted?: boolean
  centered?: boolean
}) {
  const isPassword = type === 'password'

  return (
    <label className="relative block">
      <input
        type={type}
        placeholder={placeholder}
        className={cn(
          'h-[50px] w-full rounded-[9px] border border-border bg-transparent px-4 text-sm tracking-[0.06em] text-foreground placeholder:text-[#b9966d] outline-none',
          highlighted && 'border-primary',
          centered && 'text-center placeholder:text-center',
          isPassword && 'pr-11',
        )}
      />
      {isPassword && <EyeOff className="absolute right-4 top-1/2 -translate-y-1/2 text-[#70402a]" size={18} />}
    </label>
  )
}

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto grid min-h-[calc(100vh-8rem)] max-w-6xl place-items-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid w-full gap-8 lg:grid-cols-[1fr_420px] lg:items-center">
        <div className="hidden lg:block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primarySoft">GreenMint</span>
          <h1 className="mt-3 max-w-xl font-display text-5xl font-bold leading-tight">
            Um fluxo de conta preparado para checkout protegido.
          </h1>
          <p className="mt-5 max-w-lg leading-7 text-foreground/60">
            Nesta primeira fase, os formularios representam o desenho e os estados base. A validacao com API simulada entra nas proximas fases.
          </p>
        </div>
        <Card className="p-6">
          <h1 className="font-display text-3xl font-bold">{title}</h1>
          <p className="mt-2 text-sm text-foreground/60">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </Card>
      </div>
    </div>
  )
}
