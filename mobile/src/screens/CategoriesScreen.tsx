import { useCallback, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'

import { Button, Card, EmptyState, Field, Header, Loading, Notice, Screen, styles } from '../components/ui'
import { mobileApi } from '../lib/api'
import type { Category } from '../lib/types'
import { useAuth } from '../state/AuthContext'

export function CategoriesScreen() {
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const result = await mobileApi.categories.list()
    if (result.success) setCategories(result.data)
    else setError(result.error)
    setLoading(false)
  }, [])

  useFocusEffect(useCallback(() => {
    void load()
  }, [load]))

  const create = async () => {
    if (!name.trim()) return setError('Ingresa el nombre de la categoría')
    const result = await mobileApi.categories.create(name, description)
    if (!result.success) return setError(result.error)
    setName('')
    setDescription('')
    setError(null)
    void load()
  }

  const deactivate = async (category: Category) => {
    const result = await mobileApi.categories.deactivate(category.id_categoria)
    if (!result.success) setError(result.error)
    else void load()
  }

  if (loading && categories.length === 0) return <Loading />

  return (
    <Screen>
      <Header title="Categorías" subtitle="Organiza el catálogo compartido" />
      {error ? <Notice>{error}</Notice> : null}
      {user?.rol === 'administrador' ? <Card>
        <Text style={styles.strong}>Nueva categoría</Text>
        <Field label="Nombre" onChangeText={setName} placeholder="Bebidas" value={name} />
        <Field label="Descripción" onChangeText={setDescription} placeholder="Opcional" value={description} />
        <Button label="Crear categoría" onPress={() => void create()} />
      </Card> : <Notice tone="warning">Solo un administrador puede crear o desactivar categorías.</Notice>}
      {categories.length === 0 ? <EmptyState label="No hay categorías activas" /> : categories.map((category) => <Card key={category.id_categoria}><View style={styles.rowBetween}><View style={styles.productCopy}><Text style={styles.strong}>{category.nombre}</Text><Text style={styles.smallText}>{category.descripcion || 'Sin descripción'}</Text></View>{user?.rol === 'administrador' ? <Pressable accessibilityRole="button" onPress={() => void deactivate(category)}><Text style={styles.dangerLink}>Desactivar</Text></Pressable> : null}</View></Card>)}
    </Screen>
  )
}
