import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Save, WalletCards, X } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input, Label, Select } from '../components/ui/Field'
import { SUPPORTED_NETWORKS, type WalletRequest } from '../contracts/api'
import { parseApiError } from '../lib/apiError'
import { createWallet, getWallets, updateWallet } from '../modules/account/api'
import { useAuth } from '../modules/auth/useAuth'
import type { Wallet, WalletKind } from '../types'

type WalletErrors = Partial<Record<keyof WalletRequest, string>>

// Mesmas regras do servidor: redes EVM, endereco 0x + 40 hexadecimais.
function validateWalletForm(form: WalletRequest): WalletErrors {
  const errors: WalletErrors = {}
  const label = form.label.trim()
  if (label.length < 2 || label.length > 40) errors.label = 'Informe um nome de 2 a 40 caracteres.'
  if (!/^0x[0-9a-fA-F]{40}$/.test(form.address.trim())) errors.address = 'Informe um endereco 0x com 40 caracteres hexadecimais.'
  if (!SUPPORTED_NETWORKS.includes(form.network as (typeof SUPPORTED_NETWORKS)[number])) errors.network = 'Selecione uma rede suportada.'
  return errors
}

function shortenAddress(address: string) {
  return address.length > 14 ? `${address.slice(0, 6)}...${address.slice(-4)}` : address
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return <p id={id} className="text-xs font-semibold text-red-200">{message}</p>
}

