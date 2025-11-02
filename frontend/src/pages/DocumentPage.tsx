import { useState, useEffect, useCallback } from 'react'
import { Layout } from '../components/layout/Layout'
import { useAuth } from '../contexts/AuthContext'
import { useGetAllFiles, useFilesMutations } from '../hooks/files.hooks'
import { useGetAllExtractedFiles } from '../hooks/extractedFile.hooks'
import { useFileParam } from '../hooks/useUrlState'
import { Modal } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import { StatusBadge } from '../components/ui/StatusBadge'
import { ViewPDFModal } from '../components/ui/ViewPDFModal'
import { AdminDocumentViewer } from '../components/documents/AdminDocumentViewer'
import type { FileUpload } from '../types/file.types'
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription'
import { QUERY_KEYS } from '../utils/constants'
import { useQueryClient } from '@tanstack/react-query'
import { useRetryExtract } from '../hooks/preprocess.hooks'

export function DocumentPage() {
  const { user } = useAuth()
  const { files, filesIsLoading } = useGetAllFiles()
  const { extractedFiles } = useGetAllExtractedFiles()
  const { uploadFile, deleteFile, isUploadingFile, isDeletingFile } =
    useFilesMutations()
  const { retryExtract, isRetryingExtract } = useRetryExtract()
  const queryClient = useQueryClient()
  const [fileParam, setFileParam] = useFileParam()
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [viewingFile, setViewingFile] = useState<FileUpload | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadStatuses, setUploadStatuses] = useState<
    Map<string, { status: 'uploading' | 'success' | 'error'; error?: string }>
  >(new Map())

  const isTenant = user?.role === 'tenant'
  const isAdmin = user?.role === 'admin'

  const handleExtractedFilesChange = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.extractedFiles.all(),
    })
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.files.all(),
    })
  }, [queryClient])

  useRealtimeSubscription({
    table: 'extracted_files',
    event: '*',
    onEvent: handleExtractedFilesChange,
  })

  // Restore file from URL
  useEffect(() => {
    if (fileParam && files && !viewingFile) {
      const file = files.find(f => f.id === fileParam)
      if (file) setViewingFile(file)
    }
  }, [fileParam, files, viewingFile])

  const getFileStatus = (
    fileId: string
  ): 'queued' | 'processing' | 'completed' | 'failed' | 'error' => {
    const extracted = extractedFiles?.find(ef => ef.source_file_id === fileId)
    return extracted ? extracted.status : 'error'
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files))
    }
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return

    // Initialize all as uploading
    const initialStatuses = new Map(
      selectedFiles.map(file => [file.name, { status: 'uploading' as const }])
    )
    setUploadStatuses(initialStatuses)

    // Upload sequentially
    for (const file of selectedFiles) {
      try {
        await uploadFile(file)
        setUploadStatuses(prev => {
          const next = new Map(prev)
          next.set(file.name, { status: 'success' })
          return next
        })
      } catch (error) {
        setUploadStatuses(prev => {
          const next = new Map(prev)
          next.set(file.name, {
            status: 'error',
            error: error instanceof Error ? error.message : 'Upload failed',
          })
          return next
        })
      }
    }

    // Don't auto-close, let user review results
  }

  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false)
    setSelectedFiles([])
    setUploadStatuses(new Map())
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleDelete = async (fileId: string) => {
    if (confirm('Are you sure you want to delete this file?')) {
      await deleteFile(fileId)
    }
  }

  const handleRetryExtract = async (file: FileUpload) => {
    try {
      await retryExtract(file.id)
    } catch (error) {
      console.error('Retry extraction failed:', error)
    }
  }

  const handleView = (file: FileUpload) => {
    setViewingFile(file)
    setFileParam(file.id)
  }

  const handleCloseModal = () => {
    setViewingFile(null)
    setFileParam(null)
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-slate-100">Documents</h1>
          {isTenant && (
            <Button onClick={() => setIsUploadModalOpen(true)}>
              Upload Files
            </Button>
          )}
        </div>
        {/* Files List */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          {filesIsLoading ? (
            <div className="text-center py-12 text-slate-400">Loading...</div>
          ) : files && files.length > 0 ? (
            <div className="space-y-3">
              {files.map(file => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 bg-slate-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <svg
                      className="w-8 h-8 text-slate-400"
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
                      <p className="text-slate-100 font-medium">{file.name}</p>
                      <p className="text-sm text-slate-400">
                        {file.created_at
                          ? new Date(file.created_at).toLocaleDateString()
                          : 'No Created At'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isAdmin && <StatusBadge status={getFileStatus(file.id)} />}
                    {isAdmin && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleRetryExtract(file)}
                        loading={isRetryingExtract}
                      >
                        Retry
                      </Button>
                    )}
                    {}
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleView(file)}
                    >
                      View
                    </Button>
                    {isTenant && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(file.id)}
                        loading={isDeletingFile}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-16 w-16 text-slate-600 mb-4"
                stroke="currentColor"
                fill="none"
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
                No documents yet
              </h3>
              <p className="text-slate-400">
                {isTenant
                  ? 'Upload files to get started with data processing'
                  : 'No files uploaded for this tenant'}
              </p>
            </div>
          )}
        </div>
        {/* Upload Modal */}
        {isTenant && (
          <Modal
            isOpen={isUploadModalOpen}
            onClose={handleCloseUploadModal}
            title="Upload Files"
          >
            <div className="space-y-4">
              {uploadStatuses.size === 0 ? (
                <>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="block w-full text-sm text-slate-300
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-medium
              file:bg-primary-500 file:text-white
              hover:file:bg-primary-600
              file:cursor-pointer cursor-pointer"
                  />

                  {selectedFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-slate-400">
                        {selectedFiles.length} file(s) selected:
                      </p>
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {selectedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-slate-700 rounded text-sm"
                          >
                            <span className="text-slate-300 truncate">
                              {file.name}
                            </span>
                            <button
                              onClick={() => removeFile(index)}
                              className="text-slate-400 hover:text-slate-200 ml-2"
                            >
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
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3">
                    <Button
                      variant="secondary"
                      onClick={handleCloseUploadModal}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpload}
                      disabled={selectedFiles.length === 0}
                      loading={isUploadingFile}
                    >
                      Upload{' '}
                      {selectedFiles.length > 0 && `(${selectedFiles.length})`}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <p className="text-sm text-slate-400">Upload Progress:</p>
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {selectedFiles.map(file => {
                        const fileStatus = uploadStatuses.get(file.name)
                        return (
                          <div
                            key={file.name}
                            className="p-3 bg-slate-700 rounded space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-slate-300 text-sm truncate flex-1">
                                {file.name}
                              </span>
                              {fileStatus && (
                                <StatusBadge
                                  status={fileStatus.status}
                                  label={
                                    fileStatus.status === 'uploading'
                                      ? 'Uploading'
                                      : fileStatus.status === 'success'
                                        ? 'Success'
                                        : 'Failed'
                                  }
                                />
                              )}
                            </div>
                            {fileStatus?.error && (
                              <p className="text-xs text-red-400">
                                {fileStatus.error}
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleCloseUploadModal}>Close</Button>
                  </div>
                </>
              )}
            </div>
          </Modal>
        )}{' '}
      </div>

      {/* Conditional Modal Rendering */}
      {viewingFile && isTenant && (
        <ViewPDFModal file={viewingFile} onClose={handleCloseModal} />
      )}

      {viewingFile && isAdmin && (
        <AdminDocumentViewer file={viewingFile} onClose={handleCloseModal} />
      )}
    </Layout>
  )
}
