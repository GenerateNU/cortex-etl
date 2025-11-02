import { Link } from 'react-router-dom'

export function DevMenu() {
  if (import.meta.env.VITE_ENVIRONMENT !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Link
        to="/error-test"
        className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-red-600 text-sm font-medium inline-flex items-center space-x-2 transition-colors"
      >
        <span>🐛</span>
        <span>Test Errors</span>
      </Link>
    </div>
  )
}
