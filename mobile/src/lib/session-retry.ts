import type { ApiResult } from './types'

export type SupabaseError = { code?: string; message?: string } | null

export interface SessionRefreshClient {
  auth: {
    refreshSession: () => Promise<{ data: { session: unknown }; error: SupabaseError }>
  }
}

export const SESSION_EXPIRED_MESSAGE = 'Tu sesión venció. Cerrá sesión en Más y volvé a ingresar.'

const JWT_CODES = new Set(['PGRST301', 'PGRST302', 'PGRST303'])

export function isJwtError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const err = error as { code?: unknown; message?: unknown }
  const code = typeof err.code === 'string' ? err.code.toUpperCase() : ''
  if (JWT_CODES.has(code)) return true

  const message = typeof err.message === 'string' ? err.message.toLowerCase() : ''
  return (
    message.includes('jwt') ||
    message.includes('token is expired') ||
    message.includes('session missing') ||
    message.includes('no suitable key') ||
    message.includes('invalid claim')
  )
}

export function failureResult<T>(error: unknown, fallback: string): ApiResult<T> {
  const message = error && typeof error === 'object' && 'message' in error
    ? String((error as { message?: unknown }).message)
    : String(error || fallback)
  return { success: false, error: message || fallback }
}

/**
 * Runs a Supabase query/RPC factory and transparently refreshes the session
 * and retries once if PostgREST rejects the request due to an expired JWT.
 */
export async function resolveWithSessionRetry<T>(
  client: SessionRefreshClient | null,
  run: () => PromiseLike<{ data: T | null; error: SupabaseError }>,
  fallback: string
): Promise<ApiResult<T>> {
  try {
    const { data, error } = await run()
    if (!error) return { success: true, data: data as T }

    if (client && isJwtError(error)) {
      const refreshed = await client.auth.refreshSession()
      if (!refreshed.error && refreshed.data.session) {
        const retry = await run()
        if (!retry.error) return { success: true, data: retry.data as T }
        if (isJwtError(retry.error)) return { success: false, error: SESSION_EXPIRED_MESSAGE }
        return failureResult(retry.error, fallback)
      }
      return { success: false, error: SESSION_EXPIRED_MESSAGE }
    }

    return failureResult(error, fallback)
  } catch (error) {
    return failureResult(error, fallback)
  }
}

