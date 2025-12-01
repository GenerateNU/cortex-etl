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
      <div className="flex h-full min-h-0 flex-col">
        <header className="flex-shrink-0">
          <h1 className="text-2xl font-semibold text-slate-100">
            Cluster Visualization
          </h1>
        </header>

        <section className="mt-4 flex-1 min-h-0 overflow-y-auto">
          <ClusteringVisualization />
        </section>
      </div>
    </Layout>
  )
}
