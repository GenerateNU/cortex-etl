interface JsonViewerProps {
  data: Record<string, unknown>
}

export function JsonViewer({ data }: JsonViewerProps) {
  return (
    <pre className="bg-slate-900 border border-slate-700 rounded-lg p-4 overflow-auto text-xs text-slate-300 h-full">
      {JSON.stringify(data, null, 2)}
    </pre>
  )
}
