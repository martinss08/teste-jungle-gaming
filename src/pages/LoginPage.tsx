import { Link, useNavigate } from '@tanstack/react-router'
import { api } from '../lib/api'
import { Eye, EyeOff, X } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Dialog } from '../components/ui/Dialog'
import { cn } from '../lib/utils'
import { parseApiError } from '../lib/apiError'
import { useAuth } from '../modules/auth/useAuth'
import { getAuthRedirectSearch } from '../modules/auth/redirect'
import { defaultCatalogSearch } from '../modules/catalog/search'

type AuthMode = 'login' | 'register'
type AuthField = 'name' | 'email' | 'password' | 'confirm'
type AuthErrors = Partial<Record<AuthField, string>>

export function LoginPage() {
  return <AuthModalPage mode="login" />
}

function validateAuthForm(register: boolean, values: Record<AuthField, string>): AuthErrors {
  const errors: AuthErrors = {}
  for (const field of Object.keys(values) as AuthField[]) {
    if (values[field].length > 200) errors[field] = 'Use no maximo 200 caracteres.'
  }
  if (register && (values.name.trim().length < 2 || values.name.trim().length > 60)) {
    errors.name = 'Informe de 2 a 60 caracteres.'
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = 'Informe um e-mail valido.'
  if (register ? values.password.length < 6 : !values.password) {
    errors.password = register ? 'Informe pelo menos 6 caracteres.' : 'Informe sua senha.'
  }
  if (register && values.confirm !== values.password) errors.confirm = 'As senhas precisam ser iguais.'
  return errors
}

export function AuthModalPage({
  mode,
  redirect,
  onClose,
  onSuccess,
  onModeChange,
}: {
  mode: AuthMode
  redirect?: string
  onClose?: () => void
  onSuccess?: () => void
  onModeChange?: (mode: AuthMode) => void
}) {
  const isRegister = mode === 'register'
  const authForm = useAuthForm(isRegister, redirect, onSuccess ?? onClose)
  const { sessionExpired } = useAuth()
  const navigate = useNavigate()
  const redirectValue = redirect ?? getAuthRedirectSearch().redirect
  const redirectSearch = { redirect: redirectValue }
  const title = isRegister ? 'Criar conta' : 'Entrar'
  const submitLabel = isRegister ? 'Criar conta' : 'Entrar'
  const subtitle = isRegister
    ? 'Crie sua conta para comprar NFTs, salvar favoritos e acompanhar seus pedidos.'
    : 'Entre para gerenciar sua carteira, colecao e perfil de criador.'
  const close = () => (onClose ? onClose() : void navigateFromAuthClose(navigate))
  const switchMode = (nextMode: AuthMode) => {
    if (onModeChange) onModeChange(nextMode)
  }

  return (
    <Dialog
      labelledBy="auth-title"
      onClose={close}
      className="relative w-full max-w-[414px] overflow-hidden rounded-[28px] bg-[#100805] font-mono text-[#f8ead6] shadow-[0_22px_70px_rgba(0,0,0,0.42)] md:min-h-0 md:max-w-[500px] md:rounded-b-md md:border-b-8 md:border-[#dc8f4c] md:bg-[#25120d]"
    >
      <button
        type="button"
        className="absolute right-4 top-4 z-10 grid size-9 place-items-center rounded-full border border-border bg-[#1d100b] text-[#dc8f4c] transition hover:text-primary md:border-transparent md:bg-transparent"
        aria-label="Fechar"
        onClick={close}
      >
        <X size={20} />
      </button>

      <div className="flex flex-col px-6 pb-7 pt-12 md:px-20 md:pb-12 md:pt-14">
        <div className="text-center font-display text-[2rem] font-black uppercase tracking-[0.12em] text-[#f8ead6] md:hidden">
          Kurio
        </div>
        <h2 id="auth-title" className="mt-7 text-center font-display text-xl font-black tracking-[0.08em] text-[#f8ead6] md:hidden">
          {title}
        </h2>

        <div className="hidden md:block">
          <div className="flex items-center justify-center gap-4 font-display text-xl font-black tracking-[0.08em]">
            <AuthTab mode="login" current={mode} redirectSearch={redirectSearch} onModeChange={onModeChange}>Entrar</AuthTab>
            <span className="h-6 w-px bg-[#4c261b]" aria-hidden="true" />
            <AuthTab mode="register" current={mode} redirectSearch={redirectSearch} onModeChange={onModeChange}>Criar conta</AuthTab>
          </div>
          <p className="mx-auto mt-6 max-w-[330px] text-center text-sm leading-6 tracking-[0.04em] text-[#ceb18f]">{subtitle}</p>
        </div>

        {sessionExpired && (
          <p role="status" className="mx-auto mt-6 max-w-[360px] rounded-sm border border-[#dc8f4c] bg-[#3a1d09] p-3 text-center text-sm">
            Sua sessao expirou. Entre novamente para continuar de onde parou.
          </p>
        )}

        <form key={mode} className="mt-6 grid gap-3 md:mt-7" noValidate onSubmit={authForm.handleSubmit}>
          {isRegister && <AuthModalInput name="name" label="Nome" placeholder="Nome de usuario" autoComplete="name" maxLength={60} error={authForm.errors.name} />}
          <AuthModalInput
            name="email"
            type="email"
            label="E-mail"
            placeholder={isRegister ? 'Digite seu e-mail' : 'contato@email.com'}
            autoComplete="email"
            error={authForm.errors.email}
            onBlur={isRegister ? authForm.checkEmailAvailable : undefined}
          />
          <AuthModalInput
            name="password"
            type="password"
            label="Senha"
            placeholder="Senha"
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            highlighted={!isRegister}
            error={authForm.errors.password}
          />
          {isRegister && (
            <AuthModalInput name="confirm" type="password" label="Confirmar senha" placeholder="Confirmar senha" autoComplete="new-password" error={authForm.errors.confirm} />
          )}
          {!isRegister && (
            <p className="justify-self-end pt-1 text-sm tracking-[0.04em] text-[#dc8f4c]">
              Esqueceu a senha?
            </p>
          )}

          {authForm.error && <p role="alert" className="text-sm font-semibold text-red-200">{authForm.error}</p>}

          <button
            type="submit"
            className="mt-5 h-[52px] rounded-[9px] bg-[#dc8f4c] text-base font-black tracking-[0.04em] text-[#090403] transition hover:bg-primary disabled:cursor-not-allowed disabled:opacity-70 md:mt-6 md:h-[52px]"
            disabled={authForm.isSubmitting}
          >
            {authForm.isSubmitting ? 'Aguarde...' : submitLabel}
          </button>
          {!isRegister && (
            <p className="sr-only">Conta demo: julia@greenmint.dev / greenmint</p>
          )}
        </form>

        <div className="mt-7 flex items-center gap-3 md:mx-[-5rem] md:mt-8">
          <span className="h-px flex-1 bg-[#4c261b]" />
          <span className="text-xs tracking-[0.04em] text-[#f8ead6]">Ou continue com</span>
          <span className="h-px flex-1 bg-[#4c261b]" />
        </div>

        <div className="mt-4 grid gap-3">
          <button type="button" className="flex h-10 items-center justify-center gap-4 rounded-[5px] border border-[#4c261b] bg-transparent text-sm font-black tracking-[0.04em] text-[#ceb18f] transition hover:border-[#dc8f4c]">
            <GoogleMark />
            Continuar com Google
          </button>
          <button type="button" className="flex h-10 items-center justify-center gap-4 rounded-[5px] border border-[#4c261b] bg-transparent text-sm font-black tracking-[0.04em] text-[#ceb18f] transition hover:border-[#dc8f4c]">
            <FacebookMark />
            Continuar com Facebook
          </button>
        </div>

        <div className="mt-7 text-center text-sm tracking-[0.04em] text-[#ceb18f] md:hidden">
          {isRegister ? (
            <>
              Ja tem uma conta?{' '}
              {onModeChange ? (
                <button type="button" className="text-[#f8ead6] transition hover:text-[#dc8f4c]" onClick={() => switchMode('login')}>
                  Entre
                </button>
              ) : (
                <Link to="/login" search={redirectSearch} className="text-[#f8ead6] transition hover:text-[#dc8f4c]">
                  Entre
                </Link>
              )}
            </>
          ) : (
            <>
              Novo na Kurio?{' '}
              {onModeChange ? (
                <button type="button" className="text-[#f8ead6] transition hover:text-[#dc8f4c]" onClick={() => switchMode('register')}>
                  Crie uma conta
                </button>
              ) : (
                <Link to="/cadastro" search={redirectSearch} className="text-[#f8ead6] transition hover:text-[#dc8f4c]">
                  Crie uma conta
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </Dialog>
  )
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="size-5 shrink-0" aria-hidden="true" focusable="false">
      <path fill="#4285f4" d="M45.1 24.5c0-1.6-.1-3.2-.4-4.7H24v8.9h11.8c-.5 2.7-2 5-4.4 6.6v5.5h7.1c4.1-3.8 6.6-9.4 6.6-16.3z" />
      <path fill="#34a853" d="M24 46c5.9 0 10.9-2 14.5-5.2l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H4.5v5.7C8.1 41.3 15.5 46 24 46z" />
      <path fill="#fbbc05" d="M11.8 28.4c-.4-1.3-.7-2.7-.7-4.4s.3-3 .7-4.4v-5.7H4.5C2.9 17 2 20.4 2 24s.9 7 2.5 10.1l7.3-5.7z" />
      <path fill="#ea4335" d="M24 10.6c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 4.1 29.9 2 24 2 15.5 2 8.1 6.7 4.5 13.9l7.3 5.7c1.7-5.2 6.5-9 12.2-9z" />
    </svg>
  )
}

function FacebookMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 shrink-0" aria-hidden="true" focusable="false">
      <path
        fill="#4267b2"
        d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12z"
      />
    </svg>
  )
}

function AuthTab({
  mode,
  current,
  redirectSearch,
  onModeChange,
  children,
}: {
  mode: AuthMode
  current: AuthMode
  redirectSearch: { redirect: string }
  onModeChange?: (mode: AuthMode) => void
  children: string
}) {
  const isCurrent = mode === current
  const className = cn('transition', isCurrent ? 'text-[#dc8f4c]' : 'text-[#f8ead6] hover:text-[#dc8f4c]')

  if (isCurrent) return <span className={className} aria-current="page">{children}</span>
  if (onModeChange) {
    return (
      <button type="button" className={className} onClick={() => onModeChange(mode)}>
        {children}
      </button>
    )
  }
  return (
    <Link to={mode === 'register' ? '/cadastro' : '/login'} search={redirectSearch} className={className}>
      {children}
    </Link>
  )
}

function AuthModalInput({
  name,
  label,
  placeholder,
  type = 'text',
  autoComplete,
  highlighted = false,
  maxLength = 200,
  error,
  onBlur,
}: {
  name: AuthField
  label: string
  placeholder: string
  type?: string
  autoComplete?: string
  highlighted?: boolean
  maxLength?: number
  error?: string
  onBlur?: (value: string) => void
}) {
  const [visible, setVisible] = useState(false)
  const isPassword = type === 'password'
  const id = `auth-${name}`

  return (
    <div>
      <label htmlFor={id} className="sr-only">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={isPassword && visible ? 'text' : type}
          name={name}
          maxLength={maxLength}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          onBlur={onBlur ? (event) => onBlur(event.target.value) : undefined}
          className={cn(
            'h-[50px] w-full rounded-[9px] border border-[#4c261b] bg-transparent px-4 text-sm tracking-[0.04em] text-[#f8ead6] placeholder:text-[#b9966d] outline-none focus:border-[#dc8f4c] aria-[invalid=true]:border-red-400 md:h-11 md:rounded-[5px]',
            highlighted && 'border-[#dc8f4c]',
            isPassword && 'pr-11',
          )}
        />
        {isPassword && (
          <button
            type="button"
            className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center text-[#b9966d] hover:text-[#dc8f4c]"
            aria-label={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
            aria-pressed={visible}
            onClick={() => setVisible((value) => !value)}
          >
            {visible ? <Eye size={19} /> : <EyeOff size={19} />}
          </button>
        )}
      </div>
      {error && <p id={`${id}-error`} className="mt-1 text-xs font-semibold text-red-200">{error}</p>}
    </div>
  )
}

function useAuthForm(register: boolean, redirectOverride?: string, onSuccess?: () => void) {
  const navigate = useNavigate()
  const { login, register: registerUser } = useAuth()
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<AuthErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const values = {
      name: String(form.get('name') ?? ''),
      email: String(form.get('email') ?? ''),
      password: String(form.get('password') ?? ''),
      confirm: String(form.get('confirm') ?? ''),
    }
    const nextErrors = validateAuthForm(register, values)
    setErrors(nextErrors)
    setError(Object.keys(nextErrors).length ? 'Verifique os campos destacados.' : '')
    if (Object.keys(nextErrors).length) return

    setIsSubmitting(true)
    try {
      if (register) await registerUser(values.name.trim(), values.email.trim(), values.password)
      else await login(values.email.trim(), values.password)
      if (onSuccess) onSuccess()
      else await navigateToRedirect(navigate, redirectOverride)
    } catch (err) {
      const parsed = parseApiError(err, 'Nao foi possivel concluir a acao.')
      setErrors(parsed.fields as AuthErrors)
      setError(parsed.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Aviso antecipado: o cadastro continua validando o conflito no envio (409).
  const checkEmailAvailable = async (value: string) => {
    const email = value.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return
    try {
      const { data } = await api.get<{ available: boolean }>('/auth/email-available', { params: { email } })
      setErrors((current) => ({ ...current, email: data.available ? undefined : 'E-mail ja cadastrado.' }))
    } catch {
      // Sem conexao a checagem e ignorada; o envio ainda trata o conflito.
    }
  }

  return { handleSubmit, error, errors, isSubmitting, checkEmailAvailable }
}

async function navigateToRedirect(navigate: ReturnType<typeof useNavigate>, redirectOverride?: string) {
  const redirect = redirectOverride ?? new URLSearchParams(window.location.search).get('redirect') ?? '/'
  const path = redirect.split('?')[0]
  const search = redirect.includes('?') ? Object.fromEntries(new URLSearchParams(redirect.split('?')[1])) : undefined

  if (path === '/pagamento') return navigate({ to: '/pagamento', search })
  if (path === '/confirmacao') return navigate({ to: '/confirmacao', search: { pedido: search?.pedido ?? '' } })
  if (path === '/perfil') return navigate({ to: '/perfil', search })
  if (path === '/carteiras') return navigate({ to: '/carteiras', search })
  if (path === '/carrinho') return navigate({ to: '/carrinho', search })
  if (path.startsWith('/nft/')) return navigate({ to: '/nft/$nftId', params: { nftId: path.replace('/nft/', '') } })
  return navigate({ to: '/', search: defaultCatalogSearch })
}

async function navigateFromAuthClose(navigate: ReturnType<typeof useNavigate>) {
  const redirect = new URLSearchParams(window.location.search).get('redirect') || '/'

  if (redirect.startsWith('/nft/')) {
    return navigate({ to: '/nft/$nftId', params: { nftId: redirect.replace('/nft/', '').split('?')[0] } })
  }

  if (redirect === '/carrinho') return navigate({ to: '/carrinho' })

  return navigate({ to: '/', search: defaultCatalogSearch })
}
