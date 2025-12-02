import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../config/axios.config'
import { useAuth } from '../contexts/AuthContext'
import { QUERY_KEYS } from '../utils/constants'
import type { Migration } from '../types/migration.types'
import { supabase } from '../config/supabase.config'

export const useListMigrations = () => {
  const { currentTenant } = useAuth()

  const {
    data: migrations,
    isLoading,
    error,
  } = useQuery({
    queryKey: QUERY_KEYS.migrations.list(currentTenant?.id),
    enabled: !!currentTenant?.id,
    queryFn: async (): Promise<Migration[]> => {
      if (!currentTenant) return []

      const { data, error } = await supabase
        .from('migrations')
        .select('id, tenant_id, name, sql, sequence')
        .eq('tenant_id', currentTenant.id)
        .order('sequence', { ascending: true })

      if (error) throw error

      return data
        ? data.map(m => ({
            migration_id: m.id as string,
            tenant_id: m.tenant_id as string,
            name: m.name as string,
            sql: m.sql as string,
            sequence: m.sequence as number,
          }))
        : []
    },
  })

  return {
    migrations: migrations ?? [],
    migrationsIsLoading: isLoading,
    migrationsError: error,
  }
}

export const useGenerateMigrations = () => {
  const { currentTenant } = useAuth()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (): Promise<Migration[]> => {
      if (!currentTenant) {
        throw new Error('No tenant selected')
      }

      const { data } = await api.post(
        `/migrations/generate/${currentTenant.id}`
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.migrations.list(currentTenant?.id),
      })
    },
  })

  return {
    generateMigrations: mutation.mutateAsync,
    isGeneratingMigrations: mutation.isPending,
    generateMigrationsError: mutation.error,
  }
}

export const useExecuteMigrations = () => {
  const { currentTenant } = useAuth()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (): Promise<void> => {
      if (!currentTenant) {
        throw new Error('No tenant selected')
      }

      await api.post(`/migrations/execute/${currentTenant.id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.migrations.list(currentTenant?.id),
      })
    },
  })

  return {
    executeMigrations: mutation.mutateAsync,
    isExecutingMigrations: mutation.isPending,
    executeMigrationsError: mutation.error,
  }
}
