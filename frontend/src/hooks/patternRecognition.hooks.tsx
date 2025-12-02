import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../config/axios.config'
import { useAuth } from '../contexts/AuthContext'
import { QUERY_KEYS } from '../utils/constants'
import type {
  Relationship,
  RelationshipCreate,
} from '../types/relationship.types'
import type { Tables } from '../types/database.types'
import { supabase } from '../config/supabase.config'

export const useAnalyzeRelationships = () => {
  const { currentTenant, user } = useAuth()
  const queryClient = useQueryClient()

  const analyzeMutation = useMutation({
    mutationFn: async (): Promise<RelationshipCreate[]> => {
      if (!currentTenant) {
        throw new Error('No tenant selected')
      }
      if (user?.role !== 'admin') {
        throw new Error('Only admins can analyze relationships')
      }

      const { data } = await api.post(
        `/pattern-recognition/analyze/${currentTenant.id}`
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.relationships.list(currentTenant?.id),
      })
    },
  })

  return {
    analyzeRelationships: analyzeMutation.mutateAsync,
    isAnalyzingRelationships: analyzeMutation.isPending,
    analyzeRelationshipsError: analyzeMutation.error,
  }
}

export const useGetRelationships = () => {
  const { currentTenant } = useAuth()

  const {
    data: relationships,
    isLoading,
    error,
  } = useQuery({
    queryKey: QUERY_KEYS.relationships.list(currentTenant?.id),
    enabled: !!currentTenant?.id,
    queryFn: async (): Promise<Relationship[]> => {
      if (!currentTenant) return []

      const { data, error } = await supabase
        .from('relationships')
        .select(
          [
            'id',
            'tenant_id',
            'type',
            // join both sides to classifications for names
            'from_classification:classifications!relationships_from_classification_id_fkey(id, tenant_id, name)',
            'to_classification:classifications!relationships_to_classification_id_fkey(id, tenant_id, name)',
          ].join(', ')
        )
        .eq('tenant_id', currentTenant.id)

      if (error) throw error

      type RawRow = Tables<'relationships'> & {
        from_classification: { id: string; tenant_id: string; name: string }
        to_classification: { id: string; tenant_id: string; name: string }
      }

      return ((data ?? []) as unknown as RawRow[]).map(row => ({
        relationship_id: row.id,
        tenant_id: row.tenant_id,
        type: row.type,
        from_classification: {
          classification_id: row.from_classification.id,
          tenant_id: row.from_classification.tenant_id,
          name: row.from_classification.name,
        },
        to_classification: {
          classification_id: row.to_classification.id,
          tenant_id: row.to_classification.tenant_id,
          name: row.to_classification.name,
        },
      }))
    },
  })

  return {
    relationships: relationships ?? [],
    relationshipsIsLoading: isLoading,
    relationshipsError: error,
  }
}
