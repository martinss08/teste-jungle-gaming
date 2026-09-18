import { Link, useNavigate } from '@tanstack/react-router'
import { EyeOff } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import axios from 'axios'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input, Label } from '../components/ui/Field'
import { cn } from '../lib/utils'
import { useAuth } from '../modules/auth/useAuth'
import type { ApiErrorResponse } from '../contracts/api'

export function LoginPage() {
  const loginForm = useAuthForm(false)

  return (
    <>
      <MobileAuthShell title="Entrar" footer="Novo na Kurio? Crie uma conta" footerTo="/cadastro" submitLabel="Entrar" />

      <div className="hidden md:block">
        <AuthLayout title="Entrar na conta" subtitle="Retome carrinho, favoritos e pedidos recentes.">
          <form className="grid gap-4" onSubmit={loginForm.handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue="julia@greenmint.dev" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" name="password" type="password" defaultValue="greenmint" />
            </div>
            {loginForm.error && <p className="text-sm font-semibold text-red-200">{loginForm.error}</p>}
            <Button type="submit" size="lg" disabled={loginForm.isSubmitting}>
              {loginForm.isSubmitting ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-foreground/60">
            Ainda nao tem conta?{' '}
            <Link to="/cadastro" search={{ redirect: '/' }} className="font-semibold text-primarySoft hover:underline">
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
  const authForm = useAuthForm(register)

  return (
    <div className="min-h-screen bg-[#120906] px-7 pb-8 pt-[132px] font-mono text-[#f8ead6] md:hidden">
      <Link to="/" search={{ q: '', rarity: 'todos', sort: 'recentes', page: 1 }} className="mx-auto block w-max text-[2rem] font-black tracking-[0.16em]">
        KURIO
      </Link>

      <h1 className={cn('mt-[86px] text-center font-black tracking-[0.08em]', register ? 'whitespace-nowrap text-base' : 'text-[1.35rem]')}>
        {title}
      </h1>

      <form className="mt-9 grid gap-3" onSubmit={authForm.handleSubmit}>
        {register && (
          <MobileAuthInput name="name" placeholder="Nome de usuario" centered />
        )}
        <MobileAuthInput name="email" placeholder={register ? 'Digite seu e-mail' : 'contato@email.com'} type="email" defaultValue={register ? undefined : 'julia@greenmint.dev'} />
        <MobileAuthInput name="password" placeholder={register ? 'Senha' : '***********'} type="password" highlighted={!register} defaultValue={register ? undefined : 'greenmint'} />
        {register && <MobileAuthInput name="confirm" placeholder="Confirmar senha" type="password" />}
        {!register && (
          <button type="button" className="justify-self-end text-sm font-bold tracking-[0.06em] text-primarySoft">
            Esqueceu a senha?
          </button>
        )}
        {authForm.error && <p className="text-sm font-semibold text-red-200">{authForm.error}</p>}
        <button type="submit" className="mt-7 h-[60px] rounded-[9px] bg-[#dc8f4c] text-base font-black tracking-[0.08em] text-[#120906]" disabled={authForm.isSubmitting}>
          {authForm.isSubmitting ? 'Aguarde...' : submitLabel}
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

      <Link to={footerTo} search={{ redirect: '/' }} className="mt-10 block text-center text-sm tracking-[0.07em] text-[#ceb18f]">
        {footer}
      </Link>
    </div>
  )
}

function MobileAuthInput({
  name,
  placeholder,
  type = 'text',
  highlighted = false,
  centered = false,
  defaultValue,
}: {
  name: string
  placeholder: string
  type?: string
  highlighted?: boolean
  centered?: boolean
  defaultValue?: string
}) {
  const isPassword = type === 'password'

  return (
    <label className="relative block">
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        defaultValue={defaultValue}
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

export function useAuthForm(register: boolean) {
  const navigate = useNavigate()
  const { login, register: registerUser } = useAuth()
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    const form = new FormData(event.currentTarget)
    const name = String(form.get('name') ?? '').trim()
    const email = String(form.get('email') ?? '').trim()
    const password = String(form.get('password') ?? '')
    const confirm = String(form.get('confirm') ?? '')

    try {
      if (register) {
        if (password !== confirm) {
          setError('As senhas precisam ser iguais.')
          return
        }
        await registerUser(name, email, password)
      } else {
        await login(email, password)
      }
      await navigateToRedirect(navigate)
    } catch (err) {
      setError(readApiError(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return { handleSubmit, error, isSubmitting }
}

async function navigateToRedirect(navigate: ReturnType<typeof useNavigate>) {
  const redirect = new URLSearchParams(window.location.search).get('redirect') || '/'
  const path = redirect.split('?')[0]
  const search = redirect.includes('?') ? Object.fromEntries(new URLSearchParams(redirect.split('?')[1])) : undefined

  if (path === '/pagamento') return navigate({ to: '/pagamento', search })
  if (path === '/confirmacao') return navigate({ to: '/confirmacao', search })
  if (path === '/perfil') return navigate({ to: '/perfil', search })
  if (path === '/carteiras') return navigate({ to: '/carteiras', search })
  if (path === '/carrinho') return navigate({ to: '/carrinho', search })
  return navigate({ to: '/', search: { q: '', rarity: 'todos', sort: 'recentes', page: 1 } })
}

function readApiError(error: unknown) {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data.error.message ?? 'Nao foi possivel concluir a acao.'
  }
  return 'Nao foi possivel concluir a acao.'
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
