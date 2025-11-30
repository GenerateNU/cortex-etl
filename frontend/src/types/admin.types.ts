import type { Tenant } from './tenant.types'

export interface ETLOperation {
  id: string
  tenant_id: string
  operation_type: 'extract' | 'transform' | 'load'
  status: 'pending' | 'running' | 'completed' | 'failed'
  input_files: string[]
  output_data?: ETLResult
  error_message?: string
  started_at: string
  completed_at?: string
}

export interface ETLResult {
  records_processed: number
  tables_created: string[]
  data_quality_score: number
}

export interface ProcessingJob {
  id: string
  tenant_id: string
  files: string[]
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress: number
  result?: ProcessingJobResult
  created_at: string
}

export interface ProcessingJobResult {
  files_processed: number
  success_count: number
  error_count: number
  processing_time: number
}

export interface TenantSummary {
  tenant: Tenant
  file_count: number
  processing_jobs: number
  last_activity: string
}
