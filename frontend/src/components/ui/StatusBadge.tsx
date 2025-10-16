interface StatusBadgeProps {
  status: 'processing' | 'completed' | 'error'
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles = {
    processing: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    completed: 'bg-green-500/10 text-green-400 border-green-500/20',
    error: 'bg-red-500/10 text-red-400 border-red-500/20',
  }

  const labels = {
    processing: 'Processing',
    completed: 'Completed Processing',
    error: 'Error Processing',
  }

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${styles[status]}`}
    >
      {labels[status]}
    </span>
  )
}
