import type { FC } from 'react'
import { Button } from '../../ui/Button'
import { ErrorAlert } from '../../ui/ErrorAlert'
import {
  useGetClassifications,
  useClassifications,
} from '../../../hooks/classification.hooks'

interface ClassificationStepProps {
  onCompleted?: () => void
}

export const ClassificationStep: FC<ClassificationStepProps> = ({
  onCompleted,
}) => {
  const { classifications, classificationsIsLoading } = useGetClassifications()
  const {
    createClassifications,
    isCreatingClassifications,
    createClassificationsError,
  } = useClassifications()

  const handleCreate = async () => {
    await createClassifications()
    onCompleted?.()
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">
            Create classifications
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Analyze your extracted documents to generate or update the set of
            classifications for this tenant.
          </p>
        </div>
        <Button
          onClick={handleCreate}
          loading={isCreatingClassifications}
          disabled={classificationsIsLoading}
        >
          Run classification engine
        </Button>
      </div>

      {createClassificationsError && (
        <ErrorAlert
          error={createClassificationsError}
          title="Failed to create classifications"
        />
      )}

      {classificationsIsLoading ? (
        <div className="text-center py-10 text-slate-400">
          Loading classifications...
        </div>
      ) : classifications && classifications.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classifications.map(classification => (
            <div
              key={classification.classification_id}
              className="p-4 bg-slate-700 rounded-lg border border-slate-600"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-primary-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-slate-100 font-medium">
                    {classification.name}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-slate-400">
          No classifications yet. Run the engine to create them from your
          extracted documents.
        </div>
      )}
    </div>
  )
}
