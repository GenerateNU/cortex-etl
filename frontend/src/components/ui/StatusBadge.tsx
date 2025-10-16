interface StatusBadgeProps {
  status: 'processing' | 'completed' | 'error' | 'uploading' | 'success'
  label?: string
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const styles = {
    processing: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    completed: 'bg-green-500/10 text-green-400 border-green-500/20',
    error: 'bg-red-500/10 text-red-400 border-red-500/20',
    uploading: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    success: 'bg-green-500/10 text-green-400 border-green-500/20',
  }

  const defaultLabels = {
    processing: 'Processing',
    completed: 'Completed',
    error: 'Error',
    uploading: 'Uploading',
    success: 'Success',
  }

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${styles[status]}`}
    >
      {label || defaultLabels[status]}
    </span>
  )
}
