import { useState, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { fileService } from '../../services/supabase.service'
import { Button } from '../ui/Button'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface ViewPDFModalProps {
  filePath: string
  fileName: string
  onClose: () => void
}

export function ViewPDFModal({
  filePath,
  fileName,
  onClose,
}: ViewPDFModalProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPDF() {
      try {
        const url = await fileService.getSignedUrl(filePath)
        setPdfUrl(url)
      } catch (err) {
        setError('Failed to load PDF')
        console.error(err)
      }
    }
    fetchPDF()
  }, [filePath])

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
    setIsLoading(false)
  }

  function onDocumentLoadError(error: Error) {
    setError('Failed to load PDF document')
    setIsLoading(false)
    console.error(error)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/80 modal-backdrop"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-[90vw] h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-slate-100 truncate">
            {fileName}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <svg
              className="w-6 h-6"
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

        {/* PDF Viewer */}
        <div className="flex-1 overflow-auto bg-slate-900 flex items-center justify-center p-4">
          {isLoading && !error && (
            <div className="text-slate-400">Loading PDF...</div>
          )}

          {error && <div className="text-red-400">{error}</div>}

          {pdfUrl && !error && (
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="text-slate-400">Loading document...</div>
              }
            >
              <Page
                pageNumber={pageNumber}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="shadow-lg"
              />
            </Document>
          )}
        </div>

        {/* Controls */}
        {numPages > 0 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-700">
            <Button
              onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
              disabled={pageNumber <= 1}
              variant="secondary"
              size="sm"
            >
              Previous
            </Button>

            <span className="text-slate-300">
              Page {pageNumber} of {numPages}
            </span>

            <Button
              onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
              disabled={pageNumber >= numPages}
              variant="secondary"
              size="sm"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
