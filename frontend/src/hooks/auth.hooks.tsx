import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { tenantService } from '../services/supabase.service'
import { QUERY_KEYS } from '../utils/constants'

export function useLogin() {
  const { login } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: login,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AUTH })
    },
  })
}

export function useLogout() {
  const { logout } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear()
    },
  })
}

export function useTenants() {
  const { user } = useAuth()

  return useQuery({
    queryKey: QUERY_KEYS.TENANTS,
    queryFn: tenantService.getAllTenants,
    enabled: user?.role === 'admin',
  })
}
