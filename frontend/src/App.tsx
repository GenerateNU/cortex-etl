import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { DocumentPage } from './pages/DocumentPage'
import { AdminPage } from './pages/AdminPage'
import { ClusterVisualizationPage } from './pages/ClusterVisualizationPage'
import { Layout } from './components/layout/Layout'
import { ErrorTester } from './components/debug/ErrorTester'

const isDevelopment = import.meta.env.VITE_ENVIRONMENT === 'development'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DocumentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireRole="admin">
            <AdminPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cluster-visualization"
        element={
          <ProtectedRoute requireRole="admin">
            <ClusterVisualizationPage />
          </ProtectedRoute>
        }
      />
      {isDevelopment && (
        <Route
          path="/error-test"
          element={
            <ProtectedRoute>
              <Layout>
                <ErrorTester />
              </Layout>
            </ProtectedRoute>
          }
        />
      )}
      <Route path="/*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default App
