import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, X } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'
import { Input, Select } from '../components/ui/Field'
import { SUPPORTED_NETWORKS, type WalletRequest } from '../contracts/api'
import { parseApiError } from '../lib/apiError'
import { cn } from '../lib/utils'
import { createWallet, getWallets, updateWallet } from '../modules/account/api'
import { useAuth } from '../modules/auth/useAuth'
import type { Wallet, WalletKind } from '../types'

type WalletErrors = Partial<Record<keyof WalletRequest, string>>
const walletInputClass =
  'min-h-10 rounded-sm border-[#4c261b] bg-transparent font-mono text-sm placeholder:text-[#b9966d] focus:border-primary'

// Mesmas regras do servidor: redes EVM, endereco 0x + 40 hexadecimais.
function validateWalletForm(form: WalletRequest): WalletErrors {
  const errors: WalletErrors = {}
  const label = form.label.trim()
  if (label.length < 2 || label.length > 40) errors.label = 'Informe um nome de 2 a 40 caracteres.'
  if (!/^0x[0-9a-fA-F]{40}$/.test(form.address.trim())) errors.address = 'Informe um endereco 0x com 40 caracteres hexadecimais.'
  if (!SUPPORTED_NETWORKS.includes(form.network as (typeof SUPPORTED_NETWORKS)[number])) errors.network = 'Selecione uma rede suportada.'
  return errors
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return <p id={id} className="text-xs font-semibold text-red-200">{message}</p>
}

function WalletLabel({ htmlFor, children, required = true }: { htmlFor?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="font-mono text-sm tracking-[0.03em] text-foreground">
      {children}
      {required && <span className="text-primary">*</span>}
    </label>
  )
}

function DisplayInput({ id, label, value, placeholder, required = true }: { id: string; label: string; value?: string; placeholder?: string; required?: boolean }) {
  return (
    <div className="space-y-2">
      <WalletLabel htmlFor={id} required={required}>{label}</WalletLabel>
      <Input id={id} value={value ?? ''} placeholder={placeholder} readOnly className={cn(walletInputClass, 'text-foreground/55')} />
    </div>
  )
}

