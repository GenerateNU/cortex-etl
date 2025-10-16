import { supabase } from '../config/supabase.config'

export const fileService = {


  async deleteFile(filePath: string, fileId: string): Promise<void> {
    // Delete from storage using path
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([filePath])

    if (storageError) throw storageError

    // Delete from database - this should cascade to extracted_files
    const { error: dbError } = await supabase
      .from('file_uploads')
      .delete()
      .eq('id', fileId)

    if (dbError) throw dbError
  },

  async getSignedUrl(path: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(path, 3600)

    if (error) throw error
    return data.signedUrl
  },
}
