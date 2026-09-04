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
  // Save the raw file to Supabase Storage AND local IndexedDB fallback
  async saveTemplateFile(id: string, file: File): Promise<void> {
    const buffer = await file.arrayBuffer();
    await saveIDBFile(id, buffer);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('template_updated', { detail: { id } }));
    }

    /*
    // Preserved Cloudinary Template Upload (Commented out for future redesign)
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`/api/cloudinary/upload?folder=practicum/templates&customId=${encodeURIComponent(id)}`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        console.warn('Cloudinary template upload warning:', data.error);
      }
    } catch (err) {
      console.warn('Cloudinary unreachable, saved to local store:', err);
    }
    */
  },

  // Retrieve the raw file buffer from Cloudinary or local IndexedDB fallback
  async getTemplateFile(id: string): Promise<ArrayBuffer | undefined> {
    // Check local store first for instant load
    const localBuf = await getIDBFile(id);
    if (localBuf && localBuf.byteLength > 0) {
      return localBuf;
    }

    /*
    // Preserved Cloudinary Template Fetch (Commented out for future redesign)
    try {
      // Try fetching the Cloudinary URL from the backend
      const res = await fetch(`/api/cloudinary/url?publicId=${encodeURIComponent('practicum/templates/' + id)}`);
      if (res.ok) {
        const { url } = await res.json();
        const fileRes = await fetch(url);
        if (fileRes.ok) {
          const buf = await fileRes.arrayBuffer();
          await saveIDBFile(id, buf);
          return buf;
        }
      }
    } catch (e) {
      console.warn('Cloudinary fetch failed, trying Supabase fallback:', e);
    }
    */

    // Legacy fallback: Supabase Storage
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

    return undefined;
  },

  // Retrieve the PDF backup for a template
  async getTemplatePdfBackup(id: string): Promise<ArrayBuffer | undefined> {
    const backupKey = `${id}_pdf_backup`;
    const localBuf = await getIDBFile(backupKey);
    if (localBuf && localBuf.byteLength > 0) {
      return localBuf;
    }

    /*
    // Preserved Cloudinary PDF Backup Fetch (Commented out for future redesign)
    try {
      const res = await fetch(`/api/cloudinary/url?publicId=${encodeURIComponent('practicum/templates/' + backupKey)}`);
      if (res.ok) {
        const { url } = await res.json();
        const fileRes = await fetch(url);
        if (fileRes.ok) {
          const buf = await fileRes.arrayBuffer();
          await saveIDBFile(backupKey, buf);
          return buf;
        }
      }
    } catch (e) {
      console.warn('Cloudinary fetch PDF backup failed, trying Supabase fallback:', e);
    }
    */

    // Legacy fallback: Supabase Storage
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
      // 1. Delete matching troll rows from Supabase DB
      await supabase
        .from('template_metadata')
        .delete()
        .or('name.ilike.%tite%,name.ilike.%bat may%,name.ilike.%hahhgh%,filename.ilike.%tite%,filename.ilike.%hahhgh%');
    } catch (e) {
      console.warn('Supabase purge error:', e);
    }

    try {
      // 2. Delete matching troll entries from IndexedDB
      const db = await getIDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAllKeys();
      req.onsuccess = () => {
        const keys = req.result;
        keys.forEach(k => {
          if (typeof k === 'string' && (k.toLowerCase().includes('tite') || k.toLowerCase().includes('hahhgh') || k.toLowerCase().includes('bat may'))) {
            store.delete(k);
          }
        });
      };
    } catch (e) {}

    // 3. Clean up localStorage backup
    try {
      const local = localStorage.getItem('template_metadata_backup');
      if (local) {
        const metadata = JSON.parse(local);
        if (Array.isArray(metadata)) {
          const clean = metadata.filter((t: any) => !/tite|hahhgh|bat\s*may/i.test(t.name || '') && !/tite|hahhgh|bat\s*may/i.test(t.filename || ''));
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
    await deleteIDBFile(id);
    await deleteIDBFile(`${id}_pdf_backup`);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('template_updated', { detail: { id } }));
    }

    /*
    // Preserved Cloudinary Delete (Commented out for future redesign)
    try {
      // Delete from Cloudinary
      await fetch('/api/cloudinary/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId: `practicum/templates/${id}` }),
      });
      await fetch('/api/cloudinary/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId: `practicum/templates/${id}_pdf_backup` }),
      });
    } catch (e) {
      console.warn('Cloudinary delete template warning:', e);
    }
    */

    try {
      // Legacy cleanup: Supabase Storage
      await supabase.storage.from('templates').remove([id, `${id}_pdf_backup`]);
      await supabase.from('template_metadata').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase delete template warning:', e);
    }
  }
};
