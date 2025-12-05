import { useState, type FC } from 'react'
import { Button } from '../../ui/Button'
import { ErrorAlert } from '../../ui/ErrorAlert'
import {
  useGetConnectionUrl,
  useLoadData,
} from '../../../hooks/migrations.hooks'

export const LoadDataStep: FC = () => {
  const { loadData, isLoadingData, loadDataError, loadDataResponse } =
    useLoadData()
  const { connectionUrl, connectionUrlIsLoading, connectionUrlError } =
    useGetConnectionUrl()
  const [copied, setCopied] = useState(false)

  const hasConnectionUrl = !!connectionUrl?.connection_url

  const handleLoadData = async () => {
    await loadData()
  }

  const handleCopy = async () => {
    if (!connectionUrl?.connection_url) return
    try {
      await navigator.clipboard.writeText(connectionUrl.connection_url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">
            Load Data & Get Connection URL
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Sync extracted file data into generated tables, then grab the
            tenant-scoped PostgreSQL URL to query those tables.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Button onClick={handleLoadData} loading={isLoadingData}>
            Load Data
          </Button>
          <Button
            onClick={handleCopy}
            disabled={!hasConnectionUrl || copied}
            variant="secondary"
          >
            {copied ? 'Copied!' : 'Copy Connection URL'}
          </Button>
        </div>
      </div>

      {loadDataError && (
        <ErrorAlert error={loadDataError} title="Failed to load data" />
      )}
      {connectionUrlError && (
        <ErrorAlert
          error={connectionUrlError}
          title="Failed to load connection URL"
        />
      )}

      <div className="space-y-4">
        <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-4">
          {isLoadingData ? (
            <div className="text-center py-6 text-slate-400">
              Loading data into tables...
            </div>
          ) : loadDataResponse ? (
            <div className="space-y-2">
              <div className="text-sm font-medium text-slate-100">
                {loadDataResponse.message}
              </div>
              {loadDataResponse.tables_updated &&
                loadDataResponse.tables_updated.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs text-slate-400 mb-2">
                      Tables Updated:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {loadDataResponse.tables_updated.map((table, index) => (
                        <span
                          key={index}
                          className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-200"
                        >
                          {table}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400">
              Click "Load Data" to sync extracted files into generated tables.
            </div>
          )}
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-200">
                Connection URL
              </div>
              <div className="text-xs text-slate-400">
                Scoped to this tenant's generated tables.
              </div>
            </div>
            <Button
              onClick={handleCopy}
              disabled={!hasConnectionUrl || copied}
              variant="secondary"
              size="sm"
            >
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>

          {connectionUrlIsLoading ? (
            <div className="text-center py-4 text-slate-400">
              Loading connection URL...
            </div>
          ) : hasConnectionUrl ? (
            <div className="space-y-3">
              <div className="mt-1 p-3 bg-slate-950/60 rounded border border-slate-800">
                <code className="text-sm text-slate-200 break-all">
                  {connectionUrl.connection_url}
                </code>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-3">
                  <div className="text-xs text-slate-400 mb-1">Schema Name</div>
                  <div className="text-sm font-medium text-slate-100">
                    {connectionUrl.schema_name}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-3">
                  <div className="text-xs text-slate-400 mb-1">
                    Includes Public Schema
                  </div>
                  <div className="text-sm font-medium text-slate-100">
                    {connectionUrl.includes_public_schema ? 'Yes' : 'No'}
                  </div>
                </div>
              </div>

              {connectionUrl.note && (
                <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-3">
                  <div className="text-xs text-slate-400 italic">
                    {connectionUrl.note}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-slate-400">
              Run "Load Data" to generate the connection URL for this tenant.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
