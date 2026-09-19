import { Link, useNavigate } from '@tanstack/react-router'
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

// Mesmas regras do servidor; a API continua sendo a validacao final.
function validateAuthForm(register: boolean, values: Record<AuthField, string>): AuthErrors {
  const errors: AuthErrors = {}
  if (register && values.name.trim().length < 2) errors.name = 'Informe pelo menos 2 caracteres.'
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
  const close = () => (onClose ? onClose() : void navigateFromAuthClose(navigate))

  return (
    <Dialog
      labelledBy="auth-title"
      onClose={close}
      className="relative w-full max-w-[500px] overflow-hidden rounded-b-md border-b-8 border-[#dc8f4c] bg-[#25120d] font-mono text-[#f8ead6] shadow-[0_22px_70px_rgba(0,0,0,0.42)]"
    >
      <button
        type="button"
        className="absolute right-3 top-3 grid size-8 place-items-center text-[#dc8f4c] transition hover:text-primary"
        aria-label="Fechar"
        onClick={close}
      >
        <X size={20} />
      </button>

      <div className="px-6 pb-16 pt-12 sm:px-20">
        <h2 id="auth-title" className="sr-only">{title}</h2>
        <div className="flex justify-center text-[1.35rem] font-black tracking-[0.08em]">
          {onModeChange ? (
            <button type="button" className={cn(!isRegister ? 'text-[#dc8f4c]' : 'text-[#f8ead6]')} aria-pressed={!isRegister} onClick={() => onModeChange('login')}>
              Entrar
            </button>
          ) : (
            <Link to="/login" search={redirectSearch} className={cn(!isRegister ? 'text-[#dc8f4c]' : 'text-[#f8ead6]')} aria-current={!isRegister ? 'page' : undefined}>
              Entrar
            </Link>
          )}
          <span className="px-2 text-[#f8ead6]" aria-hidden="true">|</span>
          {onModeChange ? (
            <button type="button" className={cn(isRegister ? 'text-[#dc8f4c]' : 'text-[#f8ead6]')} aria-pressed={isRegister} onClick={() => onModeChange('register')}>
              Criar conta
            </button>
          ) : (
            <Link to="/cadastro" search={redirectSearch} className={cn(isRegister ? 'text-[#dc8f4c]' : 'text-[#f8ead6]')} aria-current={isRegister ? 'page' : undefined}>
              Criar conta
            </Link>
          )}
        </div>

        {sessionExpired && (
          <p role="status" className="mx-auto mt-6 max-w-[360px] rounded-sm border border-[#dc8f4c] bg-[#3a1d09] p-3 text-center text-sm">
            Sua sessao expirou. Entre novamente para continuar de onde parou.
          </p>
        )}

        <p className="mx-auto mt-9 max-w-[360px] text-center text-sm leading-5 tracking-[0.04em] text-[#f8ead6]">
          {isRegister
            ? 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.'
            : 'Entre para gerenciar sua carteira, colecao e perfil de criador.'}
        </p>

        <form key={mode} className="mt-7 grid gap-3" noValidate onSubmit={authForm.handleSubmit}>
          {isRegister && <AuthModalInput name="name" label="Nome" placeholder="Nome de usuario" autoComplete="name" error={authForm.errors.name} />}
          <AuthModalInput
            name="email"
            type="email"
            label="E-mail"
            placeholder={isRegister ? 'Digite seu e-mail' : 'contato@email.com'}
            autoComplete="email"
            error={authForm.errors.email}
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
            <p className="justify-self-end pt-1 text-xs tracking-[0.04em] text-[#b9966d]">
              Recuperacao de senha indisponivel na simulacao.
            </p>
          )}

          {authForm.error && <p role="alert" className="text-sm font-semibold text-red-200">{authForm.error}</p>}

          <button
            type="submit"
            className="mt-5 h-[45px] rounded-[6px] bg-[#dc8f4c] text-base font-black tracking-[0.04em] text-[#090403] transition hover:bg-primary disabled:cursor-not-allowed disabled:opacity-70 sm:mt-6"
            disabled={authForm.isSubmitting}
          >
            {authForm.isSubmitting ? 'Aguarde...' : title}
          </button>
          {!isRegister && (
            <p className="text-center text-xs text-[#b9966d]">Conta demo: julia@greenmint.dev / greenmint</p>
          )}
        </form>

        <div className="mx-[-1.5rem] mt-7 flex items-center gap-3 sm:mx-[-5rem]">
          <span className="h-px flex-1 bg-[#4c261b]" />
          <span className="text-xs tracking-[0.04em] text-[#f8ead6]">Ou continue com</span>
          <span className="h-px flex-1 bg-[#4c261b]" />
        </div>

        <div className="mt-5 grid gap-4">
          <button type="button" disabled aria-describedby="social-login-note" className="flex h-10 items-center justify-center gap-4 rounded-[5px] border border-[#4c261b] bg-transparent text-sm font-black tracking-[0.04em] text-[#ceb18f] disabled:cursor-not-allowed disabled:opacity-60">
            <span className="text-xl font-black text-[#4285f4]" aria-hidden="true">G</span>
            Continuar com Google
          </button>
          <button type="button" disabled aria-describedby="social-login-note" className="flex h-10 items-center justify-center gap-4 rounded-[5px] border border-[#4c261b] bg-transparent text-sm font-black tracking-[0.04em] text-[#ceb18f] disabled:cursor-not-allowed disabled:opacity-60">
            <span className="text-2xl font-black text-[#4267b2]" aria-hidden="true">f</span>
            Continuar com Facebook
          </button>
          <p id="social-login-note" className="text-center text-xs text-[#b9966d]">Login social indisponivel na simulacao.</p>
        </div>
      </div>
    </Dialog>
  )
}

function AuthModalInput({
  name,
  label,
  placeholder,
  type = 'text',
  autoComplete,
  highlighted = false,
  error,
}: {
  name: AuthField
  label: string
  placeholder: string
  type?: string
  autoComplete?: string
  highlighted?: boolean
  error?: string
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
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            'h-10 w-full rounded-[5px] border border-[#4c261b] bg-transparent px-4 text-sm tracking-[0.04em] text-[#f8ead6] placeholder:text-[#b9966d] outline-none focus:border-[#dc8f4c] aria-[invalid=true]:border-red-400',
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

  return { handleSubmit, error, errors, isSubmitting }
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
