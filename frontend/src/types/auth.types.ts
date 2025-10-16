import type { Tenant } from './tenant.types'
import type { User } from './user.types'

export interface LoginForm {
  email: string
  password: string
}

export interface AuthContextType {
  user: User | null
  currentTenant: Tenant | null
  isLoading: boolean
  login: (credentials: LoginForm) => Promise<void>
  logout: () => Promise<void>
  switchTenant: (tenantId: string) => Promise<void> // Admin only
}
