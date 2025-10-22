export interface FileUpload {
  id: string
  type: 'pdf' | 'csv'
  name: string
  tenant_id: string
  created_at: string
}
