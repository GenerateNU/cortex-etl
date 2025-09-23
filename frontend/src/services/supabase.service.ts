import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { User, Tenant } from '../types/auth.types'
import type { FileUpload } from '../types/file.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storage: window.localStorage,
  },
})

export const authService = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single()

    return {
      id: user.id,
      email: user.email!,
      tenant_id: profile?.tenant_id || null,
      role: profile?.role || 'tenant',
    }
  },

  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange(async (_, session) => {
      if (session?.user) {
        const user = await this.getCurrentUser()
        callback(user)
      } else {
        callback(null)
      }
    })
  },
}

export const tenantService = {
  async getTenant(id: string): Promise<Tenant | null> {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) return null
    return data
  },

  async getAllTenants(): Promise<Tenant[]> {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('is_active', true)
      .order('name')
    
    if (error) throw error
    return data || []
  },
}

export const fileService = {
  async uploadFile(file: File, tenantId: string): Promise<string> {
    const fileName = `${tenantId}/${Date.now()}-${file.name}`
    
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(fileName, file)
    
    if (error) throw error
    return data.path
  },

  async getFiles(tenantId: string): Promise<FileUpload[]> {
    const { data, error } = await supabase
      .from('file_uploads')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async deleteFile(path: string): Promise<void> {
    const { error } = await supabase.storage
      .from('documents')
      .remove([path])
    
    if (error) throw error
  },

  getPublicUrl(path: string): string {
    const { data } = supabase.storage
      .from('documents')
      .getPublicUrl(path)
    
    return data.publicUrl
  },
}