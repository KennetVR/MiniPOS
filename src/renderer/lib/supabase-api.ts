import type { SupabaseClient } from '@supabase/supabase-js'
import type * as Models from './api'

type SupabaseError = { message?: string } | null
type Row = Record<string, unknown>
type Resolved<T> =
  | { success: true; data: T; error?: undefined }
  | { success: false; error: string; data?: undefined }

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

function unavailable<T>(): Resolved<T> {
  return { success: false, error: 'Supabase no está configurado' }
}

function failure<T>(error: unknown, fallback: string): Resolved<T> {
  const message = error && typeof error === 'object' && 'message' in error
    ? String((error as { message?: unknown }).message)
    : String(error || fallback)
  return { success: false, error: message || fallback }
}

async function resolve<T>(
  result: PromiseLike<{ data: T | null; error: SupabaseError }>,
  fallback: string
): Promise<Resolved<T>> {
  try {
    const { data, error } = await result
    if (error) return failure(error, fallback)
    return { success: true, data: data as T }
  } catch (error) {
    return failure(error, fallback)
  }
}

function asNumber(value: unknown): number {
  const result = Number(value ?? 0)
  return Number.isFinite(result) ? result : 0
}

function asOptionalNumber(value: unknown): number | null {
  return value === null || value === undefined ? null : asNumber(value)
}

function nestedName(value: unknown): string | undefined {
  if (Array.isArray(value)) return nestedName(value[0])
  if (value && typeof value === 'object' && 'nombre' in value) {
    const nombre = (value as { nombre?: unknown }).nombre
    return nombre == null ? undefined : String(nombre)
  }
  return undefined
}

function mapProfile(row: Row): Models.Usuario {
  return {
    id_usuario: String(row.id),
    username: String(row.username ?? ''),
    nombre: String(row.nombre ?? row.username ?? ''),
    rol: row.role === 'administrator' ? 'administrador' : 'vendedor',
    estado: row.estado !== false ? 1 : 0,
    created_at: String(row.created_at ?? '')
  }
}

function mapCategory(row: Row): Models.Categoria {
  return {
    id_categoria: asNumber(row.id),
    nombre: String(row.nombre ?? ''),
    descripcion: row.descripcion == null ? null : String(row.descripcion),
    estado: row.estado !== false ? 1 : 0,
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? '')
  }
}

function mapProduct(row: Row): Models.Producto {
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
    id_proveedor: asOptionalNumber(row.id_proveedor),
    proveedor_nombre: nestedName(row.proveedor),
    estado: row.activo !== false ? 1 : 0,
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? '')
  }
}

function mapSale(row: Row): Models.Venta {
  return {
    id_venta: asNumber(row.id),
    numero_boleta: String(row.numero_boleta ?? ''),
    id_usuario: String(row.id_usuario ?? ''),
    subtotal: asNumber(row.subtotal),
    descuento: asNumber(row.descuento),
    igv: asNumber(row.igv),
    total: asNumber(row.total),
    forma_pago: String(row.forma_pago ?? ''),
    estado: row.estado === 'anulada' ? 'anulada' : 'completada',
    motivo_anulacion: row.motivo_anulacion == null ? null : String(row.motivo_anulacion),
    fecha_anulacion: row.fecha_anulacion == null ? null : String(row.fecha_anulacion),
    created_at: String(row.fecha ?? ''),
    usuario_nombre: row.usuario_nombre == null ? undefined : String(row.usuario_nombre)
  }
}

function mapSaleDetail(row: Row): Models.DetalleVenta {
  const product = row.producto as Row | null | undefined
  return {
    id_detalle_venta: asNumber(row.id),
    id_venta: asNumber(row.id_venta),
    id_producto: asNumber(row.id_producto),
    cantidad: asNumber(row.cantidad),
    precio_unitario: asNumber(row.precio),
    descuento: asNumber(row.descuento),
    subtotal: row.subtotal == null
      ? asNumber(row.precio) * asNumber(row.cantidad) - asNumber(row.descuento) * asNumber(row.cantidad)
      : asNumber(row.subtotal),
    producto_nombre: product?.nombre == null ? undefined : String(product.nombre),
    codigo_barras: product?.codigo_barras == null ? undefined : String(product.codigo_barras)
  }
}

