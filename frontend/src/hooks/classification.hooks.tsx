import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { QUERY_KEYS } from '../utils/constants'
import type {
  Classification,
  VisualizationResponse,
} from '../types/classification.types'
import api from '../config/axios.config'
import { supabase } from '../config/supabase.config'

export const useGetClusterVisualization = () => {
  const { currentTenant, user } = useAuth()

  const query = useQuery({
    queryKey: QUERY_KEYS.classifications.visualization(currentTenant?.id),
    queryFn: async (): Promise<VisualizationResponse> => {
      const { data } = await api.get(
        `/classification/visualize_clustering/${currentTenant?.id}`
      )

      return data
    },
    enabled: !!currentTenant?.id && user?.role === 'admin',
  })

  return {
    visualizationResponse: query.data,
    visualizationResponseIsLoading: query.isLoading,
    visualizationResponseError: query.error,
    visualizationResponseRefetch: query.refetch,
  }
}

export const useGetClassifications = () => {
  const { currentTenant, user } = useAuth()

  const query = useQuery({
    queryKey: QUERY_KEYS.classifications.list(currentTenant?.id),
    queryFn: async (): Promise<Classification[]> => {
      if (!currentTenant) return []

      const { data } = await supabase
        .from('classifications')
        .select('*')
        .eq('tenant_id', currentTenant.id)

      return data
        ? data.map(classification => ({
            classification_id: classification.id,
            tenant_id: classification.tenant_id,
            name: classification.name,
          }))
        : []
    },
    enabled: !!currentTenant?.id && user?.role === 'admin',
  })

  return {
    classifications: query.data,
    classificationsIsLoading: query.isLoading,
    classificationsError: query.error,
    classificationsRefetch: query.refetch,
  }
}

export const useClassifications = () => {
  const { currentTenant } = useAuth()
  const queryClient = useQueryClient()

  const createClassificationsMutation = useMutation({
    mutationFn: async (): Promise<Classification[]> => {
      if (!currentTenant) {
        throw new Error('No tenant selected')
      }

      const { data } = await api.post(
        `/classification/create_classifications/${currentTenant?.id}`
      )

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.classifications.list(currentTenant?.id),
      })
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.classifications.visualization(currentTenant?.id),
      })
    },
  })

  const classifyFilesMutation = useMutation({
    mutationFn: async () => {
      if (!currentTenant) {
        throw new Error('No tenant selected')
      }

      await api.post(`/classification/classify_files/${currentTenant?.id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.classifications.list(currentTenant?.id),
      })
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.files.list(currentTenant?.id),
      })
    },
  })

  return {
    createClassifications: createClassificationsMutation.mutateAsync,
    isCreatingClassifications: createClassificationsMutation.isPending,
    createClassificationsError: createClassificationsMutation.error,
    classifyFiles: classifyFilesMutation.mutateAsync,
    isClassifyingFiles: classifyFilesMutation.isPending,
    classifyingFilesError: classifyFilesMutation.error,
  }
}
