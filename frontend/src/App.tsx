import { Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { DocumentPage } from './pages/DocumentPage'
import { AdminPage } from './pages/AdminPage'
import { ClusterVisualizationPage } from './pages/ClusterVisualizationPage'

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
    </Routes>
  )
}

export default App
