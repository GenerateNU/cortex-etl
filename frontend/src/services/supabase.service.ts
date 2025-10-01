import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { User, Tenant } from '../types/auth.types'
import type { FileUpload } from '../types/file.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  }
)

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

  async getSession() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()
    if (error) throw error
    return session
  },

  async getCurrentUser(): Promise<User | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('first_name, last_name, role, tenant_id')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Failed to fetch profile:', error)
      return {
        id: user.id,
        email: user.email!,
        first_name: '',
        last_name: '',
        tenant_id: null,
        role: 'tenant',
      }
    }

    return {
      id: user.id,
      email: user.email!,
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
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

    if (error) {
      console.error('Failed to fetch tenant:', error)
      return null
    }
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
  async uploadFile(
    file: File,
    tenantId: string
  ): Promise<{ fileId: string; path: string }> {
    const fileName = `${tenantId}/${file.name}`

    console.log('Starting upload:', { fileName, tenantId })

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, file)

    if (uploadError) {
      console.error('Storage upload failed:', uploadError)
      throw uploadError
    }

    console.log('Storage upload succeeded:', uploadData.path)

    const { data, error: dbError } = await supabase
      .from('file_uploads')
      .insert({
        name: file.name,
        bucket_id: 'documents',
        tenant_id: tenantId,
      })
      .select() // Get the inserted row back

    console.log('Database insert result:', { data, error: dbError })

    if (dbError) {
      console.error('Database insert failed, rolling back storage:', dbError)
      await supabase.storage.from('documents').remove([uploadData.path])
      throw dbError
    }

    console.log('File upload complete, ID:', data?.[0]?.id)

    return { fileId: data[0].id, path: uploadData.path }
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

  async deleteFile(filePath: string, fileId: string): Promise<void> {
    // Delete from storage using path
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([filePath])

    if (storageError) throw storageError

    // Delete from database - this should cascade to extracted_files
    const { error: dbError } = await supabase
      .from('file_uploads')
      .delete()
      .eq('id', fileId)

    if (dbError) throw dbError
  },

  async getSignedUrl(path: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(path, 3600)

    if (error) throw error
    return data.signedUrl
  },
}
