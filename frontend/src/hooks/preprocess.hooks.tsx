import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { QUERY_KEYS } from '../utils/constants'
import type { ExtractionSuccess } from '../types/preprocessing.types'
import api from '../config/axios.config'

export const useRetryExtract = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const retryExtract = useMutation({
    mutationFn: async (fileUploadId: string): Promise<ExtractionSuccess> => {
      if (user?.role !== 'admin') {
        throw new Error('Only admins can retry extraction')
      }

      const { data } = await api.post(
        `/preprocess/retry_extraction/${fileUploadId}`
      )

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FILES })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EXTRACTED_FILES })
    },
  })

  return {
    retryExtract: retryExtract.mutateAsync,
    isRetryingExtract: retryExtract.isPending,
    retryExtractError: retryExtract.error,
  }
}
