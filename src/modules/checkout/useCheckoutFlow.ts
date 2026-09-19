import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import type { CreateOrderRequest, Order, QuoteResponse, WalletConnection, WalletProvider } from '../../contracts/api'
import { parseApiError } from '../../lib/apiError'
import { compareEth } from '../../lib/eth'
import { getProfile, getWallets } from '../account/api'
import { useAuth } from '../auth/useAuth'
import { useCart } from '../cart/useCart'
import { connectWallet, createOrder } from './api'
import { clearSubmittedAttempt, readSubmittedAttempt, saveSubmittedAttempt } from './attempt'

export type CollectorForm = {
  displayName: string
  username: string
  email: string
  note: string
}

export type CheckoutField = keyof CollectorForm | 'walletId' | 'network' | 'provider' | 'connection'
export type CheckoutErrors = Partial<Record<CheckoutField, string>>
export type CheckoutStep = 'details' | 'review'

export const walletProviders: Array<{ id: WalletProvider; label: string }> = [
  { id: 'metamask', label: 'MetaMask' },
  { id: 'walletconnect', label: 'WalletConnect' },
  { id: 'coinbase', label: 'Coinbase Wallet' },
]

// Mesmas regras do servidor; a API continua sendo a validacao final.
function validateCollector(form: CollectorForm): CheckoutErrors {
  const errors: CheckoutErrors = {}
  if (form.displayName.trim().length < 2) errors.displayName = 'Informe pelo menos 2 caracteres.'
  if (!/^[a-z0-9._]{3,24}$/.test(form.username.trim())) errors.username = 'Use 3 a 24 letras minusculas, numeros, ponto ou _.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'Informe um e-mail valido.'
  if (form.note.length > 280) errors.note = 'Use no maximo 280 caracteres.'
  return errors
}

function fromServerFields(fields: Record<string, string>): CheckoutErrors {
  const errors: CheckoutErrors = {}
  for (const [key, message] of Object.entries(fields)) {
    errors[key.replace(/^collector\./, '') as CheckoutField] = message
  }
  return errors
}

// Timeout, queda de conexao e 5xx podem ter criado o pedido: reenviar com a mesma chave e seguro.
function isTransient(error: unknown) {
  const { status } = parseApiError(error, '')
  return status === undefined || status >= 500
}

function quoteDiffers(reviewed: QuoteResponse, current: QuoteResponse | null) {
  if (!current) return false
  return (
    current.stale ||
    current.quoteVersion !== reviewed.quoteVersion ||
    compareEth(current.totalEth, reviewed.totalEth) !== 0
  )
}

