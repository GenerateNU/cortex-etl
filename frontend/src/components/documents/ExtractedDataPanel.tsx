import { useGetExtractedFile } from '../../hooks/extracted-file.hooks'
import { JsonViewer } from '../ui/JsonViewer'
import { StatusBadge } from '../ui/StatusBadge'

interface ExtractedDataPanelProps {
  sourceFileId: string
}

export function ExtractedDataPanel({ sourceFileId }: ExtractedDataPanelProps) {
  const { extractedFile, extractedFileIsLoading } =
    useGetExtractedFile(sourceFileId)

  if (extractedFileIsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-400">Loading extraction data...</div>
      </div>
    )
  }

  if (!extractedFile) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-slate-600 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-lg font-medium text-slate-300 mb-2">
            Issue Finding Extracted File
          </h3>
        </div>
      </div>
    )
  }

  if (extractedFile?.status === 'queued') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-slate-600 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-lg font-medium text-slate-300 mb-2">
            Processing Queued
          </h3>
        </div>
      </div>
    )
  }

  if (extractedFile?.status === 'processing') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-slate-600 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-lg font-medium text-slate-300 mb-2">
            Processing...
          </h3>
          <p className="text-slate-400 text-sm">
            This file is currently being processed
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Compact Header */}
      <div className="p-3 border-b border-slate-700 flex items-center justify-between flex-shrink-0">
        <StatusBadge status={extractedFile.status} />
        <span className="text-xs text-slate-400">
          {new Date(extractedFile.updated_at).toLocaleString()}
        </span>
      </div>

      {/* JSON Viewer - Full height */}
      <div className="flex-1 p-4 min-h-0">
        <JsonViewer data={extractedFile.extracted_data} />
      </div>
    </div>
  )
}