function mapExpense(row: Row): Models.Egreso {
  return {
    id_egreso: asNumber(row.id),
    fecha: String(row.fecha ?? ''),
    tipo: String(row.tipo ?? ''),
    concepto: String(row.concepto ?? ''),
    monto: asNumber(row.monto),
    comprobante: row.comprobante == null ? null : String(row.comprobante),
    beneficiario: row.beneficiario == null ? null : String(row.beneficiario),
    id_proveedor: asOptionalNumber(row.id_proveedor),
    id_usuario: String(row.id_usuario ?? ''),
    usuario_nombre: row.usuario_nombre == null ? undefined : String(row.usuario_nombre),
    proveedor_nombre: nestedName(row.proveedor),
    created_at: String(row.created_at ?? '')
  }
}

function mapIncome(row: Row): Models.Ingreso {
  return {
    id_ingreso: asNumber(row.id),
    fecha: String(row.fecha ?? ''),
    concepto: String(row.concepto ?? ''),
    monto: asNumber(row.monto),
    forma_pago: row.forma_pago == null ? null : String(row.forma_pago),
    referencia: row.referencia == null ? null : String(row.referencia),
    id_venta: asOptionalNumber(row.id_venta),
    id_usuario: String(row.id_usuario ?? ''),
    usuario_nombre: row.usuario_nombre == null ? undefined : String(row.usuario_nombre),
    created_at: String(row.created_at ?? '')
  }
}

function toDateRange(periodo: 'dia' | 'mes') {
  const now = new Date()
  const start = new Date(now)
  if (periodo === 'dia') {
    start.setHours(0, 0, 0, 0)
  } else {
    start.setDate(1)
    start.setHours(0, 0, 0, 0)
  }
  return { start: start.toISOString(), end: now.toISOString() }
}

