import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { NuqsAdapter } from 'nuqs/adapters/react-router'
import { AuthProvider } from './contexts/AuthContext'
import { QueryProvider } from './contexts/QueryContext'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryProvider>
        <BrowserRouter>
          <NuqsAdapter>
            <AuthProvider>
              <App />
            </AuthProvider>
          </NuqsAdapter>
        </BrowserRouter>
      </QueryProvider>
    </ErrorBoundary>
  </StrictMode>
)
