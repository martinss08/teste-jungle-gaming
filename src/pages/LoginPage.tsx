import { Link, useNavigate } from '@tanstack/react-router'
import { EyeOff, X } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import { cn } from '../lib/utils'
import { useAuth } from '../modules/auth/useAuth'
import type { ApiErrorResponse } from '../contracts/api'
import { getAuthRedirectSearch } from '../modules/auth/redirect'

type AuthMode = 'login' | 'register'

export function LoginPage() {
  return <AuthModalPage mode="login" />
}

export function AuthModalPage({
  mode,
  redirect,
  onClose,
  onModeChange,
}: {
  mode: AuthMode
  redirect?: string
  onClose?: () => void
  onModeChange?: (mode: AuthMode) => void
}) {
  const isRegister = mode === 'register'
  const authForm = useAuthForm(isRegister, redirect, onClose)
  const navigate = useNavigate()
  const redirectValue = redirect ?? getAuthRedirectSearch().redirect
  const redirectSearch = { redirect: redirectValue }
  const title = isRegister ? 'Criar conta' : 'Entrar'

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  return createPortal((
    <div className="fixed inset-0 z-50 grid min-h-screen place-items-center overflow-y-auto bg-[#080403]/72 px-4 py-6 font-mono text-[#f8ead6] backdrop-blur-sm">
      <div className="relative w-full max-w-[500px] overflow-hidden rounded-b-md border-b-8 border-[#dc8f4c] bg-[#25120d] shadow-[0_22px_70px_rgba(0,0,0,0.42)]">
        <button
          type="button"
          className="absolute right-3 top-3 grid size-8 place-items-center text-[#dc8f4c] transition hover:text-primary"
          aria-label="Fechar"
          onClick={() => {
            if (onClose) {
              onClose()
              return
            }

            void navigateFromAuthClose(navigate)
          }}
        >
          <X size={20} />
        </button>

        <div className="px-6 pb-16 pt-12 sm:px-20">
          <div className="flex justify-center text-[1.35rem] font-black tracking-[0.08em]">
            {onModeChange ? (
              <button type="button" className={cn(!isRegister ? 'text-[#dc8f4c]' : 'text-[#f8ead6]')} onClick={() => onModeChange('login')}>
                Entrar
              </button>
            ) : (
              <Link to="/login" search={redirectSearch} className={cn(!isRegister ? 'text-[#dc8f4c]' : 'text-[#f8ead6]')}>
                Entrar
              </Link>
            )}
            <span className="px-2 text-[#f8ead6]">|</span>
            {onModeChange ? (
              <button type="button" className={cn(isRegister ? 'text-[#dc8f4c]' : 'text-[#f8ead6]')} onClick={() => onModeChange('register')}>
                Criar conta
              </button>
            ) : (
              <Link to="/cadastro" search={redirectSearch} className={cn(isRegister ? 'text-[#dc8f4c]' : 'text-[#f8ead6]')}>
                Criar conta
              </Link>
            )}
          </div>

          <p className="mx-auto mt-9 max-w-[360px] text-center text-sm leading-5 tracking-[0.04em] text-[#f8ead6]">
            {isRegister
              ? 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.'
              : 'Entre para gerenciar sua carteira, colecao e perfil de criador.'}
          </p>

          <form className="mt-7 grid gap-3" onSubmit={authForm.handleSubmit}>
            {isRegister && <AuthModalInput name="name" placeholder="Nome de usuario" />}
            <AuthModalInput
              name="email"
              type="email"
              placeholder={isRegister ? 'Digite seu e-mail' : 'contato@email.com'}
              defaultValue={isRegister ? undefined : 'julia@greenmint.dev'}
            />
            <AuthModalInput
              name="password"
              type="password"
              placeholder="Senha"
              defaultValue={isRegister ? undefined : 'greenmint'}
              highlighted={!isRegister}
            />
            {isRegister && <AuthModalInput name="confirm" type="password" placeholder="Confirmar senha" />}
            {!isRegister && (
              <button type="button" className="justify-self-end pt-1 text-sm font-black tracking-[0.04em] text-[#dc8f4c] hover:text-primary">
                Esqueceu a senha?
              </button>
            )}

            {authForm.error && <p className="text-sm font-semibold text-red-200">{authForm.error}</p>}

            <button
              type="submit"
              className="mt-5 h-[45px] rounded-[6px] bg-[#dc8f4c] text-base font-black tracking-[0.04em] text-[#090403] transition hover:bg-primary disabled:cursor-not-allowed disabled:opacity-70 sm:mt-6"
              disabled={authForm.isSubmitting}
            >
              {authForm.isSubmitting ? 'Aguarde...' : title}
            </button>
          </form>

          <div className="mx-[-1.5rem] mt-7 flex items-center gap-3 sm:mx-[-5rem]">
            <span className="h-px flex-1 bg-[#4c261b]" />
            <span className="text-xs tracking-[0.04em] text-[#f8ead6]">Ou continue com</span>
            <span className="h-px flex-1 bg-[#4c261b]" />
          </div>

          <div className="mt-5 grid gap-4">
            <button type="button" className="flex h-10 items-center justify-center gap-4 rounded-[5px] border border-[#4c261b] bg-transparent text-sm font-black tracking-[0.04em] text-[#ceb18f]">
              <span className="text-xl font-black text-[#4285f4]">G</span>
              Continuar com Google
            </button>
            <button type="button" className="flex h-10 items-center justify-center gap-4 rounded-[5px] border border-[#4c261b] bg-transparent text-sm font-black tracking-[0.04em] text-[#ceb18f]">
              <span className="text-2xl font-black text-[#4267b2]">f</span>
              Continuar com Facebook
            </button>
          </div>
        </div>
      </div>
    </div>
  ), document.body)
}

