import type { FC } from 'react'
import { Button } from '../../ui/Button'
import { ErrorAlert } from '../../ui/ErrorAlert'
import {
  useGetClassifications,
  useClassifications,
} from '../../../hooks/classification.hooks'
import { useGetAllFiles } from '../../../hooks/files.hooks'
import type { FileUpload } from '../../../types/file.types'

interface AssignClassificationsStepProps {
  onCompleted?: () => void
}

export const AssignClassificationsStep: FC<AssignClassificationsStepProps> = ({
  onCompleted,
}) => {
  const { classifications, classificationsIsLoading } = useGetClassifications()
  const { files, filesIsLoading } = useGetAllFiles()
  const { classifyFiles, isClassifyingFiles, classifyingFilesError } =
    useClassifications()

  const filesByClassification: Record<string, FileUpload[]> = (
    files ?? []
  ).reduce(
    (acc, file) => {
      const key = file.classification || 'Unclassified'
      if (!acc[key]) acc[key] = []
      acc[key].push(file)
      return acc
    },
    {} as Record<string, FileUpload[]>
  )

  const hasAnyClassifications = (classifications?.length ?? 0) > 0
  const totalFiles = files?.length ?? 0
  const classifiedFiles =
    files?.filter(f => f.classification && f.classification !== 'Unclassified')
      .length ?? 0

  const handleClassify = async () => {
    await classifyFiles()
    onCompleted?.()
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">
            Assign classifications to files
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Use the current classifications to automatically assign each file to
            a category.
          </p>
          <div className="mt-3 text-xs text-slate-400 space-y-1">
            <p>Total files: {totalFiles}</p>
            <p>Classified files: {classifiedFiles}</p>
          </div>
        </div>
        <Button
          onClick={handleClassify}
          loading={isClassifyingFiles}
          disabled={
            filesIsLoading ||
            classificationsIsLoading ||
            !totalFiles ||
            !hasAnyClassifications
          }
        >
          Run assignment engine
        </Button>
      </div>

      {classifyingFilesError && (
        <ErrorAlert
          error={classifyingFilesError}
          title="Failed to classify files"
        />
      )}

      {filesIsLoading || classificationsIsLoading ? (
        <div className="text-center py-10 text-slate-400">
          Loading files and classifications...
        </div>
      ) : totalFiles === 0 ? (
        <div className="text-center py-10 text-slate-400">
          No files uploaded yet. Upload documents first from the Documents page.
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(filesByClassification).map(
            ([classificationName, classificationFiles]) => (
              <div
                key={classificationName}
                className="border border-slate-700 rounded-lg"
              >
                <div className="flex items-center justify-between p-3 bg-slate-700/60 rounded-t-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-100">
                      {classificationName}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 text-xs font-medium bg-slate-600 text-slate-200 rounded-full">
                    {classificationFiles.length}
                  </span>
                </div>
                {classificationFiles.length > 0 && (
                  <div className="divide-y divide-slate-700">
                    {classificationFiles.map(file => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between px-3 py-2 bg-slate-800/60"
                      >
                        <div className="flex items-center gap-3">
                          <svg
                            className="w-5 h-5 text-slate-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                            />
                          </svg>
                          <div>
                            <p className="text-sm text-slate-100">
                              {file.name}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}
