interface ErrorAlertProps {
  error: unknown
  title?: string
}

export function ErrorAlert({
  error,
  title = 'An error occurred',
}: ErrorAlertProps) {
  if (!error) return null

  // Extract error message from various error types
  const getErrorMessage = (): string => {
    // Check for axios error with response data
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const axiosError = error as {
        response?: {
          data?: { detail?: string }
          status?: number
        }
      }
      if (axiosError.response?.data?.detail) {
        return axiosError.response.data.detail
      }
    }

    // Fallback to error message
    if (error instanceof Error) {
      return error.message
    }

    return 'An unknown error occurred'
  }

  // Extract status code if available
  const getStatusCode = (): number | null => {
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const axiosError = error as { response?: { status?: number } }
      return axiosError.response?.status ?? null
    }
    return null
  }

  const message = getErrorMessage()
  const statusCode = getStatusCode()

  return (
    <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
      <div className="flex items-start space-x-3">
        <svg
          className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-medium text-red-400">{title}</h3>
            {statusCode && (
              <span className="text-xs text-red-400/70">({statusCode})</span>
            )}
          </div>
          <p className="text-sm text-red-300 mt-1">{message}</p>
        </div>
      </div>
    </div>
  )
}
