import React, { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'sileo'
import 'sileo/styles.css'
import { useAuthContext } from './contexts/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import AuthSlider from './components/AuthSlider'
import LoadingSpinner from './components/LoadingSpinner'
import PageTransition from './components/PageTransition'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import UserSettings from './pages/UserSettings'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import AuthCallback from './pages/AuthCallback'
import AddToHomeScreen from './pages/AddToHomeScreen'
import AdminRoute from './components/AdminRoute'
import AboutApp from './pages/AboutApp'

// Lazy loading para páginas con tabs
const TransaccionesPage = lazy(() => import('./pages/TransaccionesPage'))
const CalendarioPage = lazy(() => import('./pages/CalendarioPage'))
const FinanzasPage = lazy(() => import('./pages/FinanzasPage'))
const AdminFeedback = lazy(() => import('./pages/AdminFeedback'))

const INSTRUCTIONS_SEEN_KEY = 'quantis_instructions_seen'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
    document.getElementById('main-content-scroll')?.scrollTo(0, 0)
  }, [pathname])
  return null
}

function RootRedirectWhenUnauthenticated() {
  const instructionsSeen = typeof window !== 'undefined' && localStorage.getItem(INSTRUCTIONS_SEEN_KEY)
  const isStandalone = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
  if (instructionsSeen || isStandalone) {
    return <Navigate to="/login" replace />
  }
  return <Navigate to="/agregar-app" state={{ firstTime: true }} replace />
}

function App() {
  const { isAuthenticated, isLoading } = useAuthContext()

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <>
      <ScrollToTop />
      <Toaster
        position="top-center"
        theme="system"
        offset={{ top: 'calc(env(safe-area-inset-top) + 10px)' }}
      />
      <Routes>
      {/* Rutas públicas */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <PageTransition><AuthSlider /></PageTransition>}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <PageTransition><AuthSlider /></PageTransition>}
      />
      <Route
        path="/forgot-password"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <ForgotPassword />}
      />
      <Route
        path="/reset-password"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <ResetPassword />}
      />
      <Route
        path="/auth/callback"
        element={<AuthCallback />}
      />
      <Route
        path="/agregar-app"
        element={<PageTransition><AddToHomeScreen /></PageTransition>}
      />

      {/* Rutas protegidas */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Layout>
              <Navigate to="/dashboard" replace />
            </Layout>
          ) : (
            <RootRedirectWhenUnauthenticated />
          )
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      /> 
      {/* Transacciones: por defecto mostrar Ingresos */}
      <Route path="/transacciones" element={<Navigate to="/transacciones/ingresos" replace />} />
      <Route
        path="/transacciones/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Suspense fallback={<LoadingSpinner />}>
                <TransaccionesPage />
              </Suspense>
            </Layout>
          </ProtectedRoute>
        }
      />
      {/* Calendario: solo agenda / vencimientos */}
      <Route
        path="/calendario"
        element={
          <ProtectedRoute>
            <Layout>
              <Suspense fallback={<LoadingSpinner />}>
                <CalendarioPage />
              </Suspense>
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="/calendario/cuotas" element={<Navigate to="/finanzas/cuotas" replace />} />
      <Route path="/calendario/cuentas" element={<Navigate to="/finanzas/cuentas" replace />} />
      {/* Finanzas: cuotas (tarjetas/planes) + cuentas */}
      <Route path="/finanzas" element={<Navigate to="/finanzas/cuotas" replace />} />
      <Route
        path="/finanzas/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Suspense fallback={<LoadingSpinner />}>
                <FinanzasPage />
              </Suspense>
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="/cuentas" element={<Navigate to="/finanzas/cuentas" replace />} />
      <Route path="/transacciones/cuotas" element={<Navigate to="/finanzas/cuotas" replace />} />
      {/* Redirects de compatibilidad: rutas antiguas -> nuevas */}
      <Route path="/ingresos" element={<Navigate to="/transacciones/ingresos" replace />} />
      <Route path="/gastos" element={<Navigate to="/transacciones/gastos" replace />} />
      <Route path="/recurrencias" element={<Navigate to="/finanzas/cuotas" replace />} />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout>
              <Profile />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ajustes"
        element={
          <ProtectedRoute>
            <Layout>
              <UserSettings />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/acerca"
        element={
          <ProtectedRoute>
            <Layout>
              <AboutApp />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/feedback"
        element={
          <AdminRoute>
            <Layout>
              <Suspense fallback={<LoadingSpinner />}>
                <AdminFeedback />
              </Suspense>
            </Layout>
          </AdminRoute>
        }
      />

      {/* Ruta por defecto */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
    </>
  )
}

export default App
