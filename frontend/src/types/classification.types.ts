import type { Data } from 'plotly.js'

export interface DocumentPoint {
  id: string
  source_file_id: string
  name: string
  x: number
  y: number
  cluster: number
  tenant_id: string
}

export interface VisualizationResponse {
  documents: DocumentPoint[]
  plotly_data: Data[]
  cluster_stats: Record<number, number>
  total_count: number
}
