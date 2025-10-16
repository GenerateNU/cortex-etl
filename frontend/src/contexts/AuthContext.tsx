/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react'
import type { AuthContextType, LoginForm } from '../types/auth.types'
import type { Subscription } from '@supabase/supabase-js'
import { supabase } from '../config/supabase.config'
import type { User } from '../types/user.types'
import type { Tenant } from '../types/tenant.types'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const getCurrentUser = async (): Promise<User | null> => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name, role, tenant_id')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Failed to fetch profile:', profileError)
      return {
        id: user.id,
        email: user.email!,
        first_name: '',
        last_name: '',
        tenant: null,
        role: 'tenant',
      }
    }

    // Only fetch tenant if tenant_id exists
    let tenant = null
    if (profile?.tenant_id) {
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', profile.tenant_id)
        .single()

      if (tenantError) {
        console.error('Failed to fetch tenant:', tenantError)
      } else {
        tenant = tenantData
      }
    }

    return {
      id: user.id,
      email: user.email!,
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      tenant: tenant,
      role: profile?.role || 'tenant',
    }
  }

  const onAuthStateChange = (callback: (user: User | null) => void) => {
    return supabase.auth.onAuthStateChange(async (_, session) => {
      if (session?.user) {
        const user = await getCurrentUser()
        callback(user)
      } else {
        callback(null)
      }
    })
  }

  const login = async (credentials: LoginForm) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })
    if (error) throw error
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error

    setUser(null)
    setCurrentTenant(null)
  }

  const switchTenant = async (tenantId: string) => {
    if (user?.role !== 'admin') return

    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single()

    if (error) {
      console.error('Failed to fetch tenant:', error)
      return
    }

    if (tenant) {
      setCurrentTenant(tenant)
      setUser(prev => (prev ? { ...prev, tenant } : null))
    }
  }

  const loadTenantData = async (tenant: Tenant | null) => {
    if (tenant) {
      setCurrentTenant(tenant)
    } else {
      setCurrentTenant(null)
    }
  }

  useEffect(() => {
    let subscription: Subscription | null = null

    async function initializeAuth() {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()
        if (error) throw error

        if (!session) {
          setIsLoading(false)
          return
        }

        const currentUser = await getCurrentUser()

        if (!currentUser) {
          setUser(null)
          setCurrentTenant(null)
          setIsLoading(false)
          return
        }

        setUser(currentUser)
        await loadTenantData(currentUser.tenant)
        setIsLoading(false)
      } catch (error) {
        console.error('Auth initialization error:', error)
        setUser(null)
        setCurrentTenant(null)
        setIsLoading(false)
      } finally {
        const {
          data: { subscription: sub },
        } = onAuthStateChange(async user => {
          setUser(user)

          if (user?.tenant) {
            await loadTenantData(user.tenant)
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
