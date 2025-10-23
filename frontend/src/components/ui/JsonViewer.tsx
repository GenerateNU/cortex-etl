interface JsonViewerProps {
  data: Record<string, unknown>
}

export function JsonViewer({ data }: JsonViewerProps) {
  const jsonString = JSON.stringify(data, null, 2)

  // Replace escaped newlines with actual newlines for better readability
  const formattedString = jsonString.replace(/\\n/g, '\n')

  return (
    <pre className="bg-slate-900 border border-slate-700 rounded-lg p-4 overflow-auto text-xs text-slate-300 h-full whitespace-pre-wrap">
      {formattedString}
    </pre>
  )
}
