import type { FC } from 'react'
import { useState } from 'react'
import { ErrorAlert } from '../../ui/ErrorAlert'
import { useGetConnectionUrl } from '../../../hooks/migrations.hooks'

interface ConnectionUrlStepProps {
  onCompleted?: () => void
}

export const ConnectionUrlStep: FC<ConnectionUrlStepProps> = ({
  onCompleted,
}) => {
  const { connectionUrl, connectionUrlIsLoading, connectionUrlError } =
    useGetConnectionUrl()
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (connectionUrl?.connection_url) {
      try {
        await navigator.clipboard.writeText(connectionUrl.connection_url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        onCompleted?.()
      } catch (error) {
        console.error('Failed to copy:', error)
      }
    }
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">
            Get Connection URL
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Retrieve the PostgreSQL connection URL for this tenant. This URL is
            scoped to only show the tenant's generated tables.
          </p>
        </div>
      </div>

      {connectionUrlError && (
        <ErrorAlert
          error={connectionUrlError}
          title="Failed to load connection URL"
        />
      )}

      {connectionUrlIsLoading ? (
        <div className="text-center py-10 text-slate-400">
          Loading connection URL...
        </div>
      ) : connectionUrl ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-200">
                Connection URL
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-100 bg-primary-600 hover:bg-primary-700 rounded-md transition-colors disabled:bg-slate-700 disabled:text-slate-400"
              >
                {copied ? (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
            <div className="mt-3 p-3 bg-slate-950/60 rounded border border-slate-800">
              <code className="text-sm text-slate-200 break-all">
                {connectionUrl.connection_url}
              </code>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-4">
              <div className="text-xs text-slate-400 mb-1">Schema Name</div>
              <div className="text-sm font-medium text-slate-100">
                {connectionUrl.schema_name}
              </div>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-4">
              <div className="text-xs text-slate-400 mb-1">
                Includes Public Schema
              </div>
              <div className="text-sm font-medium text-slate-100">
                {connectionUrl.includes_public_schema ? 'Yes' : 'No'}
              </div>
            </div>
          </div>

          {connectionUrl.note && (
            <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-4">
              <div className="text-xs text-slate-400 italic">
                {connectionUrl.note}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-10 text-slate-400">
          No connection URL available.
        </div>
      )}
    </div>
  )
}
