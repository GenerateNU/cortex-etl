import type { FC } from 'react'
import { Button } from '../../ui/Button'
import { ErrorAlert } from '../../ui/ErrorAlert'
import { useLoadData } from '../../../hooks/migrations.hooks'

interface LoadDataStepProps {
  onCompleted?: () => void
}

export const LoadDataStep: FC<LoadDataStepProps> = ({ onCompleted }) => {
  const {
    loadData,
    isLoadingData,
    loadDataError,
    loadDataResponse,
  } = useLoadData()

  const handleLoadData = async () => {
    await loadData()
    onCompleted?.()
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Load Data</h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Sync extracted file data into generated database tables. This will
            delete existing rows and insert new rows for each file in its
            classification table.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Button onClick={handleLoadData} loading={isLoadingData}>
            Load Data
          </Button>
        </div>
      </div>

      {loadDataError && (
        <ErrorAlert
          error={loadDataError}
          title="Failed to load data"
        />
      )}

      {isLoadingData ? (
        <div className="text-center py-10 text-slate-400">
          Loading data into tables...
        </div>
      ) : loadDataResponse ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-4">
            <div className="text-sm font-medium text-slate-100 mb-2">
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
        </div>
      ) : (
        <div className="text-center py-10 text-slate-400">
          Click "Load Data" to sync extracted files into generated tables.
        </div>
      )}
    </div>
  )
}

