import axios from 'axios'
import type { ApiErrorCode, ApiErrorResponse } from '../contracts/api'

export type ParsedApiError = {
  // undefined quando nao houve resposta (falha de rede ou timeout do Axios).
  status?: number
  code?: ApiErrorCode
  message: string
  fields: Record<string, string>
}

export function parseApiError(error: unknown, fallback: string): ParsedApiError {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const payload = error.response?.data?.error
    return {
      status: error.response?.status,
      code: payload?.code,
      message: payload?.message ?? fallback,
      fields: payload?.fields ?? {},
    }
  }
  return { message: fallback, fields: {} }
}

export function readApiError(error: unknown, fallback: string) {
  return parseApiError(error, fallback).message
}
