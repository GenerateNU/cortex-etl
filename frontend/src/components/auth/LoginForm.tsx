import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import type { LoginForm as LoginFormType } from '../../types/auth.types'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { validateEmail, validatePassword } from '../../utils/validators'

export function LoginForm() {
  const { login } = useAuth()
  const [formData, setFormData] = useState<LoginFormType>({
    email: '',
    password: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string
    password?: string
  }>({})

  const validateForm = () => {
    const errors = {
      email: validateEmail(formData.email) || undefined,
      password: validatePassword(formData.password) || undefined,
    }

    setFieldErrors(errors)
    return !errors.email && !errors.password
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    setError(null)

    try {
      await login(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-6">
      <div className="w-full max-w-md">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-5">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-semibold text-slate-100">
              Sign in to Cortex ETL
            </h2>
            <p className="text-slate-400">Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {error && (
              <div className="bg-red-900/50 border border-red-600 text-red-300 px-4 py-4 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-6">
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={e =>
                  setFormData(prev => ({ ...prev, email: e.target.value }))
                }
                error={fieldErrors.email}
                placeholder="example@email.com"
              />

              <Input
                label="Password"
                type="password"
                value={formData.password}
                onChange={e =>
                  setFormData(prev => ({ ...prev, password: e.target.value }))
                }
                error={fieldErrors.password}
                placeholder="Enter your password"
              />
            </div>

            <Button
              type="submit"
              loading={isLoading}
              className="w-full"
              size="lg"
            >
              Sign in
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
