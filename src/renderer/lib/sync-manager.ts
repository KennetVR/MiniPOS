import type { SupabaseClient } from '@supabase/supabase-js'

export interface SyncStats {
  pending: number
  synced: number
  last_synced: string | null
}

class SyncManager {
  private client: SupabaseClient | null = null
  private syncTimer: ReturnType<typeof setInterval> | null = null
  private catalogTimer: ReturnType<typeof setInterval> | null = null
  private isSyncing = false
  private listeners = new Set<(stats: SyncStats) => void>()

  init(client: SupabaseClient | null) {
    this.client = client

    if (typeof window === 'undefined' || !window.api) {
      return
    }

    // Ejecutar sync inicial y pull de catálogo
    void this.syncPendingSales()
    void this.pullCatalog()

    // Escuchar eventos de red
    window.addEventListener('online', () => {
      console.log('📡 Red restablecida: iniciando sincronización de ventas...')
      void this.syncPendingSales()
      void this.pullCatalog()
    })

    // Intervalo de sincronización periódica cada 10 segundos
    if (!this.syncTimer) {
      this.syncTimer = setInterval(() => {
        void this.syncPendingSales()
      }, 10000)
    }

    // Intervalo de actualización de catálogo cada 5 minutos
    if (!this.catalogTimer) {
      this.catalogTimer = setInterval(() => {
        void this.pullCatalog()
      }, 5 * 60 * 1000)
    }
  }

  async triggerSync(): Promise<void> {
    await this.syncPendingSales()
  }

  async getStats(): Promise<SyncStats> {
    if (typeof window === 'undefined' || !window.api) {
      return { pending: 0, synced: 0, last_synced: null }
    }
    try {
      const res = await window.api.invoke('sync:getStats') as { success: boolean; data?: SyncStats }
      return res.success && res.data ? res.data : { pending: 0, synced: 0, last_synced: null }
    } catch {
      return { pending: 0, synced: 0, last_synced: null }
    }
  }

  onStatsChange(listener: (stats: SyncStats) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyStats(stats: SyncStats) {
    this.listeners.forEach((listener) => {
      try {
        listener(stats)
      } catch (err) {
        console.error('Error notificando sync stats:', err)
      }
    })
  }

  async pullCatalog(): Promise<void> {
    if (!this.client || typeof window === 'undefined' || !window.api || !navigator.onLine) {
      return
    }

    try {
      const [prodRes, catRes] = await Promise.all([
        this.client.from('producto').select('*').eq('activo', true),
        this.client.from('categoria').select('*').eq('estado', true)
      ])

      if (prodRes.data && catRes.data) {
        await window.api.invoke('sync:pullCatalog', prodRes.data, catRes.data)
      }
    } catch (err) {
      console.warn('No se pudo actualizar catálogo local desde Supabase:', err)
    }
  }

  async syncPendingSales(): Promise<void> {
    if (this.isSyncing) return
    if (!this.client || typeof window === 'undefined' || !window.api || !navigator.onLine) {
      return
    }

    this.isSyncing = true
    try {
      const pendingRes = await window.api.invoke('sync:getPending', 10) as {
        success: boolean
        data?: Array<{
          id: number
          client_tx_id: string
          action: string
          payload: string
          attempts: number
        }>
      }

      if (!pendingRes.success || !pendingRes.data || pendingRes.data.length === 0) {
        return
      }

      for (const item of pendingRes.data) {
        try {
          const payload = JSON.parse(item.payload) as {
            client_tx_id: string
            detalles: Array<{ id_producto: number; cantidad: number; descuento?: number }>
            forma_pago: string
            descuento: number
          }

          const { error } = await this.client.rpc('create_sale', {
            p_detalles: payload.detalles,
            p_forma_pago: payload.forma_pago,
            p_descuento: payload.descuento || 0,
            p_client_tx_id: payload.client_tx_id
          })

          if (error) {
            console.error(`Error al sincronizar venta ${payload.client_tx_id}:`, error)
            await window.api.invoke('sync:markFailed', payload.client_tx_id, error.message)
          } else {
            await window.api.invoke('sync:markSynced', payload.client_tx_id)
            console.log(`✓ Venta ${payload.client_tx_id} sincronizada en Supabase`)
          }
        } catch (itemErr) {
          console.error('Error procesando payload de venta:', itemErr)
          await window.api.invoke('sync:markFailed', item.client_tx_id, String(itemErr))
        }
      }

      const stats = await this.getStats()
      this.notifyStats(stats)
    } catch (err) {
      console.error('Error en ciclo de syncPendingSales:', err)
    } finally {
      this.isSyncing = false
    }
  }
}

export const syncManager = new SyncManager()

