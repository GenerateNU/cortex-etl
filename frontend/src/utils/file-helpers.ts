export function sanitizeFilename(filename: string): string {
  // Remove/replace invalid S3 characters: []{}^%`\|<>#
  const name = filename.replace(/[[\]{}^%`\\|<>#]/g, '_')

  // Also replace multiple underscores with single
  return name.replace(/_+/g, '_')
}
