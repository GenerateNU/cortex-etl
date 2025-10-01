import React from 'react'
import { LoadingSpinner } from '../common/LoadingSpinner'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors'

  const variantClasses = {
    primary:
      'bg-primary-500 hover:bg-primary-600 focus:ring-primary-500 text-white',
    secondary:
      'bg-slate-700 hover:bg-slate-600 focus:ring-slate-500 text-slate-100',
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white',
  }

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${loading || disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      disabled={loading || disabled}
      {...props}
    >
      {loading && <LoadingSpinner size="sm" className="mr-2 text-current" />}
      {children}
    </button>
  )
}
