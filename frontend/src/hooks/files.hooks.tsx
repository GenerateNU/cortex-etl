import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { QUERY_KEYS } from '../utils/constants'
import { supabase } from '../config/supabase.config'
import type { FileUpload } from '../types/file.types'

export const useGetAllFiles = () => {
  const { currentTenant } = useAuth()

  const query = useQuery({
    queryKey: [...QUERY_KEYS.FILES, currentTenant?.id],
    queryFn: async (): Promise<FileUpload[]> => {
      if (!currentTenant) return []
      const { data, error } = await supabase
        .from('file_uploads')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!currentTenant?.id,
  })

  return {
    files: query.data,
    filesIsLoading: query.isLoading,
    filesError: query.error,
    filesRefetch: query.refetch,
  }
}

export const useGetFile = (fileUploadId: string) => {
  const { currentTenant } = useAuth()

  if (!currentTenant) {
    return {
      files: undefined,
      filesIsLoading: false,
      filesError: null,
      filesRefetch: async () => {
        throw new Error('No tenant selected')
      },
    }
  }

  const query = useQuery({
    queryKey: [...QUERY_KEYS.FILES, currentTenant.id],
    queryFn: async (): Promise<FileUpload> => {
      const { data, error } = await supabase
        .from('file_uploads')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .eq('id', fileUploadId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!currentTenant?.id,
  })

  return {
    files: query.data,
    filesIsLoading: query.isLoading,
    filesError: query.error,
    filesRefetch: query.refetch,
  }
}

export const useFilesMutations = () => {
  const { currentTenant } = useAuth()
  const queryClient = useQueryClient()

  const uploadFile = useMutation({
    mutationFn: async (file: File): Promise<{ path: string }> => {
      if (!currentTenant) {
        throw new Error('No tenant selected')
      }

      const fileName = `${currentTenant.id}/${file.name}`

      console.log('Starting upload:', { fileName, currentTenant })

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file)

      if (uploadError) {
        console.error('Storage upload failed:', uploadError)
        throw uploadError
      }

      console.log('Storage upload succeeded:', uploadData.path)

      return { path: uploadData.path }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...QUERY_KEYS.FILES, currentTenant?.id],
      })
    },
  })

  const deleteFile = useMutation({
    mutationFn: async (fileUploadId: string): Promise<void> => {
      if (!currentTenant) {
        throw new Error('No tenant selected')
      }

      const { data: fileData, error: fetchError } = await supabase
        .from('file_uploads')
        .select('name')
        .eq('id', fileUploadId)
        .single()

      if (fetchError) throw fetchError
      if (!fileData) throw new Error('File not found')

      const { error: dbError } = await supabase
        .from('file_uploads')
        .delete()
        .eq('id', fileUploadId)

      if (dbError) throw dbError

      const filePath = `${currentTenant.id}/${fileData.name}`
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([filePath])

      if (storageError) throw storageError
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...QUERY_KEYS.FILES, currentTenant?.id],
      })
    },
  })

  return {
    uploadFile: uploadFile.mutateAsync,
    deleteFile: deleteFile.mutateAsync,
    isUploadingFile: uploadFile.isPending,
    isDeletingFile: deleteFile.isPending,
    uploadFileError: uploadFile.error,
    deleteFileError: deleteFile.error,
  }
}

export const useGetSignedUrl = (file: FileUpload | null) => {
  const { currentTenant } = useAuth()

  const query = useQuery({
    queryKey: [...QUERY_KEYS.FILES, 'signed-url', currentTenant?.id, file?.id],
    queryFn: async (): Promise<string> => {
      if (!currentTenant || !file) {
        throw new Error('Missing tenant or file')
      }

      const path = `${currentTenant.id}/${file.name}`
      console.log('Creating signed URL for:', path)

      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(path, 3600)

      if (error) {
        console.error('Signed URL error:', error)
        throw error
      }

      console.log('Signed URL created:', data.signedUrl)
      return data.signedUrl
    },
    enabled: !!currentTenant && !!file,
    staleTime: 3000 * 1000, // URLs valid for 50 minutes
  })

  return {
    signedUrl: query.data,
    signedUrlIsLoading: query.isLoading,
    signedUrlError: query.error,
    signedUrlRefetch: query.refetch,
  }
}
