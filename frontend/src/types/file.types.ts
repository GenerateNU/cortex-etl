export interface FileUpload {
  id: string
  name: string
  size: number
  type: string
  tenant_id: string
  status: 'uploading' | 'processing' | 'completed' | 'error'
  created_at: string
  updated_at: string
  processing_result?: ProcessingResult
}

export interface ProcessingResult {
  extracted_data?: Record<string, unknown> | ExtractedData
  error_message?: string
  pages_processed?: number
  confidence_score?: number
}

export interface ExtractedData {
  tables?: Array<{
    headers: string[]
    rows: string[][]
  }>
  text?: string
  metadata?: {
    page_count: number
    file_size: number
    processing_time: number
  }
}

export interface StorageBucket {
  id: string
  name: string
  public: boolean
}

export interface UploadProgress {
  fileId: string
  progress: number
  status: FileUpload['status']
}
