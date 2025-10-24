import type { Json } from './database.types'

export interface ExtractedFile {
  id: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  source_file_id: string
  extracted_data: Json
  embedding: number[] | null
  created_at: string | null
  updated_at: string | null
}
