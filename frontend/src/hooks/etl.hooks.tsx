import { useQuery, useMutation } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { adminService } from '../services/api.service'
import { QUERY_KEYS } from '../utils/constants'

export function useETLOperations() {
  const { user } = useAuth()

  return useQuery({
    queryKey: [...QUERY_KEYS.ETL_OPERATIONS, user?.tenant_id],
    queryFn: () => adminService.getETLOperations(user!.tenant_id!),
    enabled: user?.role === 'admin' && !!user?.tenant_id,
  })
}

export function useStartProcessing() {
  return useMutation({
    mutationFn: ({
      tenantId,
      fileIds,
    }: {
      tenantId: string
      fileIds: string[]
    }) => adminService.startProcessing(tenantId, fileIds),
  })
}

export function useProcessingStatus(jobId: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.PROCESSING_STATUS, jobId],
    queryFn: () => adminService.getProcessingStatus(jobId),
    enabled: !!jobId,
    refetchInterval: 2000,
  })
}