function AuthModalInput({
  name,
  placeholder,
  type = 'text',
  defaultValue,
  highlighted = false,
}: {
  name: string
  placeholder: string
  type?: string
  defaultValue?: string
  highlighted?: boolean
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
          'h-10 w-full rounded-[5px] border border-[#4c261b] bg-transparent px-4 text-sm tracking-[0.04em] text-[#f8ead6] placeholder:text-[#b9966d] outline-none focus:border-[#dc8f4c]',
          highlighted && 'border-[#dc8f4c]',
          isPassword && 'pr-11',
        )}
      />
      {isPassword && <EyeOff className="absolute right-4 top-1/2 -translate-y-1/2 text-[#b9966d]" size={19} />}
    </label>
  )
}

export function useAuthForm(register: boolean, redirectOverride?: string, onSuccess?: () => void) {
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
      if (onSuccess) {
        onSuccess()
      } else {
        await navigateToRedirect(navigate, redirectOverride)
      }
    } catch (err) {
      setError(readApiError(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return { handleSubmit, error, isSubmitting }
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
  return navigate({ to: '/', search: { q: '', rarity: 'todos', category: 'todos', minPrice: '', maxPrice: '', sort: 'recentes', page: 1 } })
}

function readApiError(error: unknown) {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data.error.message ?? 'Nao foi possivel concluir a acao.'
  }
  return 'Nao foi possivel concluir a acao.'
}

async function navigateFromAuthClose(navigate: ReturnType<typeof useNavigate>) {
  const redirect = new URLSearchParams(window.location.search).get('redirect') || '/'

  if (redirect.startsWith('/nft/')) {
    return navigate({ to: '/nft/$nftId', params: { nftId: redirect.replace('/nft/', '').split('?')[0] } })
  }

  if (redirect === '/carrinho') return navigate({ to: '/carrinho' })

  return navigate({ to: '/', search: { q: '', rarity: 'todos', category: 'todos', minPrice: '', maxPrice: '', sort: 'recentes', page: 1 } })
}
