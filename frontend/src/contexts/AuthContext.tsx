import React, { createContext, useContext, useEffect, useState } from 'react'
import type {
  User,
  Tenant,
  AuthContextType,
  LoginForm,
} from '../types/auth.types'
import { authService, tenantService } from '../services/supabase.service'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const login = async (credentials: LoginForm) => {
    await authService.signIn(credentials.email, credentials.password)
    // User state will be updated via the auth state change listener
  }

  const logout = async () => {
    await authService.signOut()
    setUser(null)
    setCurrentTenant(null)
  }

  const switchTenant = async (tenantId: string) => {
    if (user?.role !== 'admin') return

    const tenant = await tenantService.getTenant(tenantId)
    if (tenant) {
      setCurrentTenant(tenant)
      setUser(prev => (prev ? { ...prev, tenant_id: tenantId } : null))
    }
  }

  useEffect(() => {
    const {
      data: { subscription },
    } = authService.onAuthStateChange(async user => {
      setUser(user)
      setIsLoading(false)

      if (user?.tenant_id) {
        const tenant = await tenantService.getTenant(user.tenant_id)
        setCurrentTenant(tenant)
      } else {
        setCurrentTenant(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const value: AuthContextType = {
    user,
    currentTenant,
    isLoading,
    login,
    logout,
    switchTenant,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
