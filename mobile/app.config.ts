import type { ExpoConfig, ConfigContext } from 'expo/config'

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'MiniPOS Mobile',
  slug: 'minipos-mobile',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'minipos',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.minipos.mobile'
  },
  android: {
    package: 'com.minipos.mobile'
  },
  plugins: [
    [
      'expo-camera',
      {
        cameraPermission: 'MiniPOS necesita la cámara para escanear códigos de barras.'
      }
    ]
  ]
})
