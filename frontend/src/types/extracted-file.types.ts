export interface ExtractedFile {
  id: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  source_file_id: string
  extracted_data: Record<string, unknown>
  embedding: number[] | null
  created_at: string
  updated_at: string
}
