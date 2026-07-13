import { supabase } from './supabase';

export interface TemplateMetadata {
  id: string;
  name: string;
  type: 'DOCX' | 'PDF' | 'XLSX';
  version: string;
  updated: string;
  size: string;
  group: string;
}

export const templateStorage = {
  // Save the raw file to Supabase Storage
  async saveTemplateFile(id: string, file: File): Promise<void> {
    const { error } = await supabase.storage
      .from('templates')
      .upload(id, file, {
        upsert: true,
      });

    if (error) {
      console.error('Error uploading template file:', error);
      throw error;
    }
  },

  // Retrieve the raw file buffer from Supabase Storage
  async getTemplateFile(id: string): Promise<ArrayBuffer | undefined> {
    const { data, error } = await supabase.storage
      .from('templates')
      .download(id);

    if (error) {
      console.error('Error downloading template file:', error);
      return undefined;
    }

    return await data?.arrayBuffer();
  },

  // Retrieve the PDF backup for a template
  async getTemplatePdfBackup(id: string): Promise<ArrayBuffer | undefined> {
    const { data, error } = await supabase.storage
      .from('templates')
      .download(`${id}_pdf_backup`);

    if (error) {
      return undefined;
    }

    return await data?.arrayBuffer();
  },

  // Save metadata to Supabase DB
  async saveMetadata(metadata: TemplateMetadata[]): Promise<void> {
    // The previous implementation saved the entire array.
    // We can upsert all items.
    const { error } = await supabase
      .from('template_metadata')
      .upsert(metadata);

    if (error) {
      console.error('Error saving template metadata:', error);
      throw error;
    }
  },

  // Retrieve metadata from Supabase DB
  async getMetadata(): Promise<TemplateMetadata[] | undefined> {
    const { data, error } = await supabase
      .from('template_metadata')
      .select('*');

    if (error) {
      console.error('Error fetching template metadata:', error);
      return undefined;
    }

    return data as TemplateMetadata[];
  },
  
  // Delete a template and its metadata from Supabase
  async deleteTemplate(id: string): Promise<void> {
    // Delete file
    const { error: storageError } = await supabase.storage
      .from('templates')
      .remove([id]);

    if (storageError) {
      console.error('Error deleting template file:', storageError);
    }

    // Delete metadata
    const { error: dbError } = await supabase
      .from('template_metadata')
      .delete()
      .eq('id', id);

    // Also try to delete PDF backup just in case
    await supabase.storage.from('templates').remove([`${id}_pdf_backup`]);

    if (dbError) {
      console.error('Error deleting template metadata:', dbError);
      throw dbError;
    }
  }
};
