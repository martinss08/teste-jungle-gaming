import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Camera, Heart, KeyRound, Save } from 'lucide-react'
import { type ChangeEvent, type FormEvent, useRef, useState } from 'react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'
import { Input, Label, Textarea } from '../components/ui/Field'
import type { Profile } from '../contracts/api'
import { parseApiError } from '../lib/apiError'
import { formatEth } from '../lib/eth'
import { acceptedImageTypes, ImageValidationError, resizeImageToDataUrl } from '../lib/image'
import { changePassword, getProfile, updateAvatar, updateProfile } from '../modules/account/api'
import { useAuth } from '../modules/auth/useAuth'
import { useFavorites } from '../modules/catalog/useFavorites'

type ProfileForm = Pick<Profile, 'name' | 'email' | 'username' | 'bio'>
type PasswordForm = { currentPassword: string; newPassword: string; confirmPassword: string }
type Errors<T> = Partial<Record<keyof T, string>>

// Mesmas regras do servidor; a API continua sendo a validacao final.
function validateProfileForm(form: ProfileForm): Errors<ProfileForm> {
  const errors: Errors<ProfileForm> = {}
  const name = form.name.trim()
  if (name.length < 2 || name.length > 60) errors.name = 'Informe de 2 a 60 caracteres.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'Informe um e-mail valido.'
  if (!/^[a-z0-9._]{3,24}$/.test(form.username.trim())) errors.username = 'Use 3 a 24 letras minusculas, numeros, ponto ou _.'
  if (form.bio.trim().length > 280) errors.bio = 'Use no maximo 280 caracteres.'
  return errors
}

function validatePasswordForm(form: PasswordForm): Errors<PasswordForm> {
  const errors: Errors<PasswordForm> = {}
  if (!form.currentPassword) errors.currentPassword = 'Informe a senha atual.'
  if (form.newPassword.length < 6) errors.newPassword = 'Informe pelo menos 6 caracteres.'
  else if (form.newPassword === form.currentPassword) errors.newPassword = 'A nova senha deve ser diferente da atual.'
  if (form.confirmPassword !== form.newPassword) errors.confirmPassword = 'As senhas nao conferem.'
  return errors
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return <p id={id} className="text-xs font-semibold text-red-200">{message}</p>
}

function FormStatus({ tone, message }: { tone: 'success' | 'error'; message: string | null }) {
  return (
    <p role="status" aria-live="polite" className={`min-h-5 text-sm font-semibold ${tone === 'error' ? 'text-red-200' : 'text-success'}`}>
      {message}
    </p>
  )
}

function useAccountErrorHandler() {
  const { expireSession } = useAuth()
  // 401 encerra a sessao local; RequireAuth leva ao login e retorna para esta rota.
  return (error: unknown, fallback: string) => {
    const parsed = parseApiError(error, fallback)
    if (parsed.status === 401) expireSession()
    return parsed
  }
}

function AvatarCard({ profile }: { profile: Profile }) {
  const queryClient = useQueryClient()
  const handleError = useAccountErrorHandler()
  const inputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const avatarMutation = useMutation({
    mutationFn: updateAvatar,
    onSuccess: (updated) => {
      queryClient.setQueryData(['profile', profile.userId], updated)
      setMessage({ tone: 'success', text: 'Avatar atualizado.' })
    },
    onError: (error) => {
      const parsed = handleError(error, 'Nao foi possivel atualizar o avatar.')
      setMessage({ tone: 'error', text: parsed.fields.avatar ?? parsed.message })
    },
  })

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setMessage(null)
    setIsProcessing(true)
    try {
      const dataUrl = await resizeImageToDataUrl(file)
      avatarMutation.mutate({ dataUrl })
    } catch (error) {
      setMessage({ tone: 'error', text: error instanceof ImageValidationError ? error.message : 'Nao foi possivel processar a imagem.' })
    } finally {
      setIsProcessing(false)
    }
  }

  const isBusy = isProcessing || avatarMutation.isPending

  return (
    <Card className="self-start p-5 text-center">
      <div className="mx-auto grid size-32 place-items-center overflow-hidden rounded-lg bg-primary/20">
        <img src={profile.avatarUrl} alt={`Avatar de ${profile.name}`} className={`h-full w-full object-cover ${isBusy ? 'opacity-50' : ''}`} />
      </div>
      <h2 className="mt-4 break-words text-xl font-bold">{profile.name}</h2>
      <p className="break-all text-sm text-foreground/55">@{profile.username}</p>
      <input
        ref={inputRef}
        id="avatar-file"
        type="file"
        accept={acceptedImageTypes.join(',')}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => void handleFile(event)}
      />
      <Button variant="secondary" className="mt-5 w-full" onClick={() => inputRef.current?.click()} disabled={isBusy} aria-busy={isBusy}>
        <Camera size={16} />
        {isBusy ? 'Enviando avatar...' : 'Alterar avatar'}
      </Button>
      <p className="mt-2 text-xs text-foreground/45">PNG, JPEG ou WebP ate 5 MB.</p>
      <div className="mt-2">
        <FormStatus tone={message?.tone ?? 'success'} message={message?.text ?? null} />
      </div>
    </Card>
  )
}

