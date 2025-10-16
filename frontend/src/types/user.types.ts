import type { Tenant } from './tenant.types'

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  tenant: Tenant | null
  role: 'tenant' | 'admin'
}
