/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react'
import type {
  User,
  Tenant,
  AuthContextType,
  LoginForm,
} from '../types/auth.types'
import { authService, tenantService } from '../services/supabase.service'
import type { Subscription } from '@supabase/supabase-js'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const login = async (credentials: LoginForm) => {
    await authService.signIn(credentials.email, credentials.password)
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

  const loadTenantData = async (tenantId: string | null) => {
    if (tenantId) {
      const tenant = await tenantService.getTenant(tenantId)
      setCurrentTenant(tenant)
    } else {
      setCurrentTenant(null)
    }
  }

  useEffect(() => {
    let subscription: Subscription | null = null

    async function initializeAuth() {
      try {
        const session = await authService.getSession()

        if (!session) {
          setIsLoading(false)
          return
        }

        const currentUser = await authService.getCurrentUser()

        if (!currentUser) {
          setUser(null)
          setCurrentTenant(null)
          setIsLoading(false)
          return
        }

        setUser(currentUser)
        await loadTenantData(currentUser.tenant_id)
        setIsLoading(false)
      } catch (error) {
        console.error('Auth initialization error:', error)
        setUser(null)
        setCurrentTenant(null)
        setIsLoading(false)
      } finally {
        const {
          data: { subscription: sub },
        } = authService.onAuthStateChange(async user => {
          setUser(user)

          if (user?.tenant_id) {
            await loadTenantData(user.tenant_id)
          } else {
            setCurrentTenant(null)
          }
        })
        subscription = sub
      }
    }

    initializeAuth()

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
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
