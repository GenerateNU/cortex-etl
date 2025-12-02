export interface Migration {
  migration_id: string
  tenant_id: string
  name: string
  sql: string
  sequence: number
}