export function useCheckoutFlow() {
  const { session, expireSession } = useAuth()
  const userId = session?.user.id ?? ''
  const cart = useCart()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const profileQuery = useQuery({ queryKey: ['profile', userId], queryFn: getProfile, enabled: Boolean(userId) })
  const walletsQuery = useQuery({ queryKey: ['wallets', userId], queryFn: getWallets, enabled: Boolean(userId) })
  const wallets = walletsQuery.data ?? []

  const [form, setForm] = useState<CollectorForm | null>(null)
  const [walletId, setWalletId] = useState<string | null>(null)
  const [network, setNetworkState] = useState<string | null>(null)
  const [provider, setProviderState] = useState<WalletProvider>('metamask')
  const [connection, setConnection] = useState<WalletConnection | null>(null)
  const [errors, setErrors] = useState<CheckoutErrors>({})
  // Tentativa ja confirmada antes de um refresh/queda (RequireAuth garante a sessao no 1o render).
  const [recoveredAttempt] = useState(() => (userId ? readSubmittedAttempt(userId) : null))
  const [step, setStep] = useState<CheckoutStep>(recoveredAttempt ? 'review' : 'details')
  const [reviewedQuote, setReviewedQuote] = useState<QuoteResponse | null>(null)
  const [reviewedPayload, setReviewedPayload] = useState<CreateOrderRequest | null>(null)
  // Tentativa ja enviada e ainda sem resposta definitiva: reenvios usam exatamente este payload.
  const [pendingAttempt, setPendingAttempt] = useState<CreateOrderRequest | null>(recoveredAttempt?.payload ?? null)
  const [isRevalidating, setIsRevalidating] = useState(false)
  const [notice, setNotice] = useState<string | null>(recoveredAttempt ? 'Retomando sua compra em andamento...' : null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const submittingRef = useRef(false)
  const recoveredRef = useRef(false)

  // Formulario pre-preenchido com o perfil ate o usuario editar.
  const profile = profileQuery.data
  const values: CollectorForm = form ?? {
    displayName: profile?.name ?? '',
    username: profile?.username ?? '',
    email: profile?.email ?? '',
    note: '',
  }
  const selectedWallet =
    wallets.find((wallet) => wallet.id === walletId) ??
    wallets.find((wallet) => wallet.status === 'conectada') ??
    wallets[0]
  const selectedNetwork = network ?? selectedWallet?.network ?? ''
  const isConnected = Boolean(
    connection && selectedWallet && connection.walletId === selectedWallet.id && connection.network === selectedNetwork,
  )

  const resetConnection = (message?: string) => {
    setConnection(null)
    if (step === 'review') {
      setStep('details')
      setNotice(message ?? 'A carteira foi alterada. Conecte novamente para revisar o pedido.')
    }
  }

  const connectMutation = useMutation({
    mutationFn: connectWallet,
    onMutate: () => setErrors((current) => ({ ...current, connection: undefined, walletId: undefined, network: undefined })),
    onSuccess: (result) => setConnection(result),
    onError: (error) => {
      const parsed = parseApiError(error, 'Nao foi possivel conectar a carteira.')
      if (parsed.status === 401) return expireSession()
      if (parsed.code === 'WALLET_REJECTED') {
        setErrors((current) => ({ ...current, connection: 'Conexao recusada na carteira. Aprove a solicitacao e tente novamente.' }))
        return
      }
      setErrors((current) => ({ ...current, ...fromServerFields(parsed.fields), connection: parsed.message }))
    },
  })

  const orderMutation = useMutation({
    mutationKey: ['create-order'],
    mutationFn: createOrder,
    retry: (failureCount, error) => failureCount < 3 && isTransient(error),
    retryDelay: (attempt) => 600 * 2 ** attempt,
  })

  const finishWithOrder = (order: Order) => {
    clearSubmittedAttempt(userId)
    setPendingAttempt(null)
    void queryClient.invalidateQueries({ queryKey: ['cart'] })
    void queryClient.invalidateQueries({ queryKey: ['quote'] })
    void queryClient.invalidateQueries({ queryKey: ['collection', userId] })
    void navigate({ to: '/confirmacao', search: { pedido: order.id }, replace: true })
  }

  const submit = (payload: CreateOrderRequest) => {
    submittingRef.current = true
    orderMutation.mutate(payload, {
      onSuccess: finishWithOrder,
      onError: (error) => {
        const parsed = parseApiError(error, 'Nao foi possivel enviar o pedido.')
        if (parsed.status === 401) {
          // A tentativa fica salva: apos novo login ela e reenviada com a mesma chave.
          expireSession()
          return
        }
        if (isTransient(error)) {
          setSubmitError(`${parsed.message} Seus itens continuam no carrinho. Tente novamente: o mesmo pedido sera recuperado, sem cobranca duplicada.`)
          return
        }

        // Recusa definitiva desta tentativa: exige nova revisao (e nova chave).
        clearSubmittedAttempt(userId)
        setPendingAttempt(null)
        setReviewedPayload(null)
        setReviewedQuote(null)
        setStep('details')
        if (parsed.code === 'QUOTE_CHANGED') {
          void cart.refreshQuote()
          setNotice('A cotacao mudou antes da confirmacao. Revise os valores e confirme novamente.')
        } else {
          setErrors(fromServerFields(parsed.fields))
          setNotice(parsed.message)
        }
      },
      onSettled: () => {
        submittingRef.current = false
      },
    })
  }

  // Recuperacao apos refresh/queda: reenvia a tentativa ja confirmada com a mesma chave.
  useEffect(() => {
    if (!recoveredAttempt || recoveredRef.current) return
    recoveredRef.current = true
    submit(recoveredAttempt.payload)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- executa uma unica vez na montagem
  }, [])

  const goToReview = async () => {
    setNotice(null)
    setSubmitError(null)
    const nextErrors = validateCollector(values)
    if (!selectedWallet) nextErrors.walletId = 'Cadastre uma carteira para continuar.'
    else if (selectedWallet.status !== 'conectada') nextErrors.walletId = 'Esta carteira ainda esta pendente de verificacao.'
    else if (selectedWallet.network !== selectedNetwork) nextErrors.network = `A carteira ${selectedWallet.label} opera na rede ${selectedWallet.network}.`
    if (selectedWallet && !isConnected && !nextErrors.walletId && !nextErrors.network) {
      nextErrors.connection = 'Conecte a carteira para continuar.'
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length || !selectedWallet) return

    setIsRevalidating(true)
    try {
      // Revalida preco, disponibilidade, cupom e taxas na API antes de montar a revisao.
      const quote = await cart.refreshQuote()
      if (!quote.lines.length) {
        setNotice('Seu carrinho esta vazio.')
        return
      }
      if (quote.stale) {
        setNotice('A cotacao do carrinho mudou. Aceite os valores atuais para continuar.')
        return
      }
      setReviewedQuote(quote)
      setReviewedPayload({
        idempotencyKey: crypto.randomUUID(),
        quoteVersion: quote.quoteVersion,
        expectedTotalEth: quote.totalEth,
        walletId: selectedWallet.id,
        network: selectedNetwork,
        provider,
        collector: {
          displayName: values.displayName.trim(),
          username: values.username.trim(),
          email: values.email.trim(),
          note: values.note.trim() || undefined,
        },
      })
      setStep('review')
    } catch (error) {
      const parsed = parseApiError(error, 'Nao foi possivel revalidar a cotacao.')
      if (parsed.status === 401) return expireSession()
      setNotice(parsed.message)
    } finally {
      setIsRevalidating(false)
    }
  }

  const quoteChangedSinceReview = Boolean(reviewedQuote && !pendingAttempt && quoteDiffers(reviewedQuote, cart.quote))

  const confirm = () => {
    if (submittingRef.current || orderMutation.isPending) return
    setSubmitError(null)
    if (pendingAttempt) return submit(pendingAttempt)
    if (!reviewedPayload || quoteChangedSinceReview || !isConnected) return
    saveSubmittedAttempt(userId, reviewedPayload)
    setPendingAttempt(reviewedPayload)
    submit(reviewedPayload)
  }

  return {
    isLoading: profileQuery.isPending || walletsQuery.isPending,
    loadError: profileQuery.isError || walletsQuery.isError,
    values,
    setField: (field: keyof CollectorForm, value: string) => {
      setForm({ ...values, [field]: value })
      setErrors((current) => ({ ...current, [field]: undefined }))
    },
    errors,
    wallets,
    selectedWallet,
    selectWallet: (id: string) => {
      const wallet = wallets.find((item) => item.id === id)
      setWalletId(id)
      setNetworkState(wallet?.network ?? null)
      setErrors((current) => ({ ...current, walletId: undefined, network: undefined, connection: undefined }))
      resetConnection()
    },
    network: selectedNetwork,
    setNetwork: (value: string) => {
      setNetworkState(value)
      setErrors((current) => ({ ...current, network: undefined, connection: undefined }))
      resetConnection()
    },
    provider,
    setProvider: (value: WalletProvider) => {
      setProviderState(value)
      resetConnection()
    },
    connection: isConnected ? connection : null,
    connect: () => {
      if (!selectedWallet) return
      connectMutation.mutate({ walletId: selectedWallet.id, network: selectedNetwork, provider })
    },
    disconnect: () => resetConnection('Carteira desconectada. Conecte novamente para revisar o pedido.'),
    isConnecting: connectMutation.isPending,
    step,
    goToReview,
    isRevalidating,
    backToDetails: () => {
      setStep('details')
      setReviewedPayload(null)
      setReviewedQuote(null)
    },
    reviewedQuote,
    reviewedPayload: reviewedPayload ?? pendingAttempt,
    quoteChangedSinceReview,
    confirm,
    isSubmitting: orderMutation.isPending,
    submitError,
    notice,
    hasPendingAttempt: Boolean(pendingAttempt),
  }
}

export type CheckoutFlow = ReturnType<typeof useCheckoutFlow>
