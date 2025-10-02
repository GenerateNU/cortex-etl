import { useState, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { fileService } from '../../services/supabase.service'
import { Button } from '../ui/Button'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Configure PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

const options = {
  cMapUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
  cMapPacked: true,
}

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
  const [scale, setScale] = useState<number>(1.0)
  const [loading, setLoading] = useState<boolean>(true)
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

  // Focus the modal when it opens for keyboard shortcuts
  useEffect(() => {
    const modalElement = document.querySelector(
      '.pdf-modal-container'
    ) as HTMLElement
    if (modalElement) {
      modalElement.focus()
    }
  }, [])

  // Handle wheel events with non-passive listener
  useEffect(() => {
    const handleWheel = (e: Event) => {
      const wheelEvent = e as WheelEvent
      if (wheelEvent.ctrlKey || wheelEvent.metaKey) {
        wheelEvent.preventDefault()
        wheelEvent.stopPropagation()
        if (wheelEvent.deltaY > 0) {
          zoomOut()
        } else {
          zoomIn()
        }
      }
    }

    const pdfContainer = document.querySelector('.pdf-viewer-container')
    if (pdfContainer) {
      pdfContainer.addEventListener('wheel', handleWheel, { passive: false })
      return () => pdfContainer.removeEventListener('wheel', handleWheel)
    }
  }, [scale])

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setLoading(false)
  }

  const onDocumentLoadError = (error: Error) => {
    setError('Failed to load PDF document')
    setLoading(false)
    console.error(error)
  }

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1))
  }

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages))
  }

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3.0))
  }

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5))
  }

  const resetZoom = () => {
    setScale(1.0)
  }

  const fitToWidth = () => {
    setScale(1.2) // Adjust based on your container width
  }

  const downloadPDF = async () => {
    if (pdfUrl) {
      try {
        const response = await fetch(pdfUrl)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } catch (error) {
        console.error('Download failed:', error)
        // Fallback to opening in new tab
        window.open(pdfUrl, '_blank')
      }
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          goToPrevPage()
          break
        case 'ArrowRight':
          e.preventDefault()
          goToNextPage()
          break
        case '+':
        case '=':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            e.stopPropagation()
            zoomIn()
          }
          break
        case '-':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            e.stopPropagation()
            zoomOut()
          }
          break
        case '0':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            e.stopPropagation()
            resetZoom()
          }
          break
        case 'Escape':
          onClose()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown, { capture: true })
    return () =>
      window.removeEventListener('keydown', handleKeyDown, { capture: true })
  }, [pageNumber, numPages, scale])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/80 modal-backdrop"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-[90vw] h-[90vh] flex flex-col pdf-modal-container"
        tabIndex={-1}
      >
        {/* Header with zoom controls */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-slate-100 truncate">
            {fileName}
          </h2>

          <div className="flex items-center space-x-2">
            {/* Zoom Controls */}
            <div className="flex items-center space-x-1 border border-slate-600 rounded-md">
              <Button
                onClick={zoomOut}
                variant="primary"
                size="sm"
                disabled={scale <= 0.5}
                className="px-2 text-slate-300 hover:text-slate-100"
              >
                -
              </Button>
              <span className="px-2 text-sm bg-slate-700 border-x border-slate-600 text-slate-300">
                {Math.round(scale * 100)}%
              </span>
              <Button
                onClick={zoomIn}
                variant="primary"
                size="sm"
                disabled={scale >= 3.0}
                className="px-2 text-slate-300 hover:text-slate-100"
              >
                +
              </Button>
            </div>

            {/* Reset and Download */}
            <Button
              onClick={resetZoom}
              variant="primary"
              size="sm"
              className="text-slate-300 hover:text-slate-100"
            >
              Reset
            </Button>
            <Button
              onClick={fitToWidth}
              variant="primary"
              size="sm"
              className="text-slate-300 hover:text-slate-100"
            >
              Fit Width
            </Button>
            <Button
              onClick={downloadPDF}
              variant="primary"
              size="sm"
              className="text-slate-300 hover:text-slate-100"
            >
              ⬇ Download
            </Button>

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
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-auto bg-slate-900 flex items-center justify-center p-4 pdf-viewer-container">
          {loading && !error && (
            <div className="text-slate-400">Loading PDF...</div>
          )}

          {error && <div className="text-red-400">{error}</div>}

          {pdfUrl && !error && (
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              options={options}
              loading={
                <div className="text-slate-400">Loading document...</div>
              }
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