function WalletForm({
  userId,
  wallet,
  defaultKind,
  onDone,
  onSaved,
}: {
  userId: string
  wallet?: Wallet
  defaultKind: WalletKind
  onDone?: () => void
  onSaved: (message: string) => void
}) {
  const queryClient = useQueryClient()
  const { session, expireSession } = useAuth()
  const isEdit = Boolean(wallet)
  const prefix = wallet ? `wallet-${wallet.id}` : 'wallet-new'
  const [form, setForm] = useState<WalletRequest>({
    label: wallet?.label ?? '',
    address: wallet?.address ?? '',
    network: wallet?.network ?? SUPPORTED_NETWORKS[0],
    kind: wallet?.kind ?? defaultKind,
  })
  // Promover outra carteira rebaixa esta no servidor: acompanha o tipo sem remontar o formulario.
  const [syncedKind, setSyncedKind] = useState(wallet?.kind)
  if (wallet && wallet.kind !== syncedKind) {
    setSyncedKind(wallet.kind)
    setForm((current) => ({ ...current, kind: wallet.kind }))
  }
  const [errors, setErrors] = useState<WalletErrors>({})
  const [status, setStatus] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  const walletMutation = useMutation({
    mutationFn: (payload: Partial<WalletRequest>) =>
      wallet ? updateWallet(wallet.id, payload) : createWallet(payload as WalletRequest),
    onSuccess: async () => {
      // Promover uma carteira a principal altera as demais: recarrega a lista inteira.
      await queryClient.invalidateQueries({ queryKey: ['wallets', userId] })
      setStatus(null)
      onSaved(isEdit ? 'Carteira salva.' : 'Carteira cadastrada.')
      onDone?.()
    },
    onError: (error) => {
      const parsed = parseApiError(error, 'Nao foi possivel salvar a carteira.')
      if (parsed.status === 401) expireSession()
      setErrors(parsed.fields as WalletErrors)
      setStatus({ tone: 'error', text: parsed.message })
    },
  })

  const next: WalletRequest = { ...form, label: form.label.trim(), address: form.address.trim() }
  // Em edicao, envia apenas o que mudou.
  const changes = wallet
    ? (Object.fromEntries(
        (Object.keys(next) as Array<keyof WalletRequest>)
          .filter((key) => next[key] !== wallet[key])
          .map((key) => [key, next[key]]),
      ) as Partial<WalletRequest>)
    : next
  const isDirty = Object.keys(changes).length > 0
  const isLockedPrimary = wallet?.kind === 'principal'

  const setField = <K extends keyof WalletRequest>(field: K, value: WalletRequest[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setStatus(null)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validateWalletForm(next)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      setStatus({ tone: 'error', text: 'Verifique os campos destacados.' })
      return
    }
    walletMutation.mutate(changes)
  }

  const describedBy = (field: keyof WalletRequest) => (errors[field] ? `${prefix}-${field}-error` : undefined)

  return (
    <form noValidate onSubmit={handleSubmit} className="mt-8 grid gap-x-7 gap-y-6 md:grid-cols-2">
      <DisplayInput id={`${prefix}-display-name`} label="Nome de exibicao" value={session?.user.name} />
      <div className="space-y-2">
        <WalletLabel htmlFor={`${prefix}-label`}>Apelido da carteira</WalletLabel>
        <Input
          id={`${prefix}-label`}
          value={form.label}
          onChange={(event) => setField('label', event.target.value)}
          aria-invalid={Boolean(errors.label)}
          aria-describedby={describedBy('label')}
          className={walletInputClass}
        />
        <FieldError id={`${prefix}-label-error`} message={errors.label} />
      </div>
      <div className="space-y-2">
        <WalletLabel htmlFor={`${prefix}-network`}>Rede</WalletLabel>
        <Select
          id={`${prefix}-network`}
          value={form.network}
          onChange={(event) => setField('network', event.target.value)}
          aria-invalid={Boolean(errors.network)}
          aria-describedby={describedBy('network')}
          className={walletInputClass}
        >
          {SUPPORTED_NETWORKS.map((network) => (
            <option key={network} value={network}>{network}</option>
          ))}
        </Select>
        <FieldError id={`${prefix}-network-error`} message={errors.network} />
      </div>
      <DisplayInput id={`${prefix}-profile-name`} label="Nome do perfil" value={session?.user.name} />
      <div className="space-y-2">
        <WalletLabel htmlFor={`${prefix}-address`}>Endereco da carteira</WalletLabel>
        <Input
          id={`${prefix}-address`}
          value={form.address}
          placeholder="Endereco 0x da carteira"
          spellCheck={false}
          autoCapitalize="off"
          onChange={(event) => setField('address', event.target.value)}
          aria-invalid={Boolean(errors.address)}
          aria-describedby={describedBy('address')}
          className={cn(walletInputClass, 'text-xs sm:text-sm')}
        />
        <FieldError id={`${prefix}-address-error`} message={errors.address} />
      </div>
      <DisplayInput id={`${prefix}-secondary-reference`} label="Carteira secundaria" placeholder="ENS ou carteira secundaria (opcional)" required={false} />
      <div className="space-y-2">
        <WalletLabel htmlFor={`${prefix}-kind-select`}>Tipo de carteira</WalletLabel>
        <Select
          id={`${prefix}-kind-select`}
          value={form.kind}
          onChange={(event) => setField('kind', event.target.value as WalletKind)}
          disabled={isLockedPrimary}
          aria-describedby={errors.kind ? `${prefix}-kind-error` : undefined}
          className={walletInputClass}
        >
          <option value="principal">Principal</option>
          <option value="secundaria">Secundaria</option>
        </Select>
        <div className="sr-only">
          {(['principal', 'secundaria'] as const).map((kind) => (
            <label key={kind} className="flex items-center gap-2">
              <input
                type="radio"
                name={`${prefix}-kind`}
                checked={form.kind === kind}
                onChange={() => setField('kind', kind)}
                disabled={kind === 'secundaria' && isLockedPrimary}
                className="size-4 accent-[#c57d3b]"
              />
              {kind === 'principal' ? 'Principal' : 'Secundaria'}
            </label>
          ))}
        </div>
        {isLockedPrimary && <p className="text-xs text-foreground/50">Para trocar, defina outra carteira como principal.</p>}
        <FieldError id={`${prefix}-kind-error`} message={errors.kind} />
      </div>
      <DisplayInput id={`${prefix}-referral`} label="Codigo de indicacao" value="" />
      <DisplayInput id={`${prefix}-email`} label="E-mail" value={session?.user.email} />
      <div className="space-y-2">
        <WalletLabel htmlFor={`${prefix}-ens`}>Nome ENS</WalletLabel>
        <div className="grid grid-cols-[78px_minmax(0,1fr)] gap-3">
          <Select aria-label="Sufixo ENS" defaultValue=".eth" className={walletInputClass}>
            <option>.eth</option>
            <option>.xyz</option>
          </Select>
          <Input id={`${prefix}-ens`} value="" readOnly className={cn(walletInputClass, 'text-foreground/55')} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 md:col-span-2">
        <Button type="submit" disabled={!isDirty || walletMutation.isPending} aria-busy={walletMutation.isPending}>
          {walletMutation.isPending ? 'Salvando...' : isEdit ? 'Salvar carteira' : 'Cadastrar carteira'}
        </Button>
        {onDone && !isEdit && (
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancelar
          </Button>
        )}
        <p role="status" aria-live="polite" className={`min-h-5 text-sm font-semibold ${status?.tone === 'error' ? 'text-red-200' : 'text-success'}`}>
          {status?.text}
        </p>
      </div>
    </form>
  )
}

