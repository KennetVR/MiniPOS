import { SafeAreaProvider } from 'react-native-safe-area-context'

import { AuthProvider } from './src/state/AuthContext'
import { RootNavigator } from './src/navigation/RootNavigator'

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  )
}
