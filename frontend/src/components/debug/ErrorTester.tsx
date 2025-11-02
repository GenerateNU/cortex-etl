import { useState } from 'react'
import { Button } from '../ui/Button'

export function ErrorTester() {
  const [shouldError, setShouldError] = useState(false)
  const [asyncError, setAsyncError] = useState(false)

  // ✅ This WILL be caught by ErrorBoundary (render error)
  if (shouldError) {
    throw new Error(
      'Test render error - This should be caught by ErrorBoundary!'
    )
  }

  // ❌ This will NOT be caught by ErrorBoundary (event handler)
  const handleEventError = () => {
    throw new Error(
      'Event handler error - This will NOT be caught by ErrorBoundary!'
    )
  }

  // ❌ This will NOT be caught by ErrorBoundary (async)
  const handleAsyncError = () => {
    setTimeout(() => {
      throw new Error('Async error - This will NOT be caught by ErrorBoundary!')
    }, 100)
  }

  // ✅ This WILL be caught if you trigger re-render
  const triggerRenderError = () => {
    setShouldError(true)
  }

  return (
    <div className="p-8 space-y-4 bg-slate-800 rounded-xl border border-slate-700">
      <h2 className="text-xl font-bold text-slate-100">
        Error Boundary Tester
      </h2>
      <p className="text-slate-400 text-sm">
        Use these buttons to test different types of errors
      </p>

      <div className="space-y-3">
        {/* ✅ WILL be caught */}
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <h3 className="text-green-400 font-medium mb-2">
            ✅ Caught by ErrorBoundary
          </h3>
          <Button onClick={triggerRenderError} variant="danger" size="sm">
            Trigger Render Error (Caught)
          </Button>
          <p className="text-slate-400 text-xs mt-2">
            This throws during render, ErrorBoundary will catch it
          </p>
        </div>

        {/* ❌ Will NOT be caught */}
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <h3 className="text-red-400 font-medium mb-2">
            ❌ NOT Caught by ErrorBoundary
          </h3>
          <div className="space-y-2">
            <div>
              <Button onClick={handleEventError} variant="danger" size="sm">
                Trigger Event Handler Error (Not Caught)
              </Button>
              <p className="text-slate-400 text-xs mt-1">
                This throws in onClick, will crash in console but not trigger
                ErrorBoundary
              </p>
            </div>
            <div>
              <Button onClick={handleAsyncError} variant="danger" size="sm">
                Trigger Async Error (Not Caught)
              </Button>
              <p className="text-slate-400 text-xs mt-1">
                This throws in setTimeout, won't be caught
              </p>
            </div>
          </div>
        </div>

        {/* Async state error */}
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <h3 className="text-yellow-400 font-medium mb-2">
            ⚠️ Async → Render Error
          </h3>
          <Button
            onClick={() => {
              // Set state that will cause error on next render
              setTimeout(() => setAsyncError(true), 100)
            }}
            variant="danger"
            size="sm"
          >
            Trigger Delayed Render Error (Caught)
          </Button>
          <p className="text-slate-400 text-xs mt-2">
            Sets state in async, error happens on re-render (caught)
          </p>
          {asyncError &&
            (() => {
              throw new Error('Async state error!')
            })()}
        </div>
      </div>

      {/* Real-world scenarios */}
      <div className="pt-4 border-t border-slate-700">
        <h3 className="text-slate-200 font-medium mb-3">
          Real-World Scenarios:
        </h3>
        <div className="space-y-2">
          <BrokenComponent />
          <NullReferenceComponent data={null} />
        </div>
      </div>
    </div>
  )
}

// Simulates a component with a bug
function BrokenComponent() {
  const [showBroken, setShowBroken] = useState(false)

  if (showBroken) {
    // @ts-expect-error - intentionally broken
    return <div>{undefined.property}</div>
  }

  return (
    <Button onClick={() => setShowBroken(true)} variant="danger" size="sm">
      Component with Undefined Access
    </Button>
  )
}

// Simulates null reference error
function NullReferenceComponent({ data }: { data: { name: string } | null }) {
  const [show, setShow] = useState(false)

  if (show && data === null) {
    // @ts-expect-error - intentionally broken
    return <div>{data.name}</div>
  }

  return (
    <Button onClick={() => setShow(true)} variant="danger" size="sm">
      Null Reference Error
    </Button>
  )
}