export function WalletsPanel({ embedded = false }: { embedded?: boolean }) {
  const { session } = useAuth()
  const userId = session?.user.id ?? ''
  const [isCreating, setIsCreating] = useState(false)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const walletsQuery = useQuery({
    queryKey: ['wallets', userId],
    queryFn: getWallets,
    enabled: Boolean(userId),
  })
  const wallets = walletsQuery.data ?? []
  const primaryWallet = wallets.find((wallet) => wallet.kind === 'principal') ?? wallets[0]
  const secondaryWallets = wallets.filter((wallet) => wallet.id !== primaryWallet?.id)

  return (
    <div className={embedded ? 'min-w-0' : 'mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8'}>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className={embedded ? 'font-display text-lg font-bold' : 'font-display text-3xl font-bold sm:text-4xl'}>
            Carteira principal
          </h1>
          <p className="mt-2 text-sm text-[#caa677]">Estas carteiras ficam disponiveis no pagamento e para receber NFTs comprados.</p>
          <p role="status" aria-live="polite" className="mt-2 min-h-5 text-sm font-semibold text-success">{savedMessage}</p>
        </div>
        <Button variant="ghost" className="px-0 text-primarySoft hover:bg-transparent hover:text-primary" onClick={() => setIsCreating((value) => !value)} aria-expanded={isCreating} aria-controls="new-wallet">
          {isCreating ? <X size={18} /> : <Plus size={18} />}
          {isCreating ? 'Fechar' : 'Adicionar'}
        </Button>
      </div>

      {isCreating && (
        <section id="new-wallet" className="mb-10 border-b border-border pb-8">
          <h2 className="font-display text-lg font-bold">Nova carteira</h2>
          <p className="mt-1 text-sm text-foreground/55">
            {wallets.length ? 'Cadastre como principal para substituir a atual, ou como secundaria.' : 'A primeira carteira sera a principal.'}
          </p>
          <WalletForm userId={userId} defaultKind={wallets.length ? 'secundaria' : 'principal'} onDone={() => setIsCreating(false)} onSaved={setSavedMessage} />
        </section>
      )}

      {walletsQuery.isPending ? (
        <div className="grid gap-6" aria-busy="true">
          <Skeleton className="h-[430px] rounded-sm" />
          <Skeleton className="h-[120px] rounded-sm" />
        </div>
      ) : walletsQuery.isError ? (
        <Card className="p-6 text-center">
          <p className="font-semibold">Nao foi possivel carregar suas carteiras.</p>
          <Button className="mt-4" onClick={() => void walletsQuery.refetch()}>Tentar novamente</Button>
        </Card>
      ) : !primaryWallet ? (
        !isCreating && (
          <Card className="p-6">
            <p className="font-semibold">Voce ainda nao tem carteiras cadastradas.</p>
            <Button className="mt-4" onClick={() => setIsCreating(true)}>
              <Plus size={16} />
              Cadastrar carteira principal
            </Button>
          </Card>
        )
      ) : (
        <div>
          <section className="border-b border-border pb-8">
            <WalletForm key={primaryWallet.id} userId={userId} wallet={primaryWallet} defaultKind="principal" onSaved={setSavedMessage} />
          </section>

          <section className="mt-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <h2 className="font-display text-lg font-bold">Carteira secundaria</h2>
                <p className="mt-2 text-sm text-[#caa677]">
                  {secondaryWallets.length ? 'Use uma carteira secundaria como alternativa de pagamento.' : 'Voce ainda nao adicionou uma carteira secundaria.'}
                </p>
              </div>
              <div className="flex items-center gap-2 font-mono text-sm">
                <span className="size-4 rounded-full border-2 border-primary" aria-hidden="true" />
                <span>Igual à carteira principal</span>
                <button
                  type="button"
                  className={cn('font-display font-bold text-primarySoft hover:text-primary', isCreating && 'opacity-60')}
                  onClick={() => setIsCreating(true)}
                >
                  Adicionar
                </button>
              </div>
            </div>
            {secondaryWallets.map((wallet) => (
              <div key={wallet.id} className="mt-6 border-t border-border pt-6">
                <WalletForm key={`${wallet.id}-${wallet.kind}`} userId={userId} wallet={wallet} defaultKind={wallet.kind} onSaved={setSavedMessage} />
              </div>
            ))}
          </section>
        </div>
      )}
    </div>
  )
}

export function WalletsPage() {
  return <WalletsPanel />
}
