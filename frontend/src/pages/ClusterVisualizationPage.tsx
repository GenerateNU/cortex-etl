import { useQueryClient } from '@tanstack/react-query'
import { ClusteringVisualization } from '../components/classification/ClusteringVisualization'
import { Layout } from '../components/layout/Layout'
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription'
import { QUERY_KEYS } from '../utils/constants'
import { useCallback } from 'react'

export function ClusterVisualizationPage() {
  const queryClient = useQueryClient()

  const handleExtractedFilesChange = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.classifications.all(),
    })
  }, [queryClient])

  useRealtimeSubscription({
    table: 'extracted_files',
    event: '*',
    onEvent: handleExtractedFilesChange,
  })

  return (
    <Layout>
      <ClusteringVisualization />
    </Layout>
  )
}
