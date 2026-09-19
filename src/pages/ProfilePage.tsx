import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useLocation } from '@tanstack/react-router'
import {
  AlertTriangle,
  Download,
  EyeOff,
  Heart,
  ImageIcon,
  LogOut,
  MapPin,
  ShoppingCart,
  Tag,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import { type ChangeEvent, type FormEvent, type ReactNode, useRef, useState } from 'react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'
import type { OwnedNft, Profile } from '../contracts/api'
import { coupons } from '../data/coupons'
import { parseApiError } from '../lib/apiError'
import { formatEth } from '../lib/eth'
import { cn } from '../lib/utils'
import { acceptedImageTypes, ImageValidationError, resizeImageToDataUrl } from '../lib/image'
import { changePassword, getCollection, getProfile, updateAvatar, updateProfile } from '../modules/account/api'
import { useAuth } from '../modules/auth/useAuth'
import { useFavorites } from '../modules/catalog/useFavorites'
import { WalletsPanel } from './WalletsPage'

type ProfileForm = Pick<Profile, 'name' | 'email' | 'username' | 'bio'>
type PasswordForm = { currentPassword: string; newPassword: string; confirmPassword: string }
type Errors<T> = Partial<Record<keyof T, string>>
type ProfileSection = 'profile' | 'wallets' | 'collection' | 'wishlist' | 'coupons' | 'downloads' | 'support'

const sectionByHash: Record<string, ProfileSection> = {
  colecao: 'collection',
  favoritos: 'wishlist',
  carteiras: 'wallets',
  cupons: 'coupons',
  arquivos: 'downloads',
  suporte: 'support',
}

const emptyPasswordForm: PasswordForm = { currentPassword: '', newPassword: '', confirmPassword: '' }
const fieldClass =
  'h-10 w-full rounded-sm border border-border bg-transparent px-3 font-mono text-sm text-foreground outline-none placeholder:text-[#9f7a55] focus:border-primary aria-[invalid=true]:border-red-400'

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
  return <p id={id} className="mt-1 text-xs font-bold text-red-200">{message}</p>
}

function FormStatus({ tone, message }: { tone: 'success' | 'error'; message: string | null }) {
  return (
    <p role="status" aria-live="polite" className={cn('min-h-5 text-sm font-bold', tone === 'error' ? 'text-red-200' : 'text-success')}>
      {message}
    </p>
  )
}

function useAccountErrorHandler() {
  const { expireSession } = useAuth()
  return (error: unknown, fallback: string) => {
    const parsed = parseApiError(error, fallback)
    if (parsed.status === 401) expireSession()
    return parsed
  }
}

function ProfileSidebar({
  activeSection,
  onSectionChange,
  onLogout,
}: {
  activeSection: ProfileSection
  onSectionChange: (section: ProfileSection) => void
  onLogout: () => void
}) {
  const items: Array<{ label: string; icon: LucideIcon; section?: ProfileSection }> = [
    { label: 'Dados do perfil', icon: UserRound, section: 'profile' },
    { label: 'Carteiras', icon: MapPin, section: 'wallets' },
    { label: 'Minha colecao', icon: ShoppingCart, section: 'collection' },
    { label: 'Lista de interesse', icon: Heart, section: 'wishlist' },
    { label: 'Cupons', icon: Tag, section: 'coupons' },
    { label: 'Arquivos baixados', icon: Download, section: 'downloads' },
    { label: 'Suporte', icon: AlertTriangle, section: 'support' },
  ]

  return (
    <aside className="self-start bg-card">
      <h2 className="px-3 pb-3 pt-5 font-display text-xl font-bold">Meu perfil</h2>
      <nav aria-label="Menu do perfil" className="pb-3">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = item.section === activeSection
          const className = cn(
            'flex h-11 w-full items-center gap-4 border-l-4 px-4 text-left font-display text-sm font-medium text-primarySoft transition',
            isActive ? 'border-primary bg-[#3a1d09]/35' : 'border-transparent hover:bg-[#3a1d09]/25',
          )
          const content = (
            <>
              <Icon size={17} />
              <span>{item.label}</span>
            </>
          )
          if (item.section) {
            const section = item.section
            return (
              <button key={item.label} type="button" className={className} onClick={() => onSectionChange(section)}>
                {content}
              </button>
            )
          }
          return (
            <span key={item.label} className={cn(className, 'cursor-default')}>
              {content}
            </span>
          )
        })}
      </nav>
      <button
        type="button"
        className="flex h-12 w-full items-center gap-4 border-t border-border px-4 font-display text-sm font-bold text-primarySoft hover:bg-[#3a1d09]/35"
        onClick={onLogout}
      >
        <LogOut size={18} />
        Sair
      </button>
    </aside>
  )
}

