export interface Tenant {
  id: string
  name: string
  created_at: string
  is_active: boolean
}

export interface User {
  id: string
  email: string
  tenant_id: string | null // Current tenant: fixed for tenant users, selected for admins
  role: 'tenant' | 'admin'
}

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
