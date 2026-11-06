import type { SupabaseClient } from '@supabase/supabase-js'

import type {
  ApiResult,
  AppSetting,
  Category,
  DashboardSummary,
  NewProductInput,
  Product,
  ReceiptLine,
  SaleLine,
  SaleSummary,
  UserProfile,
  UserSession
} from './types'

type Row = Record<string, unknown>
type SupabaseError = { message?: string } | null

const PRODUCT_SELECT = `
  id,
  id_categoria,
  codigo_barras,
  nombre,
  descripcion,
  precio_compra,
  precio_venta,
  stock,
  stock_minimo,
  id_proveedor,
  activo,
  created_at,
  updated_at,
  categoria:categoria(nombre),
  proveedor:proveedor(nombre)
`

function unavailable<T>(): ApiResult<T> {
  return { success: false, error: 'Supabase no está configurado' }
}

function failure<T>(error: unknown, fallback: string): ApiResult<T> {
  const message = error && typeof error === 'object' && 'message' in error
    ? String((error as { message?: unknown }).message)
    : String(error || fallback)
  return { success: false, error: message || fallback }
}

async function resolve<T>(
  result: PromiseLike<{ data: T | null; error: SupabaseError }>,
  fallback: string
): Promise<ApiResult<T>> {
  try {
    const { data, error } = await result
    if (error) return failure(error, fallback)
    return { success: true, data: data as T }
  } catch (error) {
    return failure(error, fallback)
  }
}

function asNumber(value: unknown): number {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function nestedName(value: unknown): string | undefined {
  if (Array.isArray(value)) return nestedName(value[0])
  if (value && typeof value === 'object' && 'nombre' in value) {
    const name = (value as { nombre?: unknown }).nombre
    return name == null ? undefined : String(name)
  }
  return undefined
}

function mapProfile(row: Row): UserProfile {
  return {
    id_usuario: String(row.id),
    username: String(row.username ?? ''),
    nombre: String(row.nombre ?? row.username ?? ''),
    rol: row.role === 'administrator' ? 'administrador' : 'vendedor',
    estado: row.estado !== false,
    created_at: String(row.created_at ?? '')
  }
}

function toSession(profile: UserProfile): UserSession {
  return {
    id_usuario: profile.id_usuario,
    username: profile.username,
    nombre: profile.nombre,
    rol: profile.rol
  }
}

function mapCategory(row: Row): Category {
  return {
    id_categoria: asNumber(row.id),
    nombre: String(row.nombre ?? ''),
    descripcion: row.descripcion == null ? null : String(row.descripcion),
    estado: row.estado !== false
  }
}

function mapProduct(row: Row): Product {
  return {
    id_producto: asNumber(row.id),
    codigo_barras: row.codigo_barras == null ? null : String(row.codigo_barras),
    nombre: String(row.nombre ?? ''),
    descripcion: row.descripcion == null ? null : String(row.descripcion),
    id_categoria: asNumber(row.id_categoria),
    categoria_nombre: nestedName(row.categoria),
    precio_compra: asNumber(row.precio_compra),
    precio_venta: asNumber(row.precio_venta),
    stock_actual: asNumber(row.stock),
    stock_minimo: asNumber(row.stock_minimo),
    id_proveedor: row.id_proveedor == null ? null : asNumber(row.id_proveedor),
    proveedor_nombre: nestedName(row.proveedor),
    estado: row.activo !== false,
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? '')
  }
}

function mapSale(row: Row): SaleSummary {
  return {
    id: asNumber(row.id),
    numero_boleta: String(row.numero_boleta ?? ''),
    fecha: String(row.fecha ?? ''),
    total: asNumber(row.total),
    estado: row.estado === 'anulada' ? 'anulada' : 'completada'
  }
}

function success<T>(data: T): ApiResult<T> {
  return { success: true, data }
}

function todayStart(): string {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date.toISOString()
}

