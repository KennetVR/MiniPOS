import assert from 'node:assert/strict'
import test from 'node:test'

import { isJwtError, resolveWithSessionRetry, SESSION_EXPIRED_MESSAGE } from '../src/lib/session-retry'

test('isJwtError detects PostgREST JWT codes and common JWT messages', () => {
  assert.equal(isJwtError({ code: 'PGRST301', message: 'JWT expired' }), true)
  assert.equal(isJwtError({ message: 'No suitable key or wrong key type' }), true)
  assert.equal(isJwtError({ message: 'Auth session missing!' }), true)
  assert.equal(isJwtError({ message: 'insufficient_stock' }), false)
  assert.equal(isJwtError(null), false)
})

test('resolveWithSessionRetry refreshes session and retries once on JWT error', async () => {
  let attempts = 0
  let refreshes = 0
  const client = {
    auth: {
      refreshSession: async () => {
        refreshes += 1
        return { data: { session: { access_token: 'fresh' } }, error: null }
      }
    }
  }

  const result = await resolveWithSessionRetry(
    client,
    async () => {
      attempts += 1
      if (attempts === 1) return { data: null, error: { code: 'PGRST301', message: 'JWT expired' } }
      return { data: 42, error: null }
    },
    'Error'
  )

  assert.equal(attempts, 2)
  assert.equal(refreshes, 1)
  assert.deepEqual(result, { success: true, data: 42 })
})

test('resolveWithSessionRetry returns friendly Spanish error if refresh fails', async () => {
  const client = {
    auth: {
      refreshSession: async () => ({ data: { session: null }, error: { message: 'Refresh Token Not Found' } })
    }
  }

  const result = await resolveWithSessionRetry(
    client,
    async () => ({ data: null, error: { code: 'PGRST301', message: 'JWT expired' } }),
    'Error'
  )

  assert.deepEqual(result, { success: false, error: SESSION_EXPIRED_MESSAGE })
})

test('resolveWithSessionRetry does not refresh on business errors', async () => {
  let refreshes = 0
  const client = {
    auth: {
      refreshSession: async () => {
        refreshes += 1
        return { data: { session: { access_token: 'fresh' } }, error: null }
      }
    }
  }

  const result = await resolveWithSessionRetry(
    client,
    async () => ({ data: null, error: { message: 'insufficient_stock' } }),
    'Error'
  )

  assert.equal(refreshes, 0)
  assert.deepEqual(result, { success: false, error: 'insufficient_stock' })
})

