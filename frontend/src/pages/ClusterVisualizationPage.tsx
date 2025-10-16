import { useQueryClient } from '@tanstack/react-query'
import { ClusteringVisualization } from '../components/classification/ClusteringVisualization'
import { Layout } from '../components/layout/Layout'
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription'
import { QUERY_KEYS } from '../utils/constants'

export function ClusterVisualizationPage() {
  const queryClient = useQueryClient()

  useRealtimeSubscription({
    table: 'extracted_files',
    event: '*',
    onEvent: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CLASSIFICATION })
    },
  })

  return (
    <Layout>
      <ClusteringVisualization />
    </Layout>
  )
}
