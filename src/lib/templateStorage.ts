import { apiFetch, apiJson } from './api';
import { supabase } from './supabase';

export interface TemplateMetadata {
  id: string; name: string; type: 'DOCX' | 'PDF' | 'XLSX'; version: string;
  updated: string; size: string; group: string; filename?: string; isCustom?: boolean;
}
const notify = (id: string) => window.dispatchEvent(new CustomEvent('template_updated', { detail: { id } }));
export const templateStorage = {
  async saveTemplateFile(id: string, file: File): Promise<void> {
    const body = new FormData(); body.append('file', file); body.append('id', id);
    await apiJson('/api/templates/upload', { method: 'POST', body });
    notify(id);
  },
  async getTemplateFile(id: string): Promise<ArrayBuffer | undefined> {
    const response = await apiFetch(`/api/templates/${encodeURIComponent(id)}`);
    if (response.status === 404) return undefined;
    if (!response.ok) throw new Error('Unable to load template. Please retry.');
    return response.arrayBuffer();
  },
  async getTemplatePdfBackup(id: string): Promise<ArrayBuffer | undefined> {
    const backup = await this.getTemplateFile(`${id}_pdf_backup`);
    if (backup) return backup;
    const response = await apiFetch(`/api/templates/${encodeURIComponent(id)}`);
    if (response.status === 404) return undefined;
    if (!response.ok) throw new Error('Unable to load template.');
    return response.headers.get('content-type')?.includes('pdf') ? response.arrayBuffer() : undefined;
  },
  async saveMetadata(metadata: TemplateMetadata[]): Promise<void> {
    const { error } = await supabase.from('template_metadata').upsert(metadata.map(({ isCustom, ...row }) => row));
    if (error) throw new Error('Template metadata was not saved.');
  },
  async getMetadata(): Promise<TemplateMetadata[] | undefined> {
    const { data, error } = await supabase.from('template_metadata').select('*');
    if (error) throw new Error('Unable to load template metadata.');
    return data as TemplateMetadata[];
  },
  async deleteTemplate(id: string): Promise<void> {
    // Deleting a PDF backup must not delete the editable original.
    const ids = id.endsWith('_pdf_backup') ? [id] : [id, `${id}_pdf_backup`];
    for (const key of ids) await apiJson(`/api/templates/${encodeURIComponent(key)}`, { method: 'DELETE' });
    const { error } = await supabase.from('template_metadata').delete().in('id', ids);
    if (error) throw new Error('Files were removed, but metadata deletion failed. Retry the deletion.');
    notify(id);
  },
};
