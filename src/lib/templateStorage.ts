import { get, set, del, keys } from 'idb-keyval';

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
  // Save the raw file buffer to IndexedDB
  async saveTemplateFile(id: string, file: File): Promise<void> {
    const arrayBuffer = await file.arrayBuffer();
    await set(`template_file_${id}`, arrayBuffer);
  },

  // Retrieve the raw file buffer from IndexedDB
  async getTemplateFile(id: string): Promise<ArrayBuffer | undefined> {
    return await get<ArrayBuffer>(`template_file_${id}`);
  },

  // Save metadata to IndexedDB
  async saveMetadata(metadata: TemplateMetadata[]): Promise<void> {
    await set('template_metadata', metadata);
  },

  // Retrieve metadata
  async getMetadata(): Promise<TemplateMetadata[] | undefined> {
    return await get<TemplateMetadata[]>('template_metadata');
  },
  
  // Delete a template and its metadata
  async deleteTemplate(id: string): Promise<void> {
    await del(`template_file_${id}`);
    const meta = await this.getMetadata();
    if (meta) {
      await this.saveMetadata(meta.filter(m => m.id !== id));
    }
  }
};
