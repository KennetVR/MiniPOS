import { StyleSheet, Text, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.title}>MiniPOS Mobile</Text>
      <Text style={styles.subtitle}>Cliente nativo Expo listo para conectar con Supabase.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f8fafc'
  },
  title: {
    color: '#0f172a',
    fontSize: 28,
    fontWeight: '700'
  },
  subtitle: {
    color: '#475569',
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center'
  }
})
