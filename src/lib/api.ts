import axios from 'axios'

const tokenStorageKey = 'kurio-session-token'
const guestIdStorageKey = 'kurio-guest-id'

export const api = axios.create({
  baseURL: '/api',
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export type ApiError = {
  code: string
  message: string
  fields?: Record<string, string>
}

export function getSessionToken() {
  return localStorage.getItem(tokenStorageKey)
}

export function setSessionToken(token: string) {
  localStorage.setItem(tokenStorageKey, token)
}

export function clearSessionToken() {
  localStorage.removeItem(tokenStorageKey)
}

function getGuestId() {
  const current = localStorage.getItem(guestIdStorageKey)
  if (current) return current

  const next = `guest-${crypto.randomUUID()}`
  localStorage.setItem(guestIdStorageKey, next)
  return next
}

api.interceptors.request.use((config) => {
  const token = getSessionToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  config.headers['X-Guest-Id'] = getGuestId()
  return config
})
