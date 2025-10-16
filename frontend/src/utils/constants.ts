export const FILE_TYPES = {
  PDF: 'application/pdf',
  CSV: 'text/csv',
  EXCEL: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
} as const

export const UPLOAD_CONFIG = {
  MAX_SIZE: 10485760,
  ALLOWED_TYPES: [FILE_TYPES.PDF, FILE_TYPES.CSV, FILE_TYPES.EXCEL],
} as const

export const QUERY_KEYS = {
  AUTH: ['auth'],
  FILES: ['files'],
  TENANTS: ['tenants'],
  EXTRACTED_FILES: ['extracted-files'],
} as const
