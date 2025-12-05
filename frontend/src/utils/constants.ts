export const QUERY_KEYS = {
  auth: () => ['auth'] as const,

  files: {
    all: () => ['files'] as const,
    lists: () => [...QUERY_KEYS.files.all(), 'list'] as const,
    list: (tenantId: string | undefined) =>
      [...QUERY_KEYS.files.lists(), tenantId] as const,
    details: () => [...QUERY_KEYS.files.all(), 'detail'] as const,
    detail: (tenantId: string | undefined, fileId: string | undefined) =>
      [...QUERY_KEYS.files.details(), tenantId, fileId] as const,
    signedUrls: () => [...QUERY_KEYS.files.all(), 'signed-url'] as const,
    signedUrl: (tenantId: string | undefined, fileId: string | undefined) =>
      [...QUERY_KEYS.files.signedUrls(), tenantId, fileId] as const,
  },

  tenants: {
    all: () => ['tenants'] as const,
    lists: () => [...QUERY_KEYS.tenants.all(), 'list'] as const,
    list: () => [...QUERY_KEYS.tenants.lists()] as const,
    details: () => [...QUERY_KEYS.tenants.all(), 'detail'] as const,
    detail: (tenantId: string | undefined) =>
      [...QUERY_KEYS.tenants.details(), tenantId] as const,
  },

  extractedFiles: {
    all: () => ['extracted-files'] as const,
    lists: () => [...QUERY_KEYS.extractedFiles.all(), 'list'] as const,
    list: (tenantId: string | undefined) =>
      [...QUERY_KEYS.extractedFiles.lists(), tenantId] as const,
    details: () => [...QUERY_KEYS.extractedFiles.all(), 'detail'] as const,
    detail: (sourceFileId: string | undefined) =>
      [...QUERY_KEYS.extractedFiles.details(), sourceFileId] as const,
  },

  classifications: {
    all: () => ['classifications'] as const,
    lists: () => [...QUERY_KEYS.classifications.all(), 'list'] as const,
    list: (tenantId: string | undefined) =>
      [...QUERY_KEYS.classifications.lists(), tenantId] as const,
    visualizations: () =>
      [...QUERY_KEYS.classifications.all(), 'visualization'] as const,
    visualization: (tenantId: string | undefined) =>
      [...QUERY_KEYS.classifications.visualizations(), tenantId] as const,
  },

  relationships: {
    all: () => ['relationships'] as const,
    lists: () => [...QUERY_KEYS.relationships.all(), 'list'] as const,
    list: (tenantId: string | undefined) =>
      [...QUERY_KEYS.relationships.lists(), tenantId] as const,
  },

  migrations: {
    all: () => ['migrations'] as const,
    lists: () => [...QUERY_KEYS.migrations.all(), 'list'] as const,
    list: (tenantId: string | undefined) =>
      [...QUERY_KEYS.migrations.lists(), tenantId] as const,
    connectionUrl: () =>
      [...QUERY_KEYS.migrations.all(), 'connection-url'] as const,
    connectionUrlDetail: (tenantId: string | undefined) =>
      [...QUERY_KEYS.migrations.connectionUrl(), tenantId] as const,
  },
} as const