function ProfileDetailsForm({ profile }: { profile: Profile }) {
  const queryClient = useQueryClient()
  const handleError = useAccountErrorHandler()
  const [form, setForm] = useState<ProfileForm>({
    name: profile.name,
    email: profile.email,
    username: profile.username,
    bio: profile.bio,
  })
  const [errors, setErrors] = useState<Errors<ProfileForm>>({})
  const [status, setStatus] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  const profileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updated) => {
      queryClient.setQueryData(['profile', profile.userId], updated)
      // Nome/e-mail tambem aparecem na sessao (cabecalho).
      void queryClient.invalidateQueries({ queryKey: ['session'] })
      setStatus({ tone: 'success', text: 'Perfil atualizado.' })
    },
    onError: (error) => {
      const parsed = handleError(error, 'Nao foi possivel salvar o perfil.')
      setErrors(parsed.fields as Errors<ProfileForm>)
      setStatus({ tone: 'error', text: parsed.message })
    },
  })

  const isDirty =
    form.name.trim() !== profile.name ||
    form.email.trim().toLowerCase() !== profile.email ||
    form.username.trim() !== profile.username ||
    form.bio.trim() !== profile.bio

  const setField = (field: keyof ProfileForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setStatus(null)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validateProfileForm(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      setStatus({ tone: 'error', text: 'Verifique os campos destacados.' })
      return
    }
    profileMutation.mutate({
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      username: form.username.trim(),
      bio: form.bio.trim(),
    })
  }

  const fieldProps = (field: keyof ProfileForm) => ({
    id: `profile-${field}`,
    value: form[field],
    'aria-invalid': Boolean(errors[field]),
    'aria-describedby': errors[field] ? `profile-${field}-error` : undefined,
  })

  return (
    <Card className="p-5">
      <form noValidate onSubmit={handleSubmit}>
        <h2 className="font-display text-2xl font-bold">Informacoes pessoais</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Nome</Label>
            <Input {...fieldProps('name')} autoComplete="name" onChange={(event) => setField('name', event.target.value)} />
            <FieldError id="profile-name-error" message={errors.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-username">Nome de usuario</Label>
            <Input {...fieldProps('username')} autoComplete="username" onChange={(event) => setField('username', event.target.value)} />
            <FieldError id="profile-username-error" message={errors.username} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="profile-email">Email</Label>
            <Input {...fieldProps('email')} type="email" autoComplete="email" onChange={(event) => setField('email', event.target.value)} />
            <FieldError id="profile-email-error" message={errors.email} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="profile-bio">Bio</Label>
            <Textarea {...fieldProps('bio')} maxLength={280} onChange={(event) => setField('bio', event.target.value)} />
            <div className="flex justify-between gap-3">
              <FieldError id="profile-bio-error" message={errors.bio} />
              <span className="ml-auto text-xs text-foreground/45">{form.bio.length}/280</span>
            </div>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <Button type="submit" disabled={!isDirty || profileMutation.isPending} aria-busy={profileMutation.isPending}>
            <Save size={16} />
            {profileMutation.isPending ? 'Salvando...' : 'Salvar alteracoes'}
          </Button>
          <FormStatus tone={status?.tone ?? 'success'} message={status?.text ?? null} />
        </div>
      </form>
    </Card>
  )
}

const emptyPasswordForm: PasswordForm = { currentPassword: '', newPassword: '', confirmPassword: '' }

