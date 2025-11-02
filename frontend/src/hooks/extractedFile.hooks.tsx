import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { QUERY_KEYS } from '../utils/constants'
import { supabase } from '../config/supabase.config'
import type { ExtractedFile } from '../types/extracted-file.types'

export const useGetAllExtractedFiles = () => {
  const { currentTenant } = useAuth()

  const query = useQuery({
    queryKey: QUERY_KEYS.extractedFiles.list(currentTenant?.id),
    queryFn: async (): Promise<ExtractedFile[]> => {
      if (!currentTenant) return []

      const { data, error } = await supabase
        .from('extracted_files')
        .select('*, file_uploads!inner(tenant_id)')
        .eq('file_uploads.tenant_id', currentTenant.id)

      if (error) throw error
      return data
        ? data.map(extractedFile => ({
            ...extractedFile,
            embedding: extractedFile.embedding as unknown as number[] | null,
          }))
        : []
    },
    enabled: !!currentTenant?.id,
  })

  return {
    extractedFiles: query.data,
    extractedFilesIsLoading: query.isLoading,
  }
}

export const useGetExtractedFile = (sourceFileId: string | undefined) => {
  const { user } = useAuth()

  const query = useQuery({
    queryKey: QUERY_KEYS.extractedFiles.detail(sourceFileId),
    queryFn: async (): Promise<ExtractedFile | null> => {
      if (!sourceFileId) {
        return null
      }

      const { data, error } = await supabase
        .from('extracted_files')
        .select('*, file_uploads!inner(tenant_id)')
        .eq('source_file_id', sourceFileId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - file not yet processed
          return null
        }
        throw error
      }

      return {
        ...data,
        embedding: data.embedding as unknown as number[] | null,
      }
    },
    enabled: !!sourceFileId && user?.role === 'admin',
  })

  return {
    extractedFile: query.data,
    extractedFileIsLoading: query.isLoading,
    extractedFileError: query.error,
    extractedFileRefetch: query.refetch,
  }
}
