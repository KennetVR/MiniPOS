import assert from 'node:assert/strict'
import test from 'node:test'
import { createSupabaseApi } from './supabase-api.ts'

function makeClient(profile) {
  const calls = []
  const client = {
    auth: {
      signInWithPassword: async (credentials) => {
        calls.push(['signInWithPassword', credentials])
        return { data: { user: { id: 'auth-user-1', email: credentials.email } }, error: null }
      },
      signOut: async () => {
        calls.push(['signOut'])
        return { error: null }
      }
    },
    from: (table) => {
      calls.push(['from', table])
      const query = {
        select(columns) { calls.push(['select', columns]); return query },
        eq(column, value) { calls.push(['eq', column, value]); return query },
        single: async () => ({ data: profile, error: null })
      }
      return query
    }
  }
  return { client, calls }
}

function makeQuery(data) {
  const query = {
    select() { return query },
    eq() { return query },
    order() { return query },
    in() { return query },
    gte() { return query },
    lte() { return query },
    ilike() { return query },
    single: async () => ({ data, error: null }),
    then(resolve, reject) {
      return Promise.resolve({ data, error: null }).then(resolve, reject)
    }
  }
  return query
}

test('login maps an authenticated active profile to the MiniPOS session', async () => {
  const { client, calls } = makeClient({
    id: 'auth-user-1',
    username: 'seller@example.invalid',
    nombre: 'Seller',
    role: 'seller',
    estado: true
  })
  const api = createSupabaseApi(client)

  const response = await api.auth.login('seller@example.invalid', 'password')

  assert.deepEqual(response, {
    success: true,
    data: {
      id_usuario: 'auth-user-1',
      username: 'seller@example.invalid',
      nombre: 'Seller',
      rol: 'vendedor'
    }
  })
  assert.deepEqual(calls[0], ['signInWithPassword', { email: 'seller@example.invalid', password: 'password' }])
  assert.ok(calls.some((call) => call[0] === 'eq' && call[1] === 'id' && call[2] === 'auth-user-1'))
})

test('login signs out an authenticated identity that has no active profile', async () => {
  const { client, calls } = makeClient(null)
  const api = createSupabaseApi(client)

  const response = await api.auth.login('orphan@example.invalid', 'password')

  assert.equal(response.success, false)
  assert.ok(calls.some((call) => call[0] === 'signOut'))
})

test('logout revokes the Supabase session', async () => {
  const { client, calls } = makeClient(null)
  const api = createSupabaseApi(client)

  const response = await api.auth.logout()

  assert.deepEqual(response, { success: true })
  assert.ok(calls.some((call) => call[0] === 'signOut'))
})

test('business operations fail explicitly when Supabase is not configured', async () => {
  const api = createSupabaseApi(null)

  const products = await api.producto.getAll()
  const sale = await api.venta.crear({
    id_usuario: 'auth-user-1',
    detalles: [{ id_producto: 1, cantidad: 1 }],
    forma_pago: 'cash',
    descuento: 0
  })

  assert.deepEqual(products, { success: false, error: 'Supabase no está configurado' })
  assert.deepEqual(sale, { success: false, error: 'Supabase no está configurado' })
})

test('sale delegates pricing and stock mutation to the database RPC', async () => {
  const calls = []
  const client = {
    auth: {},
    rpc: async (name, args) => {
      calls.push([name, args])
      return { data: 7, error: null }
    },
    from: (table) => table === 'venta'
      ? makeQuery({
          id: 7,
          id_usuario: 'auth-user-1',
          fecha: '2026-11-06T12:00:00.000Z',
          numero_boleta: '2026-000007',
          subtotal: 10,
          descuento: 0,
          igv: 1.8,
          total: 11.8,
          forma_pago: 'cash',
          estado: 'completada'
        })
      : makeQuery([])
  }
  const api = createSupabaseApi(client)

  const response = await api.venta.crear({
    id_usuario: 'auth-user-1',
    detalles: [{ id_producto: 1, cantidad: 1, precio_unitario: 999, descuento: 0 }],
    forma_pago: 'cash',
    descuento: 0
  })

  assert.equal(response.success, true)
  assert.deepEqual(response.data, { id_venta: 7, numero_boleta: '2026-000007', total: 11.8 })
  assert.deepEqual(calls, [[
    'create_sale',
    { p_detalles: [{ id_producto: 1, cantidad: 1, descuento: 0 }], p_forma_pago: 'cash', p_descuento: 0 }
  ]])
})

test('receipt data is loaded from Supabase before local printing', async () => {
  const sale = {
    id: 8,
    id_usuario: 'auth-user-1',
    fecha: '2026-11-06T12:00:00.000Z',
    numero_boleta: '2026-000008',
    subtotal: 10,
    descuento: 0,
    igv: 1.8,
    total: 11.8,
    forma_pago: 'cash',
    estado: 'completada'
  }
  const client = {
    auth: {},
    from: (table) => {
      if (table === 'venta') return makeQuery(sale)
      if (table === 'detalle_venta') return makeQuery([])
      if (table === 'configuracion') return makeQuery([{ clave: 'nombre_negocio', valor: 'Shared Store' }])
      if (table === 'profiles') return makeQuery({ id: 'auth-user-1', nombre: 'Cashier', username: 'cashier', estado: true })
      throw new Error(`Unexpected table: ${table}`)
    }
  }
  const api = createSupabaseApi(client)

  const response = await api.impresion.getBoleta(8)

  assert.equal(response.success, true)
  assert.equal(response.data.venta.usuario_nombre, 'Cashier')
  assert.equal(response.data.config.nombre_negocio, 'Shared Store')
  assert.deepEqual(response.data.detalles, [])
})
