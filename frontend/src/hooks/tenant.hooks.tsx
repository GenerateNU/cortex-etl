import { useQuery } from '@tanstack/react-query'
import { supabase } from '../config/supabase.config'
import type { Tenant } from '../types/tenant.types'
import { QUERY_KEYS } from '../utils/constants'
import { useAuth } from '../contexts/AuthContext'

export const useGetAllTenants = () => {
  const { user } = useAuth()

  const query = useQuery({
    queryKey: QUERY_KEYS.TENANTS,
    queryFn: async (): Promise<Tenant[]> => {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      return data || []
    },
    enabled: user?.role === 'admin',
  })

  return {
    tenants: query.data,
    tenantsIsLoading: query.isLoading,
    tenantsError: query.error,
    tenantsRefetch: query.refetch,
  }
}

export const useGetTenant = (tenantId: string | undefined) => {
  const { user } = useAuth()

  const query = useQuery({
    queryKey: QUERY_KEYS.TENANTS,
    queryFn: async (): Promise<Tenant | null> => {
      if (!tenantId) {
        throw new Error('Tenant ID is required')
      }
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single()

      if (error) {
        console.error('Failed to fetch tenant:', error)
        return null
      }
      return data
    },
    enabled: !!tenantId && user?.role === 'admin',
  })

  return {
    tenant: query.data,
    tenantIsLoading: query.isLoading,
    tenantError: query.error,
    tenantRefetch: query.refetch,
  }
}
