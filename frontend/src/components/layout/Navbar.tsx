import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useGetAllTenants } from '../../hooks/tenant.hooks'
import { useTenantParam } from '../../hooks/useUrlState'

export function Navbar() {
  const { user, currentTenant, logout, switchTenant } = useAuth()
  const location = useLocation()
  const [showTenantDropdown, setShowTenantDropdown] = useState(false)
  const [tenantParam, setTenantParam] = useTenantParam()

  const { tenants = [] } = useGetAllTenants()

  // Restore tenant from URL on mount
  useEffect(() => {
    if (user?.role === 'admin' && tenantParam && !currentTenant) {
      switchTenant(tenantParam)
    }
  }, [tenantParam, user?.role, currentTenant, switchTenant])

  // Sync URL when tenant changes in context
  useEffect(() => {
    if (currentTenant && tenantParam !== currentTenant.id) {
      setTenantParam(currentTenant.id)
    }
  }, [currentTenant, tenantParam, setTenantParam])

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleTenantSwitch = async (tenantId: string) => {
    await switchTenant(tenantId)
    setTenantParam(tenantId)
    setShowTenantDropdown(false)
  }

  const getDisplayName = () => {
    if (!user) return ''
    const fullName = `${user.first_name} ${user.last_name}`.trim()
    return fullName || user.email
  }

  if (!user) return null

  return (
    <nav className="bg-slate-800 border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex justify-between h-16">
          {/* Left Side - Navigation Links */}
          <div className="flex items-center space-x-8">
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

          {/* Center - Current Tenant Name */}
          {currentTenant && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <h1 className="text-lg font-semibold text-slate-100 truncate max-w-xs">
                {currentTenant.name}
              </h1>
            </div>
          )}

          {/* Right Side - Tenant Selector, User, Logout */}
          <div className="flex items-center space-x-4">
            {user.role === 'admin' && (
              <div className="relative">
                <button
                  onClick={() => setShowTenantDropdown(!showTenantDropdown)}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-slate-300 hover:text-slate-100 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <span>Switch Tenant</span>
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
                </button>

                {showTenantDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-700 rounded-lg border border-slate-600 shadow-lg py-1 z-10">
                    {tenants.map(tenant => (
                      <button
                        key={tenant.id}
                        onClick={() => handleTenantSwitch(tenant.id)}
                        className={`flex items-center w-full px-4 py-2 text-sm text-left transition-colors ${
                          currentTenant?.id === tenant.id
                            ? 'bg-slate-600 text-slate-100'
                            : 'text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        <span>{tenant.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <span className="text-sm text-slate-400">{getDisplayName()}</span>

            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
              aria-label="Logout"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
