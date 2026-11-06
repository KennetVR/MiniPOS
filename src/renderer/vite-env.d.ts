/// <reference types="vite/client" />

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

interface Api {
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>
}

declare global {
  interface Window {
    api: Api
  }
}
