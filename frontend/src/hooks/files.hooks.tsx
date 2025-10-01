import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { fileService } from '../services/supabase.service'
import { QUERY_KEYS } from '../utils/constants'

export function useFiles() {
  const { user } = useAuth()

  return useQuery({
    queryKey: [...QUERY_KEYS.FILES, user?.tenant_id],
    queryFn: () => fileService.getFiles(user!.tenant_id!),
    enabled: !!user?.tenant_id,
  })
}

export function useUpload() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => fileService.uploadFile(file, user!.tenant_id!),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...QUERY_KEYS.FILES, user?.tenant_id],
      })
    },
  })
}

export function useDeleteFile() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ fileId, filePath }: { fileId: string; filePath: string }) =>
      fileService.deleteFile(filePath, fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...QUERY_KEYS.FILES, user?.tenant_id],
      })
    },
  })
}