export function createMobileApi(client: SupabaseClient | null) {
  const getProfile = async (userId: string): Promise<ApiResult<UserProfile>> => {
    if (!client) return unavailable()
    const result = await resolve<Row>(
      client.from('profiles').select('id,username,nombre,role,estado,created_at').eq('id', userId).single<Row>(),
      'No se pudo cargar el perfil'
    )
    return result.success ? success(mapProfile(result.data)) : result
  }

  const loadSession = async (): Promise<ApiResult<UserSession | null>> => {
    if (!client) return unavailable()
    const { data, error } = await client.auth.getUser()
    if (error || !data.user) return success(null)

    const profile = await getProfile(data.user.id)
    if (!profile.success || !profile.data.estado) {
      await client.auth.signOut()
      return success(null)
    }
    return success(toSession(profile.data))
  }

  const loadProducts = async (): Promise<ApiResult<Product[]>> => {
    if (!client) return unavailable()
    const result = await resolve<Row[]>(
      client.from('producto').select(PRODUCT_SELECT).eq('activo', true).order('nombre', { ascending: true }),
      'No se pudieron cargar los productos'
    )
    return result.success ? success((result.data ?? []).map(mapProduct)) : result
  }

  const auth = {
    login: async (email: string, password: string): Promise<ApiResult<UserSession>> => {
      if (!client) return unavailable()
      const { data, error } = await client.auth.signInWithPassword({ email: email.trim(), password })
      if (error || !data.user) return failure(error, 'Error de autenticación')
      const profile = await getProfile(data.user.id)
      if (!profile.success || !profile.data.estado) {
        await client.auth.signOut()
        return { success: false, error: 'La cuenta no tiene un perfil activo de MiniPOS' }
      }
      return success(toSession(profile.data))
    },
    current: loadSession,
    logout: async (): Promise<ApiResult<void>> => {
      if (!client) return unavailable()
      const { error } = await client.auth.signOut()
      return error ? failure(error, 'No se pudo cerrar la sesión') : success(undefined)
    },
    changePassword: async (currentPassword: string, newPassword: string): Promise<ApiResult<void>> => {
      if (!client) return unavailable()
      const { data, error } = await client.auth.getUser()
      if (error || !data.user?.email) return failure(error, 'La sesión no corresponde al usuario activo')
      const reauth = await client.auth.signInWithPassword({ email: data.user.email, password: currentPassword })
      if (reauth.error) return { success: false, error: 'Contraseña actual incorrecta' }
      const result = await client.auth.updateUser({ password: newPassword })
      return result.error ? failure(result.error, 'No se pudo cambiar la contraseña') : success(undefined)
    }
  }

  const products = {
    list: loadProducts,
    byBarcode: async (barcode: string): Promise<ApiResult<Product | null>> => {
      if (!client) return unavailable()
      const result = await resolve<Row | null>(
        client.from('producto').select(PRODUCT_SELECT).eq('codigo_barras', barcode.trim()).eq('activo', true).maybeSingle<Row>(),
        'No se pudo buscar el código de barras'
      )
      return result.success ? success(result.data ? mapProduct(result.data) : null) : result
    },
    create: async (input: NewProductInput): Promise<ApiResult<number>> => {
      if (!client) return unavailable()
      const result = await resolve<unknown>(client.rpc('create_product', {
        p_id_categoria: input.id_categoria,
        p_codigo_barras: input.codigo_barras.trim() || null,
        p_nombre: input.nombre.trim(),
        p_descripcion: input.descripcion.trim() || null,
        p_precio_compra: input.precio_compra,
        p_precio_venta: input.precio_venta,
        p_stock_minimo: input.stock_minimo,
        p_id_proveedor: input.id_proveedor,
        p_stock_inicial: input.stock_inicial
      }), 'No se pudo crear el producto')
      return result.success ? success(asNumber(result.data)) : result
    },
    update: async (id: number, input: Partial<NewProductInput>): Promise<ApiResult<void>> => {
      if (!client) return unavailable()
      const result = await resolve<void>(client.from('producto').update({
        id_categoria: input.id_categoria,
        codigo_barras: input.codigo_barras?.trim() || null,
        nombre: input.nombre?.trim(),
        descripcion: input.descripcion?.trim() || null,
        precio_compra: input.precio_compra,
        precio_venta: input.precio_venta,
        stock_minimo: input.stock_minimo,
        id_proveedor: input.id_proveedor
      }).eq('id', id), 'No se pudo actualizar el producto')
      return result.success ? success(undefined) : result
    }
  }

  const categories = {
    list: async (): Promise<ApiResult<Category[]>> => {
      if (!client) return unavailable()
      const result = await resolve<Row[]>(client.from('categoria').select('id,nombre,descripcion,estado').eq('estado', true).order('nombre'), 'No se pudieron cargar las categorías')
      return result.success ? success((result.data ?? []).map(mapCategory)) : result
    },
    create: async (nombre: string, descripcion: string): Promise<ApiResult<number>> => {
      if (!client) return unavailable()
      const result = await resolve<Row>(client.from('categoria').insert({ nombre: nombre.trim(), descripcion: descripcion.trim() || null }).select('id').single<Row>(), 'No se pudo crear la categoría')
      return result.success ? success(asNumber(result.data.id)) : result
    },
    update: async (id: number, nombre: string, descripcion: string): Promise<ApiResult<void>> => {
      if (!client) return unavailable()
      const result = await resolve<void>(client.from('categoria').update({ nombre: nombre.trim(), descripcion: descripcion.trim() || null }).eq('id', id), 'No se pudo actualizar la categoría')
      return result.success ? success(undefined) : result
    },
    deactivate: async (id: number): Promise<ApiResult<void>> => {
      if (!client) return unavailable()
      const result = await resolve<void>(client.from('categoria').update({ estado: false }).eq('id', id), 'No se pudo desactivar la categoría')
      return result.success ? success(undefined) : result
    }
  }

  const inventory = {
    createReceipt: async (receiptNumber: string, lines: ReceiptLine[], supplierId: number | null = null): Promise<ApiResult<number>> => {
      if (!client) return unavailable()
      const result = await resolve<unknown>(client.rpc('create_inventory_receipt', {
        p_id_proveedor: supplierId,
        p_numero_comprobante: receiptNumber.trim(),
        p_items: lines.map(({ id_producto, cantidad, precio_compra }) => ({ id_producto, cantidad, precio_compra }))
      }), 'No se pudo registrar el ingreso de inventario')
      return result.success ? success(asNumber(result.data)) : result
    }
  }

  const sales = {
    create: async (lines: SaleLine[], paymentMethod: string, discount: number): Promise<ApiResult<number>> => {
      if (!client) return unavailable()
      const result = await resolve<unknown>(client.rpc('create_sale', {
        p_detalles: lines.map(({ id_producto, cantidad, descuento }) => ({ id_producto, cantidad, descuento })),
        p_forma_pago: paymentMethod,
        p_descuento: discount
      }), 'No se pudo registrar la venta')
      return result.success ? success(asNumber(result.data)) : result
    }
  }

  const users = {
    list: async (): Promise<ApiResult<UserProfile[]>> => {
      if (!client) return unavailable()
      const result = await resolve<Row[]>(client.from('profiles').select('id,username,nombre,role,estado,created_at').order('nombre'), 'No se pudieron cargar los usuarios')
      return result.success ? success((result.data ?? []).map(mapProfile)) : result
    },
    update: async (id: string, nombre: string, rol: UserProfile['rol']): Promise<ApiResult<void>> => {
      if (!client) return unavailable()
      const result = await resolve<void>(client.from('profiles').update({ nombre: nombre.trim(), role: rol === 'administrador' ? 'administrator' : 'seller' }).eq('id', id), 'No se pudo actualizar el usuario')
      return result.success ? success(undefined) : result
    },
    toggleState: async (user: UserProfile): Promise<ApiResult<void>> => {
      if (!client) return unavailable()
      const result = await resolve<void>(client.from('profiles').update({ estado: !user.estado }).eq('id', user.id_usuario), 'No se pudo cambiar el estado del usuario')
      return result.success ? success(undefined) : result
    }
  }

  const settings = {
    list: async (): Promise<ApiResult<AppSetting[]>> => {
      if (!client) return unavailable()
      const result = await resolve<Row[]>(client.from('configuracion').select('clave,valor,descripcion').order('clave'), 'No se pudo cargar la configuración')
      return result.success
        ? success((result.data ?? []).map((row) => ({ clave: String(row.clave), valor: String(row.valor ?? ''), descripcion: row.descripcion == null ? null : String(row.descripcion) })))
        : result
    },
    update: async (setting: AppSetting): Promise<ApiResult<void>> => {
      if (!client) return unavailable()
      const result = await resolve<void>(client.from('configuracion').update({ valor: setting.valor, descripcion: setting.descripcion }).eq('clave', setting.clave), 'No se pudo actualizar la configuración')
      return result.success ? success(undefined) : result
    }
  }

  const dashboard = {
    summary: async (): Promise<ApiResult<DashboardSummary>> => {
      if (!client) return unavailable()
      const [productsResult, salesResult] = await Promise.all([
        resolve<Row[]>(client.from('producto').select('id,stock,stock_minimo').eq('activo', true), 'No se pudo cargar el inventario'),
        resolve<Row[]>(client.from('venta').select('id,numero_boleta,fecha,total,estado').gte('fecha', todayStart()).order('fecha', { ascending: false }).limit(10), 'No se pudieron cargar las ventas')
      ])
      if (!productsResult.success) return productsResult
      if (!salesResult.success) return salesResult
      const products = productsResult.data ?? []
      const sales = (salesResult.data ?? []).map(mapSale)
      return success({
        productCount: products.length,
        lowStockCount: products.filter((product) => asNumber(product.stock) <= asNumber(product.stock_minimo)).length,
        todaySales: sales.filter((sale) => sale.estado === 'completada').length,
        todayRevenue: sales.filter((sale) => sale.estado === 'completada').reduce((total, sale) => total + sale.total, 0),
        recentSales: sales
      })
    }
  }

  return { auth, products, categories, inventory, sales, users, settings, dashboard }
}
