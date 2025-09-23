import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { tenantService } from '../../services/supabase.service'
import { useQuery } from '@tanstack/react-query'

export function Navbar() {
  const { user, currentTenant, logout, switchTenant } = useAuth()
  const location = useLocation()
  const [showTenantDropdown, setShowTenantDropdown] = useState(false)

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: tenantService.getAllTenants,
    enabled: user?.role === 'admin',
  })

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleTenantSwitch = async (tenantId: string) => {
    await switchTenant(tenantId)
    setShowTenantDropdown(false)
  }

  if (!user) return null

  return (
    <nav className="bg-slate-800 border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-semibold text-slate-100">
              {import.meta.env.VITE_APP_NAME}
            </Link>

            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              <Link
                to="/"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                  location.pathname === '/'
                    ? 'border-primary-500 text-primary-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                Documents
              </Link>

              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                    location.pathname === '/admin'
                      ? 'border-primary-500 text-primary-400'
                      : 'border-transparent text-slate-400 hover:text-slate-300'
                  }`}
                >
                  Admin
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {currentTenant && (
              <div className="relative">
                <button
                  onClick={() => setShowTenantDropdown(!showTenantDropdown)}
                  className="flex items-center space-x-2 text-sm text-slate-300 hover:text-slate-100 transition-colors"
                  disabled={user.role !== 'admin'}
                >
                  <span>{currentTenant.name}</span>
                  {user.role === 'admin' && (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  )}
                </button>

                {showTenantDropdown && user.role === 'admin' && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-700 rounded-lg border border-slate-600 py-1 z-10">
                    {tenants.map(tenant => (
                      <button
                        key={tenant.id}
                        onClick={() => handleTenantSwitch(tenant.id)}
                        className="flex items-center w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-600"
                      >
                        <span>{tenant.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-400">{user.email}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
