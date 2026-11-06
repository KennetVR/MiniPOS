import { useEffect, useState } from 'react'
import { useAuthStore } from './stores/authStore'
import { LoginPage } from './pages/Login'
import { Layout } from './components/Layout'
import { ToastContainer } from './components/Toast'

type Page = 'dashboard' | 'productos' | 'pos' | 'usuarios' | 'categorias' | 'configuracion'

function App() {
  const { isAuthenticated, verifySession } = useAuthStore()
  const [initialized, setInitialized] = useState(false)
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')

  useEffect(() => {
    verifySession().finally(() => setInitialized(true))
  }, [])

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
    <>
      <Layout currentPage={currentPage} onNavigate={setCurrentPage} />
      <ToastContainer />
    </>
  )
}

export default App
