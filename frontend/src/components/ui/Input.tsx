import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  const inputClasses = `block w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors ${
    error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
  } ${className}`

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-2">
          {label}
        </label>
      )}
      <input className={inputClasses} {...props} />
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  )
}
