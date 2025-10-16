import { useGetClusterVisualization } from '../../hooks/classification.hooks'
import Plot from 'react-plotly.js'
import { LoadingSpinner } from '../common/LoadingSpinner'

export function ClusteringVisualization() {
  const {
    visualizationResponse,
    visualizationResponseIsLoading,
    visualizationResponseError,
  } = useGetClusterVisualization()

  if (visualizationResponseIsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" className="text-slate-400" />
      </div>
    )
  }

  if (visualizationResponseError) {
    return (
      <div className="p-6">
        <div className="bg-slate-800 border border-red-500 rounded-xl p-6">
          <p className="text-red-400">
            Error: {visualizationResponseError.message}
          </p>
        </div>
      </div>
    )
  }

  if (!visualizationResponse) {
    return null
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Full-height plot */}
      <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <Plot
          data={visualizationResponse.plotly_data}
          layout={{
            hovermode: 'closest',
            autosize: true,
            paper_bgcolor: '#1e293b',
            plot_bgcolor: '#1e293b',
            font: { color: '#cbd5e1' },
            xaxis: { gridcolor: '#334155' },
            yaxis: { gridcolor: '#334155' },
            margin: { l: 60, r: 40, t: 40, b: 60 },
          }}
          config={{ responsive: true }}
          className="w-full h-full"
          useResizeHandler={true}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Cluster stats bar at bottom */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mt-4">
        {Object.entries(visualizationResponse.cluster_stats).map(
          ([cluster, count]) => (
            <div
              key={cluster}
              className="bg-slate-800 border border-slate-700 rounded-lg p-3"
            >
              <div className="text-xs text-slate-400">
                {cluster === '-1' ? 'Noise' : `Cluster ${cluster}`}
              </div>
              <div className="text-xl font-semibold text-slate-100">
                {count}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  )
}
