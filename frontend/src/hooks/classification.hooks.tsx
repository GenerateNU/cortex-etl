import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { QUERY_KEYS } from '../utils/constants'
import type { VisualizationResponse } from '../types/classification.types'
import api from '../config/axios.config'

export const useGetClusterVisualization = () => {
  const { currentTenant, user } = useAuth()

  const query = useQuery({
    queryKey: QUERY_KEYS.CLASSIFICATION,
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