function ProfileField({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="font-mono text-sm tracking-[0.03em]">
        {label}
        <span className="text-primary">*</span>
      </label>
      <div className="mt-3">{children}</div>
      <FieldError id={`${id}-error`} message={error} />
    </div>
  )
}

function PasswordInput({
  id,
  label,
  value,
  error,
  autoComplete,
  onChange,
}: {
  id: string
  label: string
  value: string
  error?: string
  autoComplete: string
  onChange: (value: string) => void
}) {
  return (
    <div>
      <label htmlFor={id} className="font-mono text-sm tracking-[0.03em]">{label}</label>
      <div className="relative mt-3">
        <input
          id={id}
          type="password"
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(fieldClass, 'pr-10')}
        />
        <EyeOff size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-primarySoft" />
      </div>
      <FieldError id={`${id}-error`} message={error} />
    </div>
  )
}

function ProfileEditor({ profile }: { profile: Profile }) {
  const queryClient = useQueryClient()
  const handleError = useAccountErrorHandler()
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<ProfileForm>({
    name: profile.name,
    email: profile.email,
    username: profile.username,
    bio: profile.bio,
  })
  const [passwordForm, setPasswordForm] = useState<PasswordForm>(emptyPasswordForm)
  const [errors, setErrors] = useState<Errors<ProfileForm>>({})
  const [passwordErrors, setPasswordErrors] = useState<Errors<PasswordForm>>({})
  const [profileStatus, setProfileStatus] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const [passwordStatus, setPasswordStatus] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const [avatarStatus, setAvatarStatus] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const [isProcessingAvatar, setIsProcessingAvatar] = useState(false)

  const profileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updated) => {
      queryClient.setQueryData(['profile', profile.userId], updated)
      void queryClient.invalidateQueries({ queryKey: ['session'] })
      setProfileStatus({ tone: 'success', text: 'Perfil atualizado.' })
    },
    onError: (error) => {
      const parsed = handleError(error, 'Nao foi possivel salvar o perfil.')
      setErrors(parsed.fields as Errors<ProfileForm>)
      setProfileStatus({ tone: 'error', text: parsed.message })
    },
  })

  const avatarMutation = useMutation({
    mutationFn: updateAvatar,
    onSuccess: (updated) => {
      queryClient.setQueryData(['profile', profile.userId], updated)
      setAvatarStatus({ tone: 'success', text: 'Avatar atualizado.' })
    },
    onError: (error) => {
      const parsed = handleError(error, 'Nao foi possivel atualizar o avatar.')
      setAvatarStatus({ tone: 'error', text: parsed.fields.avatar ?? parsed.message })
    },
  })

  const passwordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      setPasswordForm(emptyPasswordForm)
      setPasswordStatus({ tone: 'success', text: 'Senha atualizada.' })
    },
    onError: (error) => {
      const parsed = handleError(error, 'Nao foi possivel alterar a senha.')
      setPasswordErrors(parsed.fields as Errors<PasswordForm>)
      setPasswordStatus({ tone: 'error', text: parsed.message })
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
    setProfileStatus(null)
  }

  const setPasswordField = (field: keyof PasswordForm, value: string) => {
    setPasswordForm((current) => ({ ...current, [field]: value }))
    setPasswordErrors((current) => ({ ...current, [field]: undefined }))
    setPasswordStatus(null)
  }

  const handleAvatarFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setAvatarStatus(null)
    setIsProcessingAvatar(true)
    try {
      const dataUrl = await resizeImageToDataUrl(file)
      avatarMutation.mutate({ dataUrl })
    } catch (error) {
      setAvatarStatus({ tone: 'error', text: error instanceof ImageValidationError ? error.message : 'Nao foi possivel processar a imagem.' })
    } finally {
      setIsProcessingAvatar(false)
    }
  }

  const handleProfileSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validateProfileForm(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      setProfileStatus({ tone: 'error', text: 'Verifique os campos destacados.' })
      return
    }
    profileMutation.mutate({
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      username: form.username.trim(),
      bio: form.bio.trim(),
    })
  }

  const handlePasswordSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validatePasswordForm(passwordForm)
    setPasswordErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      setPasswordStatus({ tone: 'error', text: 'Verifique os campos destacados.' })
      return
    }
    passwordMutation.mutate({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword })
  }

  const avatarBusy = isProcessingAvatar || avatarMutation.isPending

  return (
    <div className="min-w-0">
      <form noValidate onSubmit={handleProfileSubmit}>
        <h1 className="font-display text-lg font-bold">Perfil do colecionador</h1>
        <div className="mt-9 grid gap-x-7 gap-y-8 lg:grid-cols-2">
          <ProfileField id="profile-name" label="Nome de exibicao" error={errors.name}>
            <input
              id="profile-name"
              value={form.name}
              autoComplete="name"
              onChange={(event) => setField('name', event.target.value)}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'profile-name-error' : undefined}
              className={fieldClass}
            />
          </ProfileField>
          <ProfileField id="profile-username" label="Nome de usuario" error={errors.username}>
            <input
              id="profile-username"
              value={form.username}
              autoComplete="username"
              onChange={(event) => setField('username', event.target.value)}
              aria-invalid={Boolean(errors.username)}
              aria-describedby={errors.username ? 'profile-username-error' : undefined}
              className={fieldClass}
            />
          </ProfileField>
          <ProfileField id="profile-email" label="E-mail" error={errors.email}>
            <input
              id="profile-email"
              type="email"
              value={form.email}
              autoComplete="email"
              onChange={(event) => setField('email', event.target.value)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'profile-email-error' : undefined}
              className={fieldClass}
            />
          </ProfileField>
          <ProfileField id="profile-ens" label="Nome ENS">
            <div className="grid grid-cols-[78px_minmax(0,1fr)] gap-3">
              <select className={cn(fieldClass, 'bg-[#120906]')} defaultValue=".eth" aria-label="Sufixo ENS">
                <option>.eth</option>
                <option>.xyz</option>
              </select>
              <input id="profile-ens" value={form.username} readOnly className={cn(fieldClass, 'text-[#b9966d]')} />
            </div>
          </ProfileField>
          <ProfileField id="profile-wallet-alias" label="Apelido da carteira" error={errors.bio}>
            <input
              id="profile-wallet-alias"
              value={form.bio}
              maxLength={280}
              onChange={(event) => setField('bio', event.target.value)}
              aria-invalid={Boolean(errors.bio)}
              aria-describedby={errors.bio ? 'profile-wallet-alias-error' : undefined}
              className={fieldClass}
            />
          </ProfileField>
          <div>
            <p className="font-mono text-sm tracking-[0.03em]">Avatar</p>
            <div className="mt-3 flex flex-wrap items-center gap-6">
              <div className="grid size-[52px] place-items-center overflow-hidden rounded-full bg-[#3a1d09] text-primarySoft">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={`Avatar de ${profile.name}`} className={cn('h-full w-full object-cover', avatarBusy && 'opacity-50')} />
                ) : (
                  <ImageIcon size={21} />
                )}
              </div>
              <input
                ref={avatarInputRef}
                id="profile-avatar"
                type="file"
                accept={acceptedImageTypes.join(',')}
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
                onChange={(event) => void handleAvatarFile(event)}
              />
              <Button type="button" className="min-w-[98px]" onClick={() => avatarInputRef.current?.click()} disabled={avatarBusy} aria-busy={avatarBusy}>
                {avatarBusy ? 'Enviando...' : 'Alterar'}
              </Button>
              <button type="button" className="font-display text-sm text-[#caa677] hover:text-primarySoft" onClick={() => setAvatarStatus(null)}>
                Remover
              </button>
            </div>
            <div className="mt-2">
              <FormStatus tone={avatarStatus?.tone ?? 'success'} message={avatarStatus?.text ?? null} />
            </div>
          </div>
        </div>
        <div className="mt-7 flex flex-wrap items-center gap-4">
          <Button type="submit" className="min-w-[132px]" disabled={!isDirty || profileMutation.isPending} aria-busy={profileMutation.isPending}>
            {profileMutation.isPending ? 'Salvando...' : 'Salvar alteracoes'}
          </Button>
          <FormStatus tone={profileStatus?.tone ?? 'success'} message={profileStatus?.text ?? null} />
        </div>
      </form>

      <form noValidate onSubmit={handlePasswordSubmit} className="mt-1 max-w-[500px]">
        <h2 className="font-display text-lg font-bold">Alterar senha</h2>
        <div className="mt-5 grid gap-6">
          <PasswordInput
            id="password-current"
            label="Senha atual"
            value={passwordForm.currentPassword}
            error={passwordErrors.currentPassword}
            autoComplete="current-password"
            onChange={(value) => setPasswordField('currentPassword', value)}
          />
          <PasswordInput
            id="password-new"
            label="Nova senha"
            value={passwordForm.newPassword}
            error={passwordErrors.newPassword}
            autoComplete="new-password"
            onChange={(value) => setPasswordField('newPassword', value)}
          />
          <PasswordInput
            id="password-confirm"
            label="Confirmar nova senha"
            value={passwordForm.confirmPassword}
            error={passwordErrors.confirmPassword}
            autoComplete="new-password"
            onChange={(value) => setPasswordField('confirmPassword', value)}
          />
        </div>
        <div className="mt-7 flex flex-wrap items-center gap-4">
          <Button type="submit" className="min-w-[132px]" disabled={passwordMutation.isPending} aria-busy={passwordMutation.isPending}>
            {passwordMutation.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
          <FormStatus tone={passwordStatus?.tone ?? 'success'} message={passwordStatus?.text ?? null} />
        </div>
      </form>
    </div>
  )
}

