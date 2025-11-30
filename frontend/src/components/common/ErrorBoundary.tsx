import React from 'react'
import { Button } from '../ui/Button'
import { JsonViewer } from '../ui/JsonViewer'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  private isDevelopment(): boolean {
    return import.meta.env.VITE_ENVIRONMENT === 'development'
  }

  private getErrorDetails() {
    const { error, errorInfo } = this.state

    return {
      message: error?.message || 'Unknown error',
      name: error?.name || 'Error',
      stack: error?.stack || 'No stack trace available',
      componentStack:
        errorInfo?.componentStack || 'No component stack available',
      timestamp: new Date().toISOString(),
    }
  }

  private copyErrorToClipboard = () => {
    const details = this.getErrorDetails()
    const errorText = JSON.stringify(details, null, 2)

    navigator.clipboard.writeText(errorText).then(
      () => alert('Error details copied to clipboard'),
      err => console.error('Failed to copy:', err)
    )
  }

  private renderDevelopmentError() {
    const details = this.getErrorDetails()

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6">
        <div className="w-full max-w-[80vw]">
          <div className="bg-slate-800 border-2 border-red-500 rounded-xl p-6">
            {/* Error Header */}
            <div className="flex items-start space-x-4 mb-6">
              <div className="flex-shrink-0">
                <svg
                  className="w-12 h-12 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-red-400 mb-2">
                  Application Error (Development Mode)
                </h1>
                <p className="text-slate-300 text-lg">
                  {details.name}: {details.message}
                </p>
              </div>
            </div>

            {/* Error Details - Scrollable */}
            <div className="mb-6 max-h-[50vh] overflow-auto">
              <JsonViewer data={details} />
            </div>

            {/* Buttons */}
            <div className="flex space-x-3">
              <Button
                onClick={() => window.location.reload()}
                variant="primary"
                size="md"
              >
                Reload Application
              </Button>
              <Button
                onClick={this.copyErrorToClipboard}
                variant="secondary"
                size="md"
              >
                Copy Error Details
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  private renderProductionError() {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6">
        <div className="max-w-md w-full">
          <div className="bg-slate-800 border-2 border-red-500 rounded-xl p-8">
            <div className="text-center">
              {/* Error Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
              </div>

              {/* Error Message */}
              <h1 className="text-2xl font-bold text-slate-100 mb-3">
                Something went wrong
              </h1>
              <p className="text-slate-400 mb-6">
                We're sorry, but something unexpected happened. Please try
                reloading the page. If the problem persists, contact support.
              </p>

              {/* Actions */}
              <div className="flex flex-col space-y-3">
                <Button
                  onClick={() => window.location.reload()}
                  variant="primary"
                  size="lg"
                  className="w-full"
                >
                  Reload Application
                </Button>
                <Button
                  onClick={() => window.history.back()}
                  variant="secondary"
                  size="lg"
                  className="w-full"
                >
                  Go Back
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  render() {
    if (this.state.hasError) {
      return this.isDevelopment()
        ? this.renderDevelopmentError()
        : this.renderProductionError()
    }

    return this.props.children
  }
}
