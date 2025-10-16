import { useState, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { LoadingSpinner } from '../common/LoadingSpinner'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

const options = {
  cMapUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
  cMapPacked: true,
}

interface PDFDisplayProps {
  pdfUrl: string | undefined
  onLoadSuccess?: (numPages: number) => void
  onLoadError?: (error: Error) => void
}

export function PDFDisplay({
  pdfUrl,
  onLoadSuccess,
  onLoadError,
}: PDFDisplayProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [scale, setScale] = useState<number>(1.0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleWheel = (e: Event) => {
      const wheelEvent = e as WheelEvent
      if (wheelEvent.ctrlKey || wheelEvent.metaKey) {
        wheelEvent.preventDefault()
        wheelEvent.stopPropagation()
        setScale(prev =>
          wheelEvent.deltaY > 0
            ? Math.max(prev - 0.25, 0.5)
            : Math.min(prev + 0.25, 3.0)
        )
      }
    }

    const container = document.querySelector('.pdf-viewer-container')
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false })
      return () => container.removeEventListener('wheel', handleWheel)
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setPageNumber(prev => Math.max(prev - 1, 1))
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        setPageNumber(prev => Math.min(prev + 1, numPages))
      } else if ((e.key === '+' || e.key === '=') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        setScale(prev => Math.min(prev + 0.25, 3.0))
      } else if (e.key === '-' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        setScale(prev => Math.max(prev - 0.25, 0.5))
      } else if (e.key === '0' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        setScale(1.0)
      }
    }

    window.addEventListener('keydown', handleKeyDown, { capture: true })
    return () =>
      window.removeEventListener('keydown', handleKeyDown, { capture: true })
  }, [pageNumber, numPages])

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    onLoadSuccess?.(numPages)
  }

  const handleDocumentLoadError = (error: Error) => {
    setError('Failed to load PDF')
    onLoadError?.(error)
  }

  if (!pdfUrl) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" className="text-slate-400" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Zoom Controls */}
      <div className="flex items-center justify-between p-3 border-b border-slate-700">
        <div className="flex items-center space-x-1 border border-slate-600 rounded-md">
          <button
            onClick={() => setScale(prev => Math.max(prev - 0.25, 0.5))}
            disabled={scale <= 0.5}
            className="px-3 py-1 text-slate-300 hover:text-slate-100 disabled:opacity-50"
          >
            -
          </button>
          <span className="px-2 text-sm bg-slate-700 border-x border-slate-600 text-slate-300">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale(prev => Math.min(prev + 0.25, 3.0))}
            disabled={scale >= 3.0}
            className="px-3 py-1 text-slate-300 hover:text-slate-100 disabled:opacity-50"
          >
            +
          </button>
        </div>

        <button
          onClick={() => setScale(1.0)}
          className="px-3 py-1 text-sm text-slate-300 hover:text-slate-100"
        >
          Reset Zoom
        </button>
      </div>

      {/* PDF Display */}
      <div className="flex-1 overflow-auto bg-slate-900 flex items-center justify-center p-4 pdf-viewer-container">
        {error ? (
          <div className="text-red-400">{error}</div>
        ) : (
          <Document
            file={pdfUrl}
            onLoadSuccess={handleDocumentLoadSuccess}
            onLoadError={handleDocumentLoadError}
            options={options}
            loading={<LoadingSpinner size="lg" className="text-slate-400" />}
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="shadow-lg"
            />
          </Document>
        )}
      </div>

      {/* Page Navigation */}
      {numPages > 0 && (
        <div className="flex items-center justify-between p-3 border-t border-slate-700">
          <button
            onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
            disabled={pageNumber <= 1}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg disabled:opacity-50"
          >
            Previous
          </button>

          <div className="flex items-center space-x-2">
            <span className="text-slate-300">Page</span>
            <input
              type="number"
              min={1}
              max={numPages}
              value={pageNumber}
              onChange={e => {
                const page = parseInt(e.target.value)
                if (page >= 1 && page <= numPages) {
                  setPageNumber(page)
                }
              }}
              className="w-16 px-2 py-1 text-center border border-slate-600 rounded text-sm bg-slate-700 text-slate-200"
            />
            <span className="text-slate-300">of {numPages}</span>
          </div>

          <button
            onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
            disabled={pageNumber >= numPages}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