function WishlistPanel() {
  const favorites = useFavorites()
  const items = favorites.favorites?.items ?? []

  return (
    <section className="min-w-0" aria-labelledby="wishlist-title">
      <div className="mb-8">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primarySoft">Lista de interesse</span>
        <h1 id="wishlist-title" className="mt-2 font-display text-lg font-bold">NFTs favoritos</h1>
      </div>

      {favorites.error && (
        <p role="alert" className="mb-4 rounded-md border border-red-400/30 bg-red-950/35 px-4 py-3 text-sm font-semibold text-red-100">
          {favorites.error}
        </p>
      )}

      {favorites.isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
          <Skeleton className="h-[300px] rounded-sm" />
          <Skeleton className="h-[300px] rounded-sm" />
          <Skeleton className="h-[300px] rounded-sm" />
        </div>
      ) : favorites.isError ? (
        <Card className="p-6 text-center">
          <p className="font-semibold">Nao foi possivel carregar sua lista de interesse.</p>
          <Button className="mt-4" onClick={() => void favorites.refetch()}>Tentar novamente</Button>
        </Card>
      ) : items.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="font-semibold">Voce ainda nao marcou nenhum NFT como favorito.</p>
          <p className="mt-2 text-sm text-foreground/55">Os itens favoritados no catalogo aparecem aqui.</p>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((nft) => (
            <article key={nft.id} className="min-w-0 bg-card p-5">
              <Link to="/nft/$nftId" params={{ nftId: nft.id }} className="group block">
                <div className="aspect-square overflow-hidden rounded-md bg-[#efe7d2]">
                  <img src={nft.hero} alt={nft.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" loading="lazy" />
                </div>
                <h2 className="mt-3 truncate font-display text-base font-bold text-[#d3c2b3]">{nft.title}</h2>
                <p className="mt-1 truncate text-sm text-foreground/55">{nft.creator}</p>
              </Link>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="font-display text-lg font-bold text-primarySoft">{formatEth(nft.priceEth)}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remover ${nft.title} dos favoritos`}
                  aria-pressed="true"
                  disabled={favorites.isPending(nft.id)}
                  onClick={() => favorites.toggleFavorite(nft.id)}
                >
                  <Heart size={18} className="fill-current" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function CollectionPanel({ userId }: { userId: string }) {
  const collectionQuery = useQuery({
    queryKey: ['collection', userId],
    queryFn: getCollection,
    enabled: Boolean(userId),
  })
  const items = collectionQuery.data?.items ?? []

  return (
    <section className="min-w-0" aria-labelledby="collection-title">
      <div className="mb-8">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primarySoft">Minha colecao</span>
        <h1 id="collection-title" className="mt-2 font-display text-lg font-bold">NFTs que voce tem</h1>
      </div>

      {collectionQuery.isPending ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
          <Skeleton className="h-[330px] rounded-sm" />
          <Skeleton className="h-[330px] rounded-sm" />
          <Skeleton className="h-[330px] rounded-sm" />
        </div>
      ) : collectionQuery.isError ? (
        <Card className="p-6 text-center">
          <p className="font-semibold">Nao foi possivel carregar sua colecao.</p>
          <Button className="mt-4" onClick={() => void collectionQuery.refetch()}>Tentar novamente</Button>
        </Card>
      ) : items.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="font-semibold">Voce ainda nao possui NFTs comprados.</p>
          <p className="mt-2 text-sm text-foreground/55">Quando uma compra for confirmada, ela aparece aqui.</p>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <article key={`${item.orderId}-${item.nftId}-${item.edition}`} className="min-w-0 bg-card p-5">
              <Link to="/nft/$nftId" params={{ nftId: item.nftId }} className="group block">
                <div className="aspect-square overflow-hidden rounded-md bg-[#efe7d2]">
                  <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" loading="lazy" />
                </div>
                <h2 className="mt-3 truncate font-display text-base font-bold text-[#d3c2b3]">{item.title}</h2>
              </Link>
              <dl className="mt-3 grid gap-2 border-t border-border pt-3 font-mono text-xs text-[#caa677]">
                <div className="flex justify-between gap-3">
                  <dt>Edicao</dt>
                  <dd className="text-right text-foreground">{item.edition}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Quantidade</dt>
                  <dd className="text-right text-foreground">x {item.quantity}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Carteira</dt>
                  <dd className="truncate text-right text-foreground" title={item.walletAddress}>{item.walletLabel}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Compra</dt>
                  <dd className="text-right text-foreground">{new Date(item.purchasedAt).toLocaleDateString('pt-BR')}</dd>
                </div>
              </dl>
              <a
                href={item.explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex text-sm font-bold text-primarySoft hover:text-primary"
              >
                Ver transacao
              </a>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function filenamePart(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function dataFileUrl(content: string, type: string) {
  return `data:${type};charset=utf-8,${encodeURIComponent(content)}`
}

function buildDownloadAssets(item: OwnedNft) {
  const baseName = `${filenamePart(item.title)}-${item.edition.toLowerCase()}`
  const certificate = [
    'Certificado de propriedade Kurio',
    '',
    `NFT: ${item.title}`,
    `Edicao: ${item.edition}`,
    `Quantidade: ${item.quantity}`,
    `Pedido: ${item.orderId}`,
    `Transacao: ${item.transaction}`,
    `Rede: ${item.network}`,
    `Carteira: ${item.walletLabel} (${item.walletAddress})`,
    `Compra confirmada em: ${new Date(item.purchasedAt).toLocaleString('pt-BR')}`,
  ].join('\n')
  const metadata = JSON.stringify({
    nftId: item.nftId,
    title: item.title,
    edition: item.edition,
    quantity: item.quantity,
    orderId: item.orderId,
    transaction: item.transaction,
    network: item.network,
    wallet: {
      label: item.walletLabel,
      address: item.walletAddress,
    },
    purchasedAt: item.purchasedAt,
    explorerUrl: item.explorerUrl,
  }, null, 2)

  return [
    {
      id: `${item.orderId}-${item.nftId}-image`,
      label: 'Imagem do NFT',
      detail: 'PNG em alta resolucao',
      href: item.imageUrl,
      download: `${baseName}.png`,
    },
    {
      id: `${item.orderId}-${item.nftId}-certificate`,
      label: 'Certificado',
      detail: 'Comprovante de propriedade',
      href: dataFileUrl(certificate, 'text/plain'),
      download: `${baseName}-certificado.txt`,
    },
    {
      id: `${item.orderId}-${item.nftId}-metadata`,
      label: 'Metadados',
      detail: 'Arquivo JSON da compra',
      href: dataFileUrl(metadata, 'application/json'),
      download: `${baseName}-metadados.json`,
    },
  ]
}

function DownloadsPanel({ userId }: { userId: string }) {
  const collectionQuery = useQuery({
    queryKey: ['collection', userId],
    queryFn: getCollection,
    enabled: Boolean(userId),
  })
  const items = collectionQuery.data?.items ?? []

  return (
    <section className="min-w-0" aria-labelledby="downloads-title">
      <div className="mb-8">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primarySoft">Arquivos baixados</span>
        <h1 id="downloads-title" className="mt-2 font-display text-lg font-bold">Materiais dos seus NFTs</h1>
      </div>

      {collectionQuery.isPending ? (
        <div className="grid gap-5 lg:grid-cols-2" aria-busy="true">
          <Skeleton className="h-[260px] rounded-sm" />
          <Skeleton className="h-[260px] rounded-sm" />
        </div>
      ) : collectionQuery.isError ? (
        <Card className="p-6 text-center">
          <p className="font-semibold">Nao foi possivel carregar seus arquivos.</p>
          <Button className="mt-4" onClick={() => void collectionQuery.refetch()}>Tentar novamente</Button>
        </Card>
      ) : items.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="font-semibold">Nenhum arquivo disponivel ainda.</p>
          <p className="mt-2 text-sm text-foreground/55">Depois de comprar um NFT, os arquivos dele aparecem aqui.</p>
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {items.map((item) => (
            <article key={`${item.orderId}-${item.nftId}-${item.edition}-downloads`} className="grid min-w-0 gap-4 bg-card p-5 sm:grid-cols-[108px_minmax(0,1fr)]">
              <Link to="/nft/$nftId" params={{ nftId: item.nftId }} className="block overflow-hidden rounded-md bg-[#efe7d2]">
                <img src={item.imageUrl} alt={item.title} className="aspect-square h-full w-full object-cover" loading="lazy" />
              </Link>
              <div className="min-w-0">
                <h2 className="truncate font-display text-base font-bold text-[#d3c2b3]">{item.title}</h2>
                <p className="mt-1 font-mono text-xs text-[#caa677]">
                  {item.edition} · Pedido {item.orderId}
                </p>
                <div className="mt-4 grid gap-2">
                  {buildDownloadAssets(item).map((asset) => (
                    <a
                      key={asset.id}
                      href={asset.href}
                      download={asset.download}
                      className="flex min-w-0 items-center justify-between gap-3 border border-border bg-[#170d0a] px-3 py-2 text-sm transition hover:border-primary/70 hover:bg-muted"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-bold">{asset.label}</span>
                        <span className="block truncate text-xs text-foreground/55">{asset.detail}</span>
                      </span>
                      <Download size={16} className="shrink-0 text-primarySoft" />
                    </a>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function CouponsPanel() {
  const [code, setCode] = useState('')
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalized = code.trim().toUpperCase()
    const coupon = coupons.find((item) => item.code === normalized)
    if (!normalized) {
      setMessage({ tone: 'error', text: 'Informe um codigo de cupom.' })
      return
    }
    if (!coupon) {
      setMessage({ tone: 'error', text: 'Cupom nao encontrado.' })
      return
    }
    if (coupon.status !== 'disponivel') {
      setMessage({ tone: 'error', text: 'Este cupom ja foi usado ou expirou.' })
      return
    }
    setCode(normalized)
    setMessage({ tone: 'success', text: `${coupon.code} esta disponivel para usar no carrinho.` })
  }

  return (
    <section className="min-w-0" aria-labelledby="coupons-title">
      <div className="mb-8">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primarySoft">Cupons</span>
        <h1 id="coupons-title" className="mt-2 font-display text-lg font-bold">Descontos de compra</h1>
      </div>

      <form noValidate onSubmit={handleSubmit} className="mb-6 flex flex-col gap-3 bg-card p-5 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label htmlFor="coupon-code" className="font-mono text-sm tracking-[0.03em]">Adicionar cupom</label>
          <input
            id="coupon-code"
            value={code}
            onChange={(event) => {
              setCode(event.target.value.toUpperCase())
              setMessage(null)
            }}
            placeholder="JUNGLE10"
            className={cn(fieldClass, 'mt-2 uppercase')}
          />
        </div>
        <Button type="submit">
          <Tag size={16} />
          Verificar
        </Button>
      </form>
      <p role="status" aria-live="polite" className={cn('mb-5 min-h-5 text-sm font-bold', message?.tone === 'error' ? 'text-red-200' : 'text-success')}>
        {message?.text}
      </p>

      <div className="grid gap-5 md:grid-cols-2">
        {coupons.map((coupon) => {
          const available = coupon.status === 'disponivel'
          const statusLabel = coupon.status === 'disponivel' ? 'Disponivel' : coupon.status === 'usado' ? 'Usado' : 'Expirado'
          return (
            <article key={coupon.code} className={cn('border bg-card p-5', available ? 'border-primary/40' : 'border-border opacity-70')}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-primarySoft">{coupon.code}</p>
                  <h2 className="mt-2 font-display text-base font-bold">{coupon.title}</h2>
                </div>
                <span className={cn('rounded-full border px-2.5 py-1 text-xs font-bold', available ? 'border-primary/50 text-primarySoft' : 'border-border text-foreground/55')}>
                  {statusLabel}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-foreground/60">{coupon.description}</p>
              <p className="mt-3 font-display text-lg font-bold text-primarySoft">{coupon.percent}% OFF</p>
              <p className="mt-4 font-mono text-xs text-[#caa677]">
                Validade: {new Date(coupon.expiresAt).toLocaleDateString('pt-BR')}
              </p>
            </article>
          )
        })}
      </div>
    </section>
  )
}

type SupportForm = {
  topic: string
  priority: string
  orderId: string
  message: string
}

const supportTopics = [
  'Problema com compra',
  'Carteira ou conexao',
  'Arquivos do NFT',
  'Favoritos e colecao',
  'Conta e seguranca',
]

function SupportPanel() {
  const [form, setForm] = useState<SupportForm>({
    topic: supportTopics[0],
    priority: 'normal',
    orderId: '',
    message: '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof SupportForm, string>>>({})
  const [ticket, setTicket] = useState<string | null>(null)

  const setField = <K extends keyof SupportForm>(field: K, value: SupportForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setTicket(null)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors: Partial<Record<keyof SupportForm, string>> = {}
    if (!form.topic) nextErrors.topic = 'Selecione um assunto.'
    if (form.orderId.trim() && !/^GM-\d{4,}$/.test(form.orderId.trim())) nextErrors.orderId = 'Use o formato GM-0000.'
    if (form.message.trim().length < 12) nextErrors.message = 'Descreva o problema com pelo menos 12 caracteres.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setTicket(`SUP-${Date.now().toString().slice(-6)}`)
    setForm((current) => ({ ...current, orderId: '', message: '' }))
  }

  return (
    <section className="min-w-0" aria-labelledby="support-title">
      <div className="mb-8">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primarySoft">Suporte</span>
        <h1 id="support-title" className="mt-2 font-display text-lg font-bold">Central de ajuda</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ['Compras', 'Acompanhe pagamento, recibo e confirmacao.'],
          ['Carteiras', 'Resolva conexao, rede e carteira principal.'],
          ['Arquivos', 'Ajuda com imagem, certificado e metadados.'],
        ].map(([title, description]) => (
          <Card key={title} className="p-5">
            <h2 className="font-display text-base font-bold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-foreground/60">{description}</p>
          </Card>
        ))}
      </div>

      <form noValidate onSubmit={handleSubmit} className="mt-7 grid gap-5 bg-card p-5" aria-labelledby="support-form-title">
        <h2 id="support-form-title" className="font-display text-base font-bold">Abrir chamado</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="support-topic" className="font-mono text-sm tracking-[0.03em]">Assunto</label>
            <select
              id="support-topic"
              value={form.topic}
              onChange={(event) => setField('topic', event.target.value)}
              aria-invalid={Boolean(errors.topic)}
              aria-describedby={errors.topic ? 'support-topic-error' : undefined}
              className={cn(fieldClass, 'bg-[#120906]')}
            >
              {supportTopics.map((topic) => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>
            <FieldError id="support-topic-error" message={errors.topic} />
          </div>
          <div className="space-y-2">
            <label htmlFor="support-priority" className="font-mono text-sm tracking-[0.03em]">Prioridade</label>
            <select
              id="support-priority"
              value={form.priority}
              onChange={(event) => setField('priority', event.target.value)}
              className={cn(fieldClass, 'bg-[#120906]')}
            >
              <option value="normal">Normal</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label htmlFor="support-order" className="font-mono text-sm tracking-[0.03em]">Pedido relacionado (opcional)</label>
            <input
              id="support-order"
              value={form.orderId}
              placeholder="GM-2049"
              onChange={(event) => setField('orderId', event.target.value)}
              aria-invalid={Boolean(errors.orderId)}
              aria-describedby={errors.orderId ? 'support-order-error' : undefined}
              className={fieldClass}
            />
            <FieldError id="support-order-error" message={errors.orderId} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label htmlFor="support-message" className="font-mono text-sm tracking-[0.03em]">Mensagem</label>
            <textarea
              id="support-message"
              value={form.message}
              maxLength={500}
              onChange={(event) => setField('message', event.target.value)}
              aria-invalid={Boolean(errors.message)}
              aria-describedby={errors.message ? 'support-message-error' : undefined}
              className="min-h-36 w-full rounded-sm border border-border bg-transparent p-3 font-mono text-sm text-foreground outline-none placeholder:text-[#9f7a55] focus:border-primary aria-[invalid=true]:border-red-400"
              placeholder="Conte o que aconteceu e onde voce travou."
            />
            <div className="flex justify-between gap-3">
              <FieldError id="support-message-error" message={errors.message} />
              <span className="ml-auto text-xs text-foreground/45">{form.message.length}/500</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit">
            <AlertTriangle size={16} />
            Enviar chamado
          </Button>
          <p role="status" aria-live="polite" className="min-h-5 text-sm font-bold text-success">
            {ticket ? `Chamado ${ticket} aberto. Nossa equipe vai responder no e-mail do perfil.` : ''}
          </p>
        </div>
      </form>
    </section>
  )
}

export function ProfilePage() {
  const { session, logout } = useAuth()
  const userId = session?.user.id
  const location = useLocation()
  const [activeSection, setActiveSection] = useState<ProfileSection>(() => sectionByHash[location.hash] ?? 'profile')
  const [syncedHash, setSyncedHash] = useState(location.hash)
  const profileQuery = useQuery({
    queryKey: ['profile', userId],
    queryFn: getProfile,
    enabled: Boolean(userId),
  })
  const profile = profileQuery.data

  if (syncedHash !== location.hash) {
    setSyncedHash(location.hash)
    const section = sectionByHash[location.hash]
    if (section) setActiveSection(section)
  }

  return (
    <div className="mx-auto max-w-[1440px] px-6 pb-16 pt-8 font-mono sm:px-6 lg:px-[120px]">
      {profileQuery.isPending ? (
        <div className="grid gap-7 lg:grid-cols-[310px_minmax(0,1fr)]" aria-busy="true">
          <Skeleton className="h-[406px] rounded-sm" />
          <div className="space-y-7">
            <Skeleton className="h-[320px] rounded-sm" />
            <Skeleton className="h-[250px] rounded-sm" />
          </div>
        </div>
      ) : profileQuery.isError || !profile ? (
        <Card className="p-6 text-center">
          <p className="font-semibold">Nao foi possivel carregar seu perfil.</p>
          <Button className="mt-4" onClick={() => void profileQuery.refetch()}>Tentar novamente</Button>
        </Card>
      ) : (
        <div className="grid gap-7 lg:grid-cols-[310px_minmax(0,1fr)]">
          <ProfileSidebar activeSection={activeSection} onSectionChange={setActiveSection} onLogout={() => void logout()} />
          {activeSection === 'profile' ? (
            <ProfileEditor key={profile.userId} profile={profile} />
          ) : activeSection === 'wallets' ? (
            <WalletsPanel embedded />
          ) : activeSection === 'collection' ? (
            <CollectionPanel userId={userId ?? ''} />
          ) : activeSection === 'coupons' ? (
            <CouponsPanel />
          ) : activeSection === 'downloads' ? (
            <DownloadsPanel userId={userId ?? ''} />
          ) : activeSection === 'support' ? (
            <SupportPanel />
          ) : (
            <WishlistPanel />
          )}
        </div>
      )}
    </div>
  )
}