function toDateOnly(value: Date): string {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function createSupabaseApi(client: SupabaseClient | null) {
  const getActiveProfile = async (userId: string) => client!
    .from('profiles')
    .select('id,username,nombre,role,estado,created_at')
    .eq('id', userId)
    .single<Row>()

  const toSession = (profile: Row): Models.UsuarioSession => ({
    id_usuario: String(profile.id),
    username: String(profile.username ?? ''),
    nombre: String(profile.nombre ?? profile.username ?? ''),
    rol: profile.role === 'administrator' ? 'administrador' : 'vendedor'
  })

  const loadSession = async (userId?: string): Promise<Models.ApiResponse<Models.UsuarioSession | null>> => {
    if (!client) return unavailable()

    const { data: authData, error: authError } = await client.auth.getUser()
    if (authError || !authData.user || (userId && authData.user.id !== userId)) {
      return { success: true, data: null }
    }

    const { data: profile, error: profileError } = await getActiveProfile(authData.user.id)
    if (profileError || !profile || profile.estado === false) {
      await client.auth.signOut()
      return { success: true, data: null }
    }

    return { success: true, data: toSession(profile) }
  }

  const loadProducts = async (): Promise<Resolved<Models.Producto[]>> => {
    if (!client) return unavailable()
    const result = await resolve<Row[]>(
      client.from('producto').select(PRODUCT_SELECT).eq('activo', true).order('nombre', { ascending: true }),
      'No se pudieron cargar los productos'
    )
    return result.success
      ? { success: true, data: (result.data ?? []).map(mapProduct) }
      : result
  }

  const loadSales = async (filters?: { fecha?: string; estado?: string; start?: string; end?: string }): Promise<Resolved<Models.Venta[]>> => {
    if (!client) return unavailable<Models.Venta[]>()
    let query = client
      .from('venta')
      .select('id,id_usuario,fecha,numero_boleta,subtotal,descuento,igv,total,forma_pago,estado,motivo_anulacion,fecha_anulacion')
      .order('fecha', { ascending: false })
    if (filters?.fecha) {
      const start = `${filters.fecha}T00:00:00.000Z`
      const end = `${filters.fecha}T23:59:59.999Z`
      query = query.gte('fecha', start).lte('fecha', end)
    }
    if (filters?.start) query = query.gte('fecha', filters.start)
    if (filters?.end) query = query.lte('fecha', filters.end)
    if (filters?.estado) query = query.eq('estado', filters.estado)
    const result = await resolve<Row[]>(query, 'No se pudieron cargar las ventas')
    return result.success
      ? { success: true, data: (result.data ?? []).map(mapSale) }
      : result
  }

  const loadSaleDetails = async (saleIds?: number[]): Promise<Resolved<Models.DetalleVenta[]>> => {
    if (!client) return unavailable<Models.DetalleVenta[]>()
    if (saleIds && saleIds.length === 0) return { success: true, data: [] as Models.DetalleVenta[] }
    let query = client
      .from('detalle_venta')
      .select('id,id_venta,id_producto,cantidad,precio,descuento,subtotal,producto:producto(nombre,codigo_barras)')
    if (saleIds) query = query.in('id_venta', saleIds)
    const result = await resolve<Row[]>(query, 'No se pudieron cargar los detalles de venta')
    return result.success
      ? { success: true, data: (result.data ?? []).map(mapSaleDetail) }
      : result
  }

  const loadIncome = async (start?: string, end?: string): Promise<Resolved<Models.Ingreso[]>> => {
    if (!client) return unavailable<Models.Ingreso[]>()
    let query = client
      .from('ingreso')
      .select('id,fecha,concepto,monto,forma_pago,referencia,id_venta,id_usuario,created_at')
      .order('fecha', { ascending: false })
    if (start) query = query.gte('fecha', start)
    if (end) query = query.lte('fecha', end)
    const result = await resolve<Row[]>(query, 'No se pudieron cargar los ingresos')
    return result.success
      ? { success: true, data: (result.data ?? []).map(mapIncome) }
      : result
  }

  const loadExpenses = async (filters?: { fechaInicio?: string; fechaFin?: string; tipo?: string }): Promise<Resolved<Models.Egreso[]>> => {
    if (!client) return unavailable<Models.Egreso[]>()
    let query = client
      .from('egreso')
      .select('id,fecha,tipo,concepto,monto,comprobante,beneficiario,id_proveedor,id_usuario,created_at,proveedor:proveedor(nombre)')
      .order('fecha', { ascending: false })
    if (filters?.fechaInicio) query = query.gte('fecha', filters.fechaInicio)
    if (filters?.fechaFin) query = query.lte('fecha', filters.fechaFin)
    if (filters?.tipo) query = query.eq('tipo', filters.tipo)
    const result = await resolve<Row[]>(query, 'No se pudieron cargar los egresos')
    return result.success
      ? { success: true, data: (result.data ?? []).map(mapExpense) }
      : result
  }

  const auth = {
    login: async (email: string, password: string): Promise<Models.ApiResponse<Models.UsuarioSession>> => {
      if (!client) return unavailable()
      const { data, error } = await client.auth.signInWithPassword({ email, password })
      if (error || !data.user) return failure(error, 'Error de autenticación')
      const { data: profile, error: profileError } = await getActiveProfile(data.user.id)
      if (profileError || !profile || profile.estado === false) {
        await client.auth.signOut()
        return { success: false, error: 'La cuenta no tiene un perfil activo de MiniPOS' }
      }
      return { success: true, data: toSession(profile) }
    },
    verifySession: (userId: string) => loadSession(userId),
    logout: async (): Promise<Models.ApiResponse<void>> => {
      if (!client) return unavailable()
      const { error } = await client.auth.signOut()
      return error ? failure(error, 'No se pudo cerrar la sesión') : { success: true }
    },
    changePassword: async (userId: string, oldPassword: string, newPassword: string): Promise<Models.ApiResponse<void>> => {
      if (!client) return unavailable()
      const { data: authData, error: authError } = await client.auth.getUser()
      if (authError || !authData.user || authData.user.id !== userId || !authData.user.email) {
        return { success: false, error: 'La sesión no corresponde al usuario activo' }
      }
      const { error: reauthError } = await client.auth.signInWithPassword({ email: authData.user.email, password: oldPassword })
      if (reauthError) return { success: false, error: 'Contraseña actual incorrecta' }
      const { error } = await client.auth.updateUser({ password: newPassword })
      return error ? failure(error, 'No se pudo cambiar la contraseña') : { success: true }
    }
  }

  const usuario = {
    getAll: async (): Promise<Models.ApiResponse<Models.Usuario[]>> => {
      if (!client) return unavailable()
      const result = await resolve<Row[]>(
        client.from('profiles').select('id,username,nombre,role,estado,created_at').order('nombre', { ascending: true }),
        'No se pudieron cargar los usuarios'
      )
      return result.success ? { success: true, data: (result.data ?? []).map(mapProfile) } : result
    },
    getById: async (id: string): Promise<Models.ApiResponse<Models.Usuario>> => {
      if (!client) return unavailable()
      const result = await resolve<Row>(getActiveProfile(id), 'No se pudo cargar el usuario')
      return result.success ? { success: true, data: mapProfile(result.data) } : result
    },
    create: async (_data: { username: string; password: string; nombre: string; rol: string }): Promise<Models.ApiResponse<{ id_usuario: string }>> => ({
      success: false,
      error: 'Los usuarios se crean mediante una invitación de Supabase Auth; no se usa una contraseña desde el cliente'
    }),
    update: async (id: string, data: { nombre: string; rol: string; password?: string }): Promise<Models.ApiResponse<void>> => {
      if (!client) return unavailable()
      if (data.password) return { success: false, error: 'El cambio de contraseña requiere la sesión del propio usuario' }
      const result = await resolve<void>(
        client.from('profiles').update({ nombre: data.nombre, role: data.rol === 'administrador' ? 'administrator' : 'seller' }).eq('id', id),
        'No se pudo actualizar el usuario'
      )
      return result.success ? { success: true } : result
    },
    toggleEstado: async (id: string): Promise<Models.ApiResponse<void>> => {
      if (!client) return unavailable()
      const current = await resolve<Row>(getActiveProfile(id), 'No se pudo cargar el usuario')
      if (!current.success) return current
      const result = await resolve<void>(client.from('profiles').update({ estado: current.data.estado === false }).eq('id', id), 'No se pudo cambiar el estado del usuario')
      return result.success ? { success: true } : result
    },
    delete: async (_id: string): Promise<Models.ApiResponse<void>> => ({
      success: false,
      error: 'Las cuentas Auth no se eliminan desde el cliente; desactiva el perfil para conservar el historial'
    })
  }

  const categoria = {
    getAll: async (): Promise<Models.ApiResponse<Models.Categoria[]>> => {
      if (!client) return unavailable()
      const result = await resolve<Row[]>(client.from('categoria').select('id,nombre,descripcion,estado,created_at,updated_at').order('nombre', { ascending: true }), 'No se pudieron cargar las categorías')
      return result.success ? { success: true, data: (result.data ?? []).map(mapCategory) } : result
    },
    getById: async (id: number): Promise<Models.ApiResponse<Models.Categoria>> => {
      if (!client) return unavailable()
      const result = await resolve<Row>(client.from('categoria').select('id,nombre,descripcion,estado,created_at,updated_at').eq('id', id).single<Row>(), 'No se pudo cargar la categoría')
      return result.success ? { success: true, data: mapCategory(result.data) } : result
    },
    create: async (data: Partial<Models.Categoria>): Promise<Models.ApiResponse<{ id_categoria: number }>> => {
      if (!client) return unavailable()
      const result = await resolve<Row>(client.from('categoria').insert({ nombre: data.nombre, descripcion: data.descripcion ?? null }).select('id').single<Row>(), 'No se pudo crear la categoría')
      return result.success ? { success: true, data: { id_categoria: asNumber(result.data.id) } } : result
    },
    update: async (id: number, data: Partial<Models.Categoria>): Promise<Models.ApiResponse<void>> => {
      if (!client) return unavailable()
      const result = await resolve<void>(client.from('categoria').update({ nombre: data.nombre, descripcion: data.descripcion }).eq('id', id), 'No se pudo actualizar la categoría')
      return result.success ? { success: true } : result
    },
    delete: async (id: number): Promise<Models.ApiResponse<void>> => {
      if (!client) return unavailable()
      const result = await resolve<void>(client.from('categoria').update({ estado: false }).eq('id', id), 'No se pudo desactivar la categoría')
      return result.success ? { success: true } : result
    }
  }

  const producto = {
    getAll: loadProducts,
    getById: async (id: number): Promise<Models.ApiResponse<Models.Producto>> => {
      if (!client) return unavailable()
      const result = await resolve<Row>(client.from('producto').select(PRODUCT_SELECT).eq('id', id).single<Row>(), 'No se pudo cargar el producto')
      return result.success ? { success: true, data: mapProduct(result.data) } : result
    },
    getByCodigoBarras: async (codigo: string): Promise<Models.ApiResponse<Models.Producto>> => {
      if (!client) return unavailable()
      const result = await resolve<Row>(client.from('producto').select(PRODUCT_SELECT).eq('codigo_barras', codigo).eq('activo', true).single<Row>(), 'No se pudo buscar el producto')
      return result.success ? { success: true, data: mapProduct(result.data) } : result
    },
    search: async (query: string): Promise<Models.ApiResponse<Models.Producto[]>> => {
      if (!client) return unavailable()
      const term = `%${query.trim()}%`
      const [byName, byBarcode] = await Promise.all([
        resolve<Row[]>(client.from('producto').select(PRODUCT_SELECT).eq('activo', true).ilike('nombre', term), 'No se pudieron buscar productos'),
        resolve<Row[]>(client.from('producto').select(PRODUCT_SELECT).eq('activo', true).ilike('codigo_barras', term), 'No se pudieron buscar productos')
      ])
      if (!byName.success) return byName
      if (!byBarcode.success) return byBarcode
      const rows = [...(byName.data ?? []), ...(byBarcode.data ?? [])]
      const unique = new Map(rows.map((row) => [String(row.id), row]))
      return { success: true, data: [...unique.values()].map(mapProduct) }
    },
    create: async (data: Partial<Models.Producto>): Promise<Models.ApiResponse<{ id_producto: number }>> => {
      if (!client) return unavailable()
      const result = await resolve<number>(client.rpc('create_product', {
        p_id_categoria: data.id_categoria || null,
        p_codigo_barras: data.codigo_barras ?? null,
        p_nombre: data.nombre,
        p_descripcion: data.descripcion ?? null,
        p_precio_compra: data.precio_compra ?? 0,
        p_precio_venta: data.precio_venta ?? 0,
        p_stock_minimo: data.stock_minimo ?? 5,
        p_id_proveedor: data.id_proveedor ?? null,
        p_stock_inicial: data.stock_actual ?? 0
      }), 'No se pudo crear el producto')
      return result.success ? { success: true, data: { id_producto: asNumber(result.data) } } : result
    },
    update: async (id: number, data: Partial<Models.Producto>): Promise<Models.ApiResponse<void>> => {
      if (!client) return unavailable()
      const result = await resolve<void>(client.from('producto').update({
        id_categoria: data.id_categoria,
        codigo_barras: data.codigo_barras ?? null,
        nombre: data.nombre,
        descripcion: data.descripcion ?? null,
        precio_compra: data.precio_compra,
        precio_venta: data.precio_venta,
        stock_minimo: data.stock_minimo,
        id_proveedor: data.id_proveedor ?? null,
        activo: data.estado === undefined ? undefined : Boolean(data.estado)
      }).eq('id', id), 'No se pudo actualizar el producto')
      return result.success ? { success: true } : result
    },
    delete: async (id: number): Promise<Models.ApiResponse<void>> => {
      if (!client) return unavailable()
      const result = await resolve<void>(client.from('producto').update({ activo: false }).eq('id', id), 'No se pudo desactivar el producto')
      return result.success ? { success: true } : result
    },
    getBajoStock: async (): Promise<Models.ApiResponse<Models.Producto[]>> => {
      const result = await loadProducts()
      return result.success ? { success: true, data: (result.data ?? []).filter((item) => item.estado === 1 && item.stock_actual <= item.stock_minimo) } : result
    }
  }

  const venta = {
    crear: async (data: Models.CrearVentaData): Promise<Models.ApiResponse<{ id_venta: number; numero_boleta: string; total: number }>> => {
      if (!client) return unavailable()
      const result = await resolve<number>(client.rpc('create_sale', {
        p_detalles: data.detalles.map((detail) => ({ id_producto: detail.id_producto, cantidad: detail.cantidad, descuento: detail.descuento ?? 0 })),
        p_forma_pago: data.forma_pago,
        p_descuento: data.descuento ?? 0
      }), 'No se pudo registrar la venta')
      if (!result.success) return result
      const sale = await venta.getById(asNumber(result.data))
      if (!sale.success) return sale
      if (!sale.data) return { success: false, error: 'La venta creada no pudo ser recuperada' }
      return { success: true, data: { id_venta: sale.data.id_venta, numero_boleta: sale.data.numero_boleta, total: sale.data.total } }
    },
    getAll: (filters?: { fecha?: string; estado?: string }) => loadSales(filters),
    getById: async (id: number): Promise<Models.ApiResponse<Models.VentaConDetalles>> => {
      if (!client) return unavailable()
      const sale = await resolve<Row>(client.from('venta').select('id,id_usuario,fecha,numero_boleta,subtotal,descuento,igv,total,forma_pago,estado,motivo_anulacion,fecha_anulacion').eq('id', id).single<Row>(), 'No se pudo cargar la venta')
      if (!sale.success) return sale
      const details = await loadSaleDetails([id])
      if (!details.success) return details
      return { success: true, data: { ...mapSale(sale.data), detalles: details.data ?? [] } }
    },
    anular: async (id: number, _usuarioId: string, motivo: string): Promise<Models.ApiResponse<void>> => {
      if (!client) return unavailable()
      const result = await resolve<void>(client.rpc('void_sale', { p_id_venta: id, p_motivo: motivo }), 'No se pudo anular la venta')
      return result.success ? { success: true } : result
    },
    getEstadisticas: async (periodo: 'dia' | 'mes'): Promise<Models.ApiResponse<Models.EstadisticasVentas>> => {
      const range = toDateRange(periodo)
      const sales = await loadSales({ start: range.start, end: range.end, estado: 'completada' })
      if (!sales.success) return sales
      const details = await loadSaleDetails((sales.data ?? []).map((sale) => sale.id_venta))
      if (!details.success) return details
      const total = (sales.data ?? []).reduce((sum, sale) => sum + sale.total, 0)
      const count = sales.data?.length ?? 0
      return { success: true, data: { cantidad_ventas: count, total_ventas: total, productos_vendidos: (details.data ?? []).reduce((sum, detail) => sum + detail.cantidad, 0), ticket_promedio: count ? total / count : 0 } }
    }
  }

  const reporte = {
    getDashboard: async (): Promise<Models.ApiResponse<Models.DashboardStats>> => {
      const today = toDateRange('dia')
      const month = toDateRange('mes')
      const [todaySales, monthSales, products] = await Promise.all([
        loadSales({ start: today.start, end: today.end, estado: 'completada' }),
        loadSales({ start: month.start, end: month.end, estado: 'completada' }),
        loadProducts()
      ])
      if (!todaySales.success) return todaySales
      if (!monthSales.success) return monthSales
      if (!products.success) return products
      const details = await loadSaleDetails((todaySales.data ?? []).map((sale) => sale.id_venta))
      if (!details.success) return details
      const productMap = new Map((products.data ?? []).map((product) => [product.id_producto, product]))
      const sold = details.data ?? []
      const cost = sold.reduce((sum, detail) => sum + (productMap.get(detail.id_producto)?.precio_compra ?? 0) * detail.cantidad, 0)
      const todayTotal = (todaySales.data ?? []).reduce((sum, sale) => sum + sale.total, 0)
      const monthTotal = (monthSales.data ?? []).reduce((sum, sale) => sum + sale.total, 0)
      const todayCount = todaySales.data?.length ?? 0
      return {
        success: true,
        data: {
          ventas_dia: todayTotal,
          ventas_dia_cantidad: todayCount,
          ventas_mes: monthTotal,
          ventas_mes_cantidad: monthSales.data?.length ?? 0,
          ganancias_dia: todayTotal - cost,
          productos_vendidos_dia: sold.reduce((sum, detail) => sum + detail.cantidad, 0),
          productos_bajo_stock: (products.data ?? []).filter((product) => product.estado === 1 && product.stock_actual <= product.stock_minimo).length,
          ticket_promedio: todayCount ? todayTotal / todayCount : 0,
          margen_ganancia: todayTotal ? ((todayTotal - cost) / todayTotal) * 100 : 0
        }
      }
    },
    getVentasPorHora: async (): Promise<Models.ApiResponse<Models.VentasPorHora[]>> => {
      const range = toDateRange('dia')
      const sales = await loadSales({ start: range.start, end: range.end, estado: 'completada' })
      if (!sales.success) return sales
      const groups = new Map<string, { cantidad: number; total: number }>()
      for (const sale of sales.data ?? []) {
        const hora = String(new Date(sale.created_at).getHours()).padStart(2, '0')
        const current = groups.get(hora) ?? { cantidad: 0, total: 0 }
        groups.set(hora, { cantidad: current.cantidad + 1, total: current.total + sale.total })
      }
      return { success: true, data: [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([hora, values]) => ({ hora, ...values })) }
    },
    getVentasPorDia: async (dias = 7): Promise<Models.ApiResponse<Models.VentasPorDia[]>> => {
      const end = new Date()
      const start = new Date(end)
      start.setDate(start.getDate() - Math.max(1, dias - 1))
      start.setHours(0, 0, 0, 0)
      const sales = await loadSales({ start: start.toISOString(), end: end.toISOString(), estado: 'completada' })
      if (!sales.success) return sales
      const groups = new Map<string, { cantidad: number; total: number }>()
      for (const sale of sales.data ?? []) {
        const fecha = toDateOnly(new Date(sale.created_at))
        const current = groups.get(fecha) ?? { cantidad: 0, total: 0 }
        groups.set(fecha, { cantidad: current.cantidad + 1, total: current.total + sale.total })
      }
      return { success: true, data: [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([fecha, values]) => ({ fecha, ...values })) }
    },
    getProductosMasVendidos: async (limite = 10): Promise<Models.ApiResponse<Models.ProductoMasVendido[]>> => {
      const sales = await loadSales({ estado: 'completada' })
      if (!sales.success) return sales
      const details = await loadSaleDetails((sales.data ?? []).map((sale) => sale.id_venta))
      if (!details.success) return details
      const groups = new Map<number, Models.ProductoMasVendido>()
      for (const detail of details.data ?? []) {
        const current = groups.get(detail.id_producto) ?? { id_producto: detail.id_producto, nombre: detail.producto_nombre ?? '', codigo_barras: detail.codigo_barras ?? null, cantidad_vendida: 0, total_vendido: 0 }
        groups.set(detail.id_producto, { ...current, cantidad_vendida: current.cantidad_vendida + detail.cantidad, total_vendido: current.total_vendido + detail.subtotal })
      }
      return { success: true, data: [...groups.values()].sort((a, b) => b.cantidad_vendida - a.cantidad_vendida).slice(0, limite) }
    },
    getVentasPorCategoria: async (): Promise<Models.ApiResponse<Models.VentasPorCategoria[]>> => {
      const sales = await loadSales({ estado: 'completada' })
      if (!sales.success) return sales
      const details = await loadSaleDetails((sales.data ?? []).map((sale) => sale.id_venta))
      if (!details.success) return details
      const products = await loadProducts()
      if (!products.success) return products
      const categories = new Map((products.data ?? []).map((product) => [product.id_producto, product.categoria_nombre ?? 'Sin categoría']))
      const groups = new Map<string, { cantidad: number; total: number }>()
      for (const detail of details.data ?? []) {
        const categoria = categories.get(detail.id_producto) ?? 'Sin categoría'
        const current = groups.get(categoria) ?? { cantidad: 0, total: 0 }
        groups.set(categoria, { cantidad: current.cantidad + detail.cantidad, total: current.total + detail.subtotal })
      }
      return { success: true, data: [...groups.entries()].map(([categoria, values]) => ({ categoria, ...values })) }
    },
    getVentasPorFormaPago: async (): Promise<Models.ApiResponse<Models.VentasPorFormaPago[]>> => {
      const sales = await loadSales({ estado: 'completada' })
      if (!sales.success) return sales
      const groups = new Map<string, { cantidad: number; total: number }>()
      for (const sale of sales.data ?? []) {
        const current = groups.get(sale.forma_pago) ?? { cantidad: 0, total: 0 }
        groups.set(sale.forma_pago, { cantidad: current.cantidad + 1, total: current.total + sale.total })
      }
      return { success: true, data: [...groups.entries()].map(([forma_pago, values]) => ({ forma_pago, ...values })) }
    },
    getEstadoResultados: async (fechaInicio: string, fechaFin: string): Promise<Models.ApiResponse<Models.EstadoResultados>> => {
      const [income, expenses, sales] = await Promise.all([
        loadIncome(fechaInicio, fechaFin),
        loadExpenses({ fechaInicio, fechaFin }),
        loadSales({ start: `${fechaInicio}T00:00:00.000Z`, end: `${fechaFin}T23:59:59.999Z` })
      ])
      if (!income.success) return income
      if (!expenses.success) return expenses
      if (!sales.success) return sales
      const voidedSales = new Set((sales.data ?? []).filter((sale) => sale.estado === 'anulada').map((sale) => sale.id_venta))
      const totalIngresos = (income.data ?? []).filter((item) => item.id_venta === null || !voidedSales.has(item.id_venta)).reduce((sum, item) => sum + item.monto, 0)
      const expensesByType = new Map<string, number>()
      for (const expense of expenses.data ?? []) expensesByType.set(expense.tipo, (expensesByType.get(expense.tipo) ?? 0) + expense.monto)
      const totalEgresos = (expenses.data ?? []).reduce((sum, item) => sum + item.monto, 0)
      return { success: true, data: { total_ingresos: totalIngresos, egresos_por_tipo: [...expensesByType.entries()].map(([tipo, total]) => ({ tipo, total })), total_egresos: totalEgresos, ganancia_neta: totalIngresos - totalEgresos } }
    },
    getFlujoCaja: async (fechaInicio: string, fechaFin: string): Promise<Models.ApiResponse<Models.FlujoCajaItem[]>> => {
      const [income, expenses] = await Promise.all([loadIncome(fechaInicio, fechaFin), loadExpenses({ fechaInicio, fechaFin })])
      if (!income.success) return income
      if (!expenses.success) return expenses
      const result: Models.FlujoCajaItem[] = [
        ...(income.data ?? []).map((item) => ({ id: item.id_ingreso, fecha: item.fecha, concepto: item.concepto, monto: item.monto, tipo: 'ingreso' as const })),
        ...(expenses.data ?? []).map((item) => ({ id: item.id_egreso, fecha: item.fecha, concepto: item.concepto, monto: item.monto, tipo: 'egreso' as const }))
      ]
      return { success: true, data: result.sort((a, b) => a.fecha.localeCompare(b.fecha)) }
    }
  }

  const configuracion = {
    getAll: async (): Promise<Models.ApiResponse<Models.Configuracion[]>> => {
      if (!client) return unavailable()
      return resolve<Models.Configuracion[]>(client.from('configuracion').select('clave,valor,descripcion,updated_at').order('clave'), 'No se pudo cargar la configuración')
    },
    get: async (clave: string): Promise<Models.ApiResponse<Models.Configuracion>> => {
      if (!client) return unavailable()
      return resolve<Models.Configuracion>(client.from('configuracion').select('clave,valor,descripcion,updated_at').eq('clave', clave).single<Models.Configuracion>(), 'No se pudo cargar la configuración')
    },
    update: async (clave: string, valor: string): Promise<Models.ApiResponse<void>> => {
      if (!client) return unavailable()
      const result = await resolve<void>(client.from('configuracion').upsert({ clave, valor }, { onConflict: 'clave' }), 'No se pudo actualizar la configuración')
      return result.success ? { success: true } : result
    },
    updateMultiple: async (configs: { clave: string; valor: string }[]): Promise<Models.ApiResponse<void>> => {
      if (!client) return unavailable()
      const result = await resolve<void>(client.from('configuracion').upsert(configs, { onConflict: 'clave' }), 'No se pudo actualizar la configuración')
      return result.success ? { success: true } : result
    }
  }

  const impresion = {
    getBoleta: async (id: number): Promise<Models.ApiResponse<Models.BoletaData>> => {
      if (!client) return unavailable()
      const [sale, settings] = await Promise.all([venta.getById(id), configuracion.getAll()])
      if (!sale.success || !sale.data) return { success: false, error: sale.error || 'No se pudo cargar la venta' }
      if (!settings.success) return { success: false, error: settings.error || 'No se pudo cargar la configuración' }
      const profile = await resolve<Row>(getActiveProfile(sale.data.id_usuario), 'No se pudo cargar el cajero')
      return {
        success: true,
        data: {
          venta: { ...sale.data, usuario_nombre: profile.success ? String(profile.data.nombre ?? profile.data.username ?? '') : '' },
          detalles: sale.data.detalles,
          config: Object.fromEntries((settings.data ?? []).map((item) => [item.clave, item.valor ?? '']))
        }
      }
    }
  }

  const egreso = {
    getAll: (filters?: { fechaInicio?: string; fechaFin?: string; tipo?: string }) => loadExpenses(filters),
    create: async (data: { fecha: string; tipo: string; concepto: string; monto: number; comprobante?: string; beneficiario?: string; id_proveedor?: number; id_usuario?: string }): Promise<Models.ApiResponse<{ id_egreso: number }>> => {
      if (!client) return unavailable()
      const result = await resolve<number>(client.rpc('create_expense', {
        p_fecha: data.fecha,
        p_tipo: data.tipo,
        p_concepto: data.concepto,
        p_monto: data.monto,
        p_comprobante: data.comprobante ?? null,
        p_beneficiario: data.beneficiario ?? null,
        p_id_proveedor: data.id_proveedor ?? null
      }), 'No se pudo registrar el egreso')
      return result.success ? { success: true, data: { id_egreso: asNumber(result.data) } } : result
    }
  }

  const ingreso = {
    getAll: (filters?: { fechaInicio?: string; fechaFin?: string }) => loadIncome(filters?.fechaInicio, filters?.fechaFin)
  }

  return { auth, usuario, categoria, producto, venta, reporte, configuracion, egreso, ingreso, impresion }
}
