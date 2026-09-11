import { supabase } from './supabase';

export interface TemplateMetadata {
  id: string;
  name: string;
  type: 'DOCX' | 'PDF' | 'XLSX';
  version: string;
  updated: string;
  size: string;
  group: string;
  filename?: string;
  isCustom?: boolean;
}

// IndexedDB helper for robust offline/local storage fallback
const DB_NAME = 'CapstoneTemplateDB';
const STORE_NAME = 'templates_store';

const getIDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const saveIDBFile = async (key: string, buffer: ArrayBuffer): Promise<void> => {
  try {
    const db = await getIDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(buffer, key);
    await new Promise((res, rej) => {
      tx.oncomplete = res;
      tx.onerror = rej;
    });
  } catch (e) {
    console.warn('IDB Save failed:', e);
  }
};

const getIDBFile = async (key: string): Promise<ArrayBuffer | undefined> => {
  try {
    const db = await getIDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(key);
    const res = await new Promise<any>((resolve) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(undefined);
    });

    if (!res) return undefined;

    if (res instanceof Blob) {
      return await res.arrayBuffer();
    }

    if (res instanceof ArrayBuffer) {
      return res;
    }

    if (res.buffer && res.buffer instanceof ArrayBuffer) {
      return res.buffer;
    }

    return undefined;
  } catch (e) {
    console.warn('getIDBFile error:', e);
    return undefined;
  }
};

const deleteIDBFile = async (key: string): Promise<void> => {
  try {
    const db = await getIDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(key);
  } catch (e) {
    console.warn('IDB Delete failed:', e);
  }
};