function ChangePasswordForm() {
  const handleError = useAccountErrorHandler()
  const [form, setForm] = useState<PasswordForm>(emptyPasswordForm)
  const [errors, setErrors] = useState<Errors<PasswordForm>>({})
  const [status, setStatus] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  const passwordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      setForm(emptyPasswordForm)
      setStatus({ tone: 'success', text: 'Senha atualizada.' })
    },
    onError: (error) => {
      const parsed = handleError(error, 'Nao foi possivel alterar a senha.')
      setErrors(parsed.fields as Errors<PasswordForm>)
      setStatus({ tone: 'error', text: parsed.message })
    },
  })

  const setField = (field: keyof PasswordForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setStatus(null)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validatePasswordForm(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      setStatus({ tone: 'error', text: 'Verifique os campos destacados.' })
      return
    }
    passwordMutation.mutate({ currentPassword: form.currentPassword, newPassword: form.newPassword })
  }

  const fields: Array<[keyof PasswordForm, string, string]> = [
    ['currentPassword', 'Senha atual', 'current-password'],
    ['newPassword', 'Nova senha', 'new-password'],
    ['confirmPassword', 'Confirmar nova senha', 'new-password'],
  ]

  return (
    <Card className="p-5">
      <form noValidate onSubmit={handleSubmit}>
        <h2 className="font-display text-2xl font-bold">Alterar senha</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {fields.map(([field, label, autoComplete]) => (
            <div key={field} className="space-y-2">
              <Label htmlFor={`password-${field}`}>{label}</Label>
              <Input
                id={`password-${field}`}
                type="password"
                autoComplete={autoComplete}
                value={form[field]}
                onChange={(event) => setField(field, event.target.value)}
                aria-invalid={Boolean(errors[field])}
                aria-describedby={errors[field] ? `password-${field}-error` : undefined}
              />
              <FieldError id={`password-${field}-error`} message={errors[field]} />
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <Button type="submit" variant="secondary" disabled={passwordMutation.isPending} aria-busy={passwordMutation.isPending}>
            <KeyRound size={16} />
            {passwordMutation.isPending ? 'Atualizando...' : 'Atualizar senha'}
          </Button>
          <FormStatus tone={status?.tone ?? 'success'} message={status?.text ?? null} />
        </div>
      </form>
    </Card>
  )
}

function FavoritesCard() {
  const favorites = useFavorites()
  const items = favorites.favorites?.items ?? []

  return (
    <Card id="favoritos" className="p-6">
      <h2 className="flex items-center gap-2 font-display text-xl font-bold">
        <Heart size={18} className="text-primarySoft" />
        Favoritos
      </h2>
      {favorites.error && <p role="alert" className="mt-3 text-sm font-semibold text-red-200">{favorites.error}</p>}
      {favorites.isLoading ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2" aria-busy="true">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : favorites.isError ? (
        <div className="mt-4">
          <p className="text-sm">Nao foi possivel carregar seus favoritos.</p>
          <Button className="mt-3" size="sm" onClick={() => void favorites.refetch()}>Tentar novamente</Button>
        </div>
      ) : items.length ? (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {items.map((nft) => (
            <li key={nft.id} className="flex items-center gap-3 rounded-md border border-border bg-[#170d0a] p-3">
              <img src={nft.hero} alt="" className="size-14 rounded-md object-cover" />
              <div className="min-w-0 flex-1">
                <Link to="/nft/$nftId" params={{ nftId: nft.id }} className="block truncate font-semibold hover:text-primarySoft">{nft.title}</Link>
                <p className="text-sm text-primarySoft">{formatEth(nft.priceEth)}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remover ${nft.title} dos favoritos`}
                disabled={favorites.isPending(nft.id)}
                onClick={() => favorites.toggleFavorite(nft.id)}
              >
                <Heart size={18} className="fill-current text-primarySoft" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-foreground/60">Voce ainda nao favoritou nenhum NFT.</p>
      )}
    </Card>
  )
}

export function ProfilePage() {
  const { session } = useAuth()
  const userId = session?.user.id
  const profileQuery = useQuery({
    queryKey: ['profile', userId],
    queryFn: getProfile,
    enabled: Boolean(userId),
  })
  const profile = profileQuery.data

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primarySoft">Perfil do colecionador</span>
        <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Dados da conta</h1>
      </div>

      {profileQuery.isPending ? (
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]" aria-busy="true">
          <Skeleton className="h-[300px] rounded-lg" />
          <div className="space-y-5">
            <Skeleton className="h-[340px] rounded-lg" />
            <Skeleton className="h-[180px] rounded-lg" />
          </div>
        </div>
      ) : profileQuery.isError || !profile ? (
        <Card className="p-6 text-center">
          <p className="font-semibold">Nao foi possivel carregar seu perfil.</p>
          <Button className="mt-4" onClick={() => void profileQuery.refetch()}>Tentar novamente</Button>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <AvatarCard profile={profile} />
          <div className="space-y-5">
            <ProfileDetailsForm key={profile.userId} profile={profile} />
            <ChangePasswordForm />
          </div>
          <div className="lg:col-span-2">
            <FavoritesCard />
          </div>
        </div>
      )}
    </div>
  )
}
