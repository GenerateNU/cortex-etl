import { UPLOAD_CONFIG } from './constants'

export function validateEmail(email: string): string | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email) return 'Email is required'
  if (!emailRegex.test(email)) return 'Invalid email format'
  return null
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required'
  if (password.length < 6) return 'Password must be at least 6 characters'
  return null
}

export function validateFile(file: File): string | null {
  if (!UPLOAD_CONFIG.ALLOWED_TYPES.includes(file.type as any)) {
    return 'File type not supported. Please upload PDF, CSV, or Excel files.'
  }
  
  if (file.size > UPLOAD_CONFIG.MAX_SIZE) {
    return `File size exceeds ${Math.round(UPLOAD_CONFIG.MAX_SIZE / 1048576)}MB limit`
  }
  
  return null
}

export function validateRequired(value: string, fieldName: string): string | null {
  if (!value || value.trim() === '') {
    return `${fieldName} is required`
  }
  return null
}