export const templateStorage = {
  // Save the raw file to Backend API, Supabase Storage, AND local IndexedDB fallback
  async saveTemplateFile(id: string, file: File): Promise<void> {
    const buffer = await file.arrayBuffer();
    await saveIDBFile(id, buffer);

    // If backup key, also save to base key in IDB, and vice versa for PDFs
    if (id.endsWith('_pdf_backup')) {
      const baseId = id.replace('_pdf_backup', '');
      await saveIDBFile(baseId, buffer);
    } else if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
      await saveIDBFile(`${id}_pdf_backup`, buffer);
    }

    // Persist to Backend API so all users (Student & Admin) can view the file
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('id', id);
      const res = await fetch('/api/templates/upload', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        console.warn('Backend template upload returned non-200:', res.status);
      }
    } catch (err) {
      console.warn('Backend template upload notice (local cache active):', err);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('template_updated', { detail: { id } }));
    }
  },

  // Retrieve the raw file buffer from Backend API, local IndexedDB, or Supabase
  async getTemplateFile(id: string): Promise<ArrayBuffer | undefined> {
    let isBackendActive = false;

    // 1. Try Backend API first so latest admin uploads are shared across all users
    try {
      const res = await fetch(`/api/templates/${encodeURIComponent(id)}`);
      isBackendActive = true;
      if (res.ok) {
        const buf = await res.arrayBuffer();
        await saveIDBFile(id, buf);
        return buf;
      }
    } catch (e) {
      console.warn('Backend template fetch notice:', e);
    }

    // 2. Legacy fallback: Supabase Storage
    try {
      const { data, error } = await supabase.storage
        .from('templates')
        .download(id);

      if (!error && data) {
        const buf = await data.arrayBuffer();
        await saveIDBFile(id, buf);
        return buf;
      }
    } catch (e) {
      console.warn('Supabase fetch also failed:', e);
    }

    // If server is online and neither backend nor Supabase has the file:
    // It was deleted or not uploaded. Remove any stale cache from IndexedDB!
    if (isBackendActive) {
      await deleteIDBFile(id);
      return undefined;
    }

    // 3. Offline fallback only
    const localBuf = await getIDBFile(id);
    if (localBuf && localBuf.byteLength > 0) {
      return localBuf;
    }

    return undefined;
  },

  // Retrieve the PDF backup for a template
  async getTemplatePdfBackup(id: string): Promise<ArrayBuffer | undefined> {
    const backupKey = `${id}_pdf_backup`;
    let isBackendActive = false;

    // 1. Try Backend API first for the PDF backup
    try {
      const res = await fetch(`/api/templates/${encodeURIComponent(backupKey)}`);
      isBackendActive = true;
      if (res.ok) {
        const buf = await res.arrayBuffer();
        await saveIDBFile(backupKey, buf);
        return buf;
      }

      // Also check if base id was uploaded as a PDF
      const baseRes = await fetch(`/api/templates/${encodeURIComponent(id)}`);
      if (baseRes.ok && baseRes.headers.get('content-type')?.includes('pdf')) {
        const buf = await baseRes.arrayBuffer();
        await saveIDBFile(backupKey, buf);
        return buf;
      }
    } catch (e) {
      console.warn('Backend PDF backup fetch notice:', e);
    }

    // 2. Legacy fallback: Supabase Storage
    try {
      const { data, error } = await supabase.storage
        .from('templates')
        .download(backupKey);

      if (!error && data) {
        const buf = await data.arrayBuffer();
        await saveIDBFile(backupKey, buf);
        return buf;
      }
    } catch (e) {
      console.warn('Supabase fetch PDF backup also failed:', e);
    }

    // If server is online and neither backend nor Supabase has the PDF backup:
    // It was deleted or not uploaded. Remove stale cache from IndexedDB!
    if (isBackendActive) {
      await deleteIDBFile(backupKey);
      return undefined;
    }

    // 3. Offline fallback only
    const localBuf = await getIDBFile(backupKey);
    if (localBuf && localBuf.byteLength > 0) {
      return localBuf;
    }

    return undefined;
  },

  // Save metadata to Supabase DB and localStorage
  async saveMetadata(metadata: TemplateMetadata[]): Promise<void> {
    try {
      localStorage.setItem('template_metadata_backup', JSON.stringify(metadata));
    } catch (e) {}

    try {
      const { error } = await supabase
        .from('template_metadata')
        .upsert(metadata);

      if (error) {
        console.warn('Supabase metadata save warning:', error.message);
      }
    } catch (err) {
      console.warn('Supabase DB unreachable, saved metadata locally:', err);
    }
  },

  // Permanently delete troll rows from Supabase DB, IndexedDB, and localStorage
  async purgeTrollMetadata(): Promise<void> {
    try {
      // 1. Delete matching troll rows and legacy journal PDF entries from Supabase DB & Storage
      await supabase
        .from('template_metadata')
        .delete()
        .or('id.eq.h5_pdf_backup,name.ilike.%tite%,name.ilike.%bat may%,name.ilike.%hahhgh%,filename.ilike.%tite%,filename.ilike.%hahhgh%');
      await supabase
        .storage
        .from('templates')
        .remove(['h5_pdf_backup', 'h5']);
    } catch (e) {
      console.warn('Supabase purge error:', e);
    }

    try {
      // 2. Delete matching troll entries, h5, and h5_pdf_backup from IndexedDB
      const db = await getIDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete('h5');
      store.delete('h5_pdf_backup');
      const req = store.getAllKeys();
      await new Promise<void>((resolve) => {
        req.onsuccess = () => {
          const keys = req.result;
          keys.forEach(k => {
            if (typeof k === 'string') {
              const lower = k.toLowerCase();
              if (
                lower === 'h5' ||
                lower.includes('h5') ||
                lower.includes('tite') ||
                lower.includes('hahhgh') ||
                lower.includes('bat may') ||
                lower.includes('assignment')
              ) {
                store.delete(k);
              }
            }
          });
          resolve();
        };
        req.onerror = () => resolve();
      });
    } catch (e) {}

    // 3. Clean up localStorage backup
    try {
      const local = localStorage.getItem('template_metadata_backup');
      if (local) {
        const metadata = JSON.parse(local);
        if (Array.isArray(metadata)) {
          const clean = metadata.filter((t: any) => t.id !== 'h5_pdf_backup' && !/tite|hahhgh|bat\s*may/i.test(t.name || '') && !/tite|hahhgh|bat\s*may/i.test(t.filename || ''));
          localStorage.setItem('template_metadata_backup', JSON.stringify(clean));
        }
      }
    } catch (e) {}
  },

  // Retrieve metadata from Supabase DB or localStorage
  async getMetadata(): Promise<TemplateMetadata[] | undefined> {
    // Proactively purge any troll metadata rows from database and cache
    this.purgeTrollMetadata().catch(() => {});

    try {
      const { data, error } = await supabase
        .from('template_metadata')
        .select('*');

      if (!error && data && data.length > 0) {
        const cleanData = data.filter((t: any) => !/tite|hahhgh|bat\s*may/i.test(t.name || '') && !/tite|hahhgh|bat\s*may/i.test(t.filename || ''));
        localStorage.setItem('template_metadata_backup', JSON.stringify(cleanData));
        return cleanData as TemplateMetadata[];
      }
    } catch (e) {
      console.warn('Supabase getMetadata failed:', e);
    }

    try {
      const local = localStorage.getItem('template_metadata_backup');
      if (local) {
        const metadata = JSON.parse(local);
        if (Array.isArray(metadata)) {
          return metadata.filter((t: any) => !/tite|hahhgh|bat\s*may/i.test(t.name || '') && !/tite|hahhgh|bat\s*may/i.test(t.filename || ''));
        }
      }
    } catch (e) {}

    return undefined;
  },
  
  // Delete a template and its metadata
  async deleteTemplate(id: string): Promise<void> {
    const baseId = id.endsWith('_pdf_backup') ? id.replace('_pdf_backup', '') : id;

    // 1. Delete from IndexedDB
    await deleteIDBFile(id);
    await deleteIDBFile(`${id}_pdf_backup`);
    if (baseId !== id) {
      await deleteIDBFile(baseId);
    }

    // 2. Delete from Backend API
    try {
      await fetch(`/api/templates/${encodeURIComponent(id)}`, { method: 'DELETE' });
      await fetch(`/api/templates/${encodeURIComponent(`${id}_pdf_backup`)}`, { method: 'DELETE' });
      if (baseId !== id) {
        await fetch(`/api/templates/${encodeURIComponent(baseId)}`, { method: 'DELETE' });
      }
    } catch (e) {
      console.warn('Backend delete template warning:', e);
    }

    // 3. Clean up localStorage metadata backup immediately
    try {
      const local = localStorage.getItem('template_metadata_backup');
      if (local) {
        const metadata = JSON.parse(local);
        if (Array.isArray(metadata)) {
          const clean = metadata.filter((t: any) => t.id !== id && t.id !== baseId && t.id !== `${id}_pdf_backup`);
          localStorage.setItem('template_metadata_backup', JSON.stringify(clean));
        }
      }
    } catch (e) {}

    // 4. Notify all components to re-render immediately
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('template_updated', { detail: { id } }));
    }

    // 5. Cleanup Supabase Storage and DB
    try {
      await supabase.storage.from('templates').remove([id, `${id}_pdf_backup`, baseId]);
      await supabase.from('template_metadata').delete().or(`id.eq.${id},id.eq.${baseId},id.eq.${id}_pdf_backup`);
    } catch (e) {
      console.warn('Supabase delete template warning:', e);
    }
  }
};
