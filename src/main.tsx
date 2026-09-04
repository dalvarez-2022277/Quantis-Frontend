import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { PersistenceProvider } from './contexts/PersistenceContext'
import './style.css'

// Asegurar clase "standalone" en modo aplicación web (por si no estaba lista al primer paint)
if (typeof window !== 'undefined' && window.matchMedia?.('(display-mode: standalone)').matches) {
  document.documentElement.classList.add('standalone')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <PersistenceProvider>
        <ThemeProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ThemeProvider>
      </PersistenceProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
