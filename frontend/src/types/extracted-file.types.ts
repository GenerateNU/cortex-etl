export interface ExtractedFile {
  id: string
  source_file_id: string
  extracted_data: Record<string, unknown>
  embedding: number[] | null
  created_at: string
  updated_at: string
}
