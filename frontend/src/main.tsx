import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { NuqsAdapter } from 'nuqs/adapters/react-router/v7'
import { AuthProvider } from './contexts/AuthContext'
import { QueryProvider } from './contexts/QueryContext'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import App from './App'
import './index.css'
import { DevMenu } from './components/debug/DevMenu'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryProvider>
        <BrowserRouter>
          <NuqsAdapter>
            <AuthProvider>
              <App />
              <DevMenu />
            </AuthProvider>
          </NuqsAdapter>
        </BrowserRouter>
      </QueryProvider>
    </ErrorBoundary>
  </StrictMode>
)
