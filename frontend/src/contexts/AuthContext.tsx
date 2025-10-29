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

  const buildUserFromSession = async (authUser: any): Promise<User | null> => {
    console.log('🔍 buildUserFromSession for:', authUser.email)

    // Don't call supabase.auth.getUser() - we already have the authenticated user!
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name, role, tenant_id')
      .eq('id', authUser.id)
      .single()

    console.log('📋 Profile:', profile, 'Error:', profileError)

    if (profileError) {
      console.error('❌ Profile fetch failed:', profileError)
      return {
        id: authUser.id,
        email: authUser.email!,
        first_name: '',
        last_name: '',
        tenant: null,
        role: 'tenant',
      }
    }

    // Fetch tenant if needed
    let tenant = null
    if (profile?.tenant_id) {
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', profile.tenant_id)
        .single()

      if (tenantError) {
        console.error('❌ Tenant fetch failed:', tenantError)
      } else {
        tenant = tenantData
        console.log('🏢 Tenant:', tenant.name)
      }
    }

    const retrieved_user: User = {
      id: authUser.id,
      email: authUser.email!,
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      tenant: tenant,
      role: profile?.role || 'tenant',
    }

    console.log('✅ User built:', retrieved_user)
    return retrieved_user
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

  useEffect(() => {
    console.log('🟢 AuthProvider mounted')
    let subscription: Subscription | null = null

    const handleAuthChange = async (event: string, session: any) => {
      console.log(
        `🔔 Auth event: ${event}`,
        session?.user?.email || 'no session'
      )

      if (session?.user) {
        console.log('🔄 Building user from session user...')
        // Use session.user directly - it's already authenticated!
        const currentUser = await buildUserFromSession(session.user)

        console.log('💾 Setting user state:', currentUser)
        setUser(currentUser)

        if (currentUser?.tenant) {
          setCurrentTenant(currentUser.tenant)
        } else {
          setCurrentTenant(null)
        }
      } else {
        console.log('🚫 Clearing user state')
        setUser(null)
        setCurrentTenant(null)
      }

      console.log('✋ Setting isLoading = false')
      setIsLoading(false)
    }

    const {
      data: { subscription: sub },
    } = supabase.auth.onAuthStateChange(handleAuthChange)
    subscription = sub

    // Fallback timeout
    const timeout = setTimeout(() => {
      console.log('⏰ Timeout: setting isLoading = false')
      setIsLoading(false)
    }, 1000)

    return () => {
      console.log('🧹 Cleanup')
      clearTimeout(timeout)
      subscription?.unsubscribe()
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
