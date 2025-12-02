import type { FC } from 'react'
import { Button } from '../../ui/Button'
import { ErrorAlert } from '../../ui/ErrorAlert'
import {
  useExecuteMigrations,
  useGenerateMigrations,
  useListMigrations,
} from '../../../hooks/migrations.hooks'

interface MigrationsStepProps {
  onCompleted?: () => void
}

export const MigrationsStep: FC<MigrationsStepProps> = ({ onCompleted }) => {
  const { migrations, migrationsIsLoading, migrationsError } =
    useListMigrations()
  const {
    generateMigrations,
    isGeneratingMigrations,
    generateMigrationsError,
  } = useGenerateMigrations()
  const { executeMigrations, isExecutingMigrations, executeMigrationsError } =
    useExecuteMigrations()

  const handleGenerate = async () => {
    await generateMigrations()
    onCompleted?.()
  }

  const handleExecute = async () => {
    await executeMigrations()
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">
            Generate and execute migrations
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Use inferred relationships and classifications to generate SQL
            migrations, then execute them against your tenant database.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Button
            onClick={handleGenerate}
            loading={isGeneratingMigrations}
            variant="secondary"
          >
            Generate migrations
          </Button>
          <Button
            onClick={handleExecute}
            loading={isExecutingMigrations}
            disabled={!migrations?.length}
          >
            Execute migrations
          </Button>
        </div>
      </div>

      {migrationsError && (
        <ErrorAlert error={migrationsError} title="Failed to load migrations" />
      )}
      {generateMigrationsError && (
        <ErrorAlert
          error={generateMigrationsError}
          title="Failed to generate migrations"
        />
      )}
      {executeMigrationsError && (
        <ErrorAlert
          error={executeMigrationsError}
          title="Failed to execute migrations"
        />
      )}

      {migrationsIsLoading ? (
        <div className="text-center py-10 text-slate-400">
          Loading migrations...
        </div>
      ) : !migrations || migrations.length === 0 ? (
        <div className="text-center py-10 text-slate-400">
          No migrations generated yet. Generate migrations to see them here.
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {migrations.map(m => (
            <div
              key={m.migration_id}
              className="rounded-lg border border-slate-700 bg-slate-900/40 p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-200">
                    #{m.sequence}
                  </span>
                  <span className="text-sm font-medium text-slate-100">
                    {m.name}
                  </span>
                </div>
              </div>
              <pre className="mt-2 max-h-40 overflow-auto rounded bg-slate-950/60 p-2 text-xs text-slate-200">
                {m.sql}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
