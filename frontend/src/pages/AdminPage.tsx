import { useCallback, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Layout } from '../components/layout/Layout'
import { Button } from '../components/ui/Button'
import { ErrorAlert } from '../components/ui/ErrorAlert'
import {
  useGetClassifications,
  useClassifications,
} from '../hooks/classification.hooks'
import { useGetAllFiles } from '../hooks/files.hooks'
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription'
import { QUERY_KEYS } from '../utils/constants'
import type { FileUpload } from '../types/file.types'

export function AdminPage() {
  const queryClient = useQueryClient()
  const { classifications, classificationsIsLoading } = useGetClassifications()
  const { files, filesIsLoading } = useGetAllFiles()
  const {
    createClassifications,
    isCreatingClassifications,
    createClassificationsError,
    classifyFiles,
    isClassifyingFiles,
    classifyingFilesError,
  } = useClassifications()

  const [expandedClassifications, setExpandedClassifications] = useState<
    Set<string>
  >(new Set())

  const handleClassificationChange = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.classifications.all(),
    })
  }, [queryClient])

  const handleFileChange = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.files.all(),
    })
  }, [queryClient])

  useRealtimeSubscription({
    table: 'classifications',
    event: '*',
    onEvent: handleClassificationChange,
  })

  useRealtimeSubscription({
    table: 'file_uploads',
    event: '*',
    onEvent: handleFileChange,
  })

  // Group files by classification
  const filesByClassification = useMemo(() => {
    if (!files) return {}

    return files.reduce(
      (acc, file) => {
        const key = file.classification || 'Unclassified'
        if (!acc[key]) acc[key] = []
        acc[key].push(file)
        return acc
      },
      {} as Record<string, FileUpload[]>
    )
  }, [files])

  // Get all classification names (including those with 0 files)
  const allClassificationNames = useMemo(() => {
    const names = new Set<string>(['Unclassified'])
    classifications?.forEach(c => names.add(c.name))
    return Array.from(names).sort((a, b) => {
      if (a === 'Unclassified') return 1
      if (b === 'Unclassified') return -1
      return a.localeCompare(b)
    })
  }, [classifications])

  const toggleClassification = (name: string) => {
    setExpandedClassifications(prev => {
      const next = new Set(prev)
      if (next.has(name)) {
        next.delete(name)
      } else {
        next.add(name)
      }
      return next
    })
  }

  const handleCreateClassifications = async () => {
    try {
      await createClassifications()
    } catch (error) {
      console.error('Failed to create classifications:', error)
    }
  }

  const handleClassifyFiles = async () => {
    try {
      await classifyFiles()
    } catch (error) {
      console.error('Failed to classify files:', error)
    }
  }

  return (
    <Layout>
      <div className="flex h-full min-h-0 flex-col">
        <header className="flex-shrink-0">
          <h1 className="text-2xl font-semibold text-slate-100">Admin Panel</h1>
        </header>

        <div className="mt-4 flex-1 min-h-0 space-y-6 overflow-y-auto pr-1">
          {/* Classifications Section */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-100">
                  Classifications
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Manage document classifications for automatic categorization
                </p>
              </div>
              <Button
                onClick={handleCreateClassifications}
                loading={isCreatingClassifications}
                disabled={classificationsIsLoading}
              >
                Create Classifications
              </Button>
            </div>

            {createClassificationsError && (
              <div className="mb-4">
                <ErrorAlert
                  error={createClassificationsError}
                  title="Failed to create classifications"
                />
              </div>
            )}

            {classificationsIsLoading ? (
              <div className="text-center py-12 text-slate-400">
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
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-16 w-16 text-slate-600 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
                <h3 className="text-lg font-medium text-slate-300 mb-2">
                  No Classifications Yet
                </h3>
                <p className="text-slate-400 mb-4">
                  Create classifications to automatically categorize documents
                </p>
              </div>
            )}
          </div>

          {/* Files by Classification Section */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-100">
                  Files by Classification
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  View all files organized by their assigned classification
                </p>
              </div>
              <Button
                onClick={handleClassifyFiles}
                loading={isClassifyingFiles}
                disabled={filesIsLoading || !files?.length}
              >
                Classify Files
              </Button>
            </div>

            {classifyingFilesError && (
              <div className="mb-4">
                <ErrorAlert
                  error={classifyingFilesError}
                  title="Failed to classify files"
                />
              </div>
            )}

            {filesIsLoading || classificationsIsLoading ? (
              <div className="text-center py-12 text-slate-400">
                Loading files...
              </div>
            ) : allClassificationNames.length > 0 ? (
              <div className="space-y-2">
                {allClassificationNames.map(classificationName => {
                  const classificationFiles =
                    filesByClassification[classificationName] || []
                  const isExpanded =
                    expandedClassifications.has(classificationName)

                  return (
                    <div
                      key={classificationName}
                      className="border border-slate-700 rounded-lg"
                    >
                      {/* Accordion Header */}
                      <button
                        onClick={() => toggleClassification(classificationName)}
                        className="w-full flex items-center justify-between p-4 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <svg
                            className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                          <h3 className="text-lg font-medium text-slate-200">
                            {classificationName}
                          </h3>
                        </div>
                        <span className="px-2 py-1 text-xs font-medium bg-slate-600 text-slate-300 rounded-full">
                          {classificationFiles.length}
                        </span>
                      </button>

                      {/* Accordion Content */}
                      {isExpanded && (
                        <div className="p-4 pt-2 space-y-2">
                          {classificationFiles.length > 0 ? (
                            classificationFiles.map(file => (
                              <div
                                key={file.id}
                                className="flex items-center justify-between p-4 bg-slate-800 rounded-lg"
                              >
                                <div className="flex items-center space-x-3">
                                  <svg
                                    className="w-6 h-6 text-slate-400"
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
                                    <p className="text-slate-100 font-medium">
                                      {file.name}
                                    </p>
                                    <p className="text-sm text-slate-400">
                                      {new Date(
                                        file.created_at || ''
                                      ).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-center text-slate-400 py-4">
                              No files in this classification
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-16 w-16 text-slate-600 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <h3 className="text-lg font-medium text-slate-300 mb-2">
                  No Classifications Yet
                </h3>
                <p className="text-slate-400">
                  Create classifications to organize files
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
