import { useCallback, useState } from 'react'
import { RefreshControl, Text, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'

import { Card, EmptyState, Header, Loading, Notice, Screen, colors, styles } from '../components/ui'
import { mobileApi } from '../lib/api'
import type { DashboardSummary } from '../lib/types'
import { useAuth } from '../state/AuthContext'

export function DashboardScreen() {
  const { user } = useAuth()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    setError(null)
    const result = await mobileApi.dashboard.summary()
    if (result.success) setSummary(result.data)
    else setError(result.error)
  }, [])

  useFocusEffect(useCallback(() => {
    void load()
  }, [load]))

  const refresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  if (!summary && !error) return <Loading />

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />}>
      <Header title={`Hola, ${user?.nombre || 'equipo'}`} subtitle="Resumen de tu operación de hoy" />
      {error ? <Notice>{error}</Notice> : null}
      {summary ? (
        <>
          <View style={styles.statGrid}>
            <Card style={styles.statCard}><Text style={styles.statValue}>{summary.productCount}</Text><Text style={styles.statLabel}>Productos activos</Text></Card>
            <Card style={styles.statCard}><Text style={[styles.statValue, summary.lowStockCount > 0 && { color: colors.warning }]}>{summary.lowStockCount}</Text><Text style={styles.statLabel}>Stock bajo</Text></Card>
            <Card style={styles.statCard}><Text style={styles.statValue}>{summary.todaySales}</Text><Text style={styles.statLabel}>Ventas hoy</Text></Card>
            <Card style={styles.statCard}><Text style={styles.statValue}>S/ {summary.todayRevenue.toFixed(2)}</Text><Text style={styles.statLabel}>Ingresos hoy</Text></Card>
          </View>
          <Card>
            <Text style={styles.strong}>Ventas recientes</Text>
            {summary.recentSales.length === 0 ? <EmptyState label="Todavía no hay ventas hoy" /> : summary.recentSales.map((sale) => (
              <View key={sale.id} style={[styles.rowBetween, styles.listRow]}>
                <View><Text style={styles.strong}>{sale.numero_boleta}</Text><Text style={styles.smallText}>{new Date(sale.fecha).toLocaleTimeString()}</Text></View>
                <Text style={[styles.strong, sale.estado === 'anulada' && { color: colors.danger }]}>S/ {sale.total.toFixed(2)}</Text>
              </View>
            ))}
          </Card>
        </>
      ) : null}
    </Screen>
  )
}
