import { parseAsString, useQueryState } from 'nuqs'

export function useTenantParam() {
  return useQueryState('tenant', parseAsString.withDefault(''))
}

export function useFileParam() {
  return useQueryState('file', parseAsString.withDefault(''))
}
