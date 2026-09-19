import type { CreateOrderRequest } from '../../contracts/api'

// Tentativa de compra ja confirmada pelo usuario. Guardada por usuario na sessionStorage para
// que um refresh ou reconexao reenvie a MESMA chave de idempotencia e recupere o mesmo pedido.
export type SubmittedAttempt = {
  payload: CreateOrderRequest
  submittedAt: string
}

const keyFor = (userId: string) => `kurio-checkout-attempt:${userId}`

export function readSubmittedAttempt(userId: string): SubmittedAttempt | null {
  try {
    const raw = sessionStorage.getItem(keyFor(userId))
    return raw ? (JSON.parse(raw) as SubmittedAttempt) : null
  } catch {
    return null
  }
}

export function saveSubmittedAttempt(userId: string, payload: CreateOrderRequest) {
  try {
    sessionStorage.setItem(keyFor(userId), JSON.stringify({ payload, submittedAt: new Date().toISOString() }))
  } catch {
    // Sem storage a recuperacao apos refresh fica indisponivel, mas a compra segue normalmente.
  }
}

export function clearSubmittedAttempt(userId: string) {
  try {
    sessionStorage.removeItem(keyFor(userId))
  } catch {
    // ignore
  }
}