function WalletForm({
  userId,
  wallet,
  defaultKind,
  onDone,
}: {
  userId: string
  wallet?: Wallet
  defaultKind: WalletKind
  onDone?: () => void
}) {
  const queryClient = useQueryClient()
  const { expireSession } = useAuth()
  const isEdit = Boolean(wallet)
  const prefix = wallet ? `wallet-${wallet.id}` : 'wallet-new'
  const [form, setForm] = useState<WalletRequest>({
    label: wallet?.label ?? '',
    address: wallet?.address ?? '',
    network: wallet?.network ?? SUPPORTED_NETWORKS[0],
    kind: wallet?.kind ?? defaultKind,
  })
  const [errors, setErrors] = useState<WalletErrors>({})
  const [status, setStatus] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  const walletMutation = useMutation({
    mutationFn: (payload: Partial<WalletRequest>) =>
      wallet ? updateWallet(wallet.id, payload) : createWallet(payload as WalletRequest),
    onSuccess: async () => {
      // Promover uma carteira a principal altera as demais: recarrega a lista inteira.
      await queryClient.invalidateQueries({ queryKey: ['wallets', userId] })
      setStatus({ tone: 'success', text: isEdit ? 'Carteira salva.' : 'Carteira cadastrada.' })
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
    <form noValidate onSubmit={handleSubmit} className="mt-5 grid gap-4">
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-label`}>Nome</Label>
        <Input
          id={`${prefix}-label`}
          value={form.label}
          onChange={(event) => setField('label', event.target.value)}
          aria-invalid={Boolean(errors.label)}
          aria-describedby={describedBy('label')}
        />
        <FieldError id={`${prefix}-label-error`} message={errors.label} />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-address`}>Endereco</Label>
        <Input
          id={`${prefix}-address`}
          value={form.address}
          placeholder="0x..."
          spellCheck={false}
          autoCapitalize="off"
          onChange={(event) => setField('address', event.target.value)}
          aria-invalid={Boolean(errors.address)}
          aria-describedby={describedBy('address')}
          className="font-mono text-xs sm:text-sm"
        />
        <FieldError id={`${prefix}-address-error`} message={errors.address} />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-network`}>Rede</Label>
        <Select
          id={`${prefix}-network`}
          value={form.network}
          onChange={(event) => setField('network', event.target.value)}
          aria-invalid={Boolean(errors.network)}
          aria-describedby={describedBy('network')}
        >
          {SUPPORTED_NETWORKS.map((network) => (
            <option key={network} value={network}>{network}</option>
          ))}
        </Select>
        <FieldError id={`${prefix}-network-error`} message={errors.network} />
      </div>
      <fieldset className="space-y-2" aria-describedby={errors.kind ? `${prefix}-kind-error` : undefined}>
        <legend className="text-xs font-semibold uppercase tracking-[0.18em] text-primarySoft">Tipo</legend>
        <div className="flex flex-wrap gap-4 text-sm">
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
      </fieldset>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant={isEdit ? 'secondary' : 'primary'} disabled={!isDirty || walletMutation.isPending} aria-busy={walletMutation.isPending}>
          <Save size={16} />
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

export function WalletsPage() {
  const { session } = useAuth()
  const userId = session?.user.id ?? ''
  const [isCreating, setIsCreating] = useState(false)
  const walletsQuery = useQuery({
    queryKey: ['wallets', userId],
    queryFn: getWallets,
    enabled: Boolean(userId),
  })
  const wallets = walletsQuery.data ?? []

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primarySoft">Carteiras</span>
          <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Gerencie enderecos</h1>
        </div>
        <Button onClick={() => setIsCreating((value) => !value)} aria-expanded={isCreating} aria-controls="new-wallet">
          {isCreating ? <X size={18} /> : <Plus size={18} />}
          {isCreating ? 'Fechar' : 'Nova carteira'}
        </Button>
      </div>

      {isCreating && (
        <Card id="new-wallet" className="mb-5 p-5">
          <h2 className="text-xl font-bold">Nova carteira</h2>
          <p className="mt-1 text-sm text-foreground/55">
            {wallets.length ? 'Cadastre como principal para substituir a atual, ou como secundaria.' : 'A primeira carteira sera a principal.'}
          </p>
          <WalletForm userId={userId} defaultKind={wallets.length ? 'secundaria' : 'principal'} onDone={() => setIsCreating(false)} />
        </Card>
      )}

      {walletsQuery.isPending ? (
        <div className="grid gap-5 md:grid-cols-2" aria-busy="true">
          <div className="h-[420px] animate-pulse rounded-lg bg-card" />
          <div className="h-[420px] animate-pulse rounded-lg bg-card" />
        </div>
      ) : walletsQuery.isError ? (
        <Card className="p-6 text-center">
          <p className="font-semibold">Nao foi possivel carregar suas carteiras.</p>
          <Button className="mt-4" onClick={() => void walletsQuery.refetch()}>Tentar novamente</Button>
        </Card>
      ) : wallets.length === 0 ? (
        !isCreating && (
          <Card className="p-6 text-center">
            <p className="font-semibold">Voce ainda nao tem carteiras cadastradas.</p>
            <Button className="mt-4" onClick={() => setIsCreating(true)}>
              <Plus size={16} />
              Cadastrar carteira principal
            </Button>
          </Card>
        )
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {wallets.map((wallet) => (
            <Card key={wallet.id} className="min-w-0 p-5">
              <div className="flex items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-md bg-primary/15 text-primarySoft">
                  <WalletCards size={21} />
                </span>
                <div className="min-w-0">
                  <h2 className="break-words text-xl font-bold">{wallet.label}</h2>
                  <p className="mt-1 text-sm text-foreground/55" title={wallet.address}>
                    {shortenAddress(wallet.address)} · {wallet.network}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge>{wallet.kind === 'principal' ? 'Principal' : 'Secundaria'}</Badge>
                    {wallet.status === 'pendente' && <Badge className="border-border bg-transparent text-foreground/60">Pendente de verificacao</Badge>}
                  </div>
                </div>
              </div>
              {/* A chave inclui o tipo: quando outra carteira vira principal, o form reinicia com o valor atual. */}
              <WalletForm key={`${wallet.id}-${wallet.kind}`} userId={userId} wallet={wallet} defaultKind={wallet.kind} />
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
