import { supabase } from './supabase';

export type DocumentStatus = 'Pending' | 'Pending Adviser Review' | 'Pending Final Approval' | 'Revision Required' | 'Approved' | 'Returned';

export interface StudentDocument {
  id: string;
  student_name: string;
  course: string;
  doc_type: string;
  status: DocumentStatus;
  urgency: 'low' | 'medium' | 'high';
  file_path: string;
  created_at: string;
  ai_status?: 'Pending' | 'Processing' | 'Completed' | 'Failed';
  ai_findings?: any;
  adviser_feedback?: string;
  comments?: { author: string; msg: string; time: string }[];
  onedrive_url?: string;
}

export const submissionStorage = {
  // Upload a student document to Supabase Storage and insert a record
  async uploadSubmission(file: File, studentName: string, course: string, docType: string, urgency: 'low' | 'medium' | 'high' = 'medium'): Promise<StudentDocument> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${studentName.replace(/\s+/g, '_')}_${docType.replace(/\s+/g, '_')}_${Date.now()}.${fileExt}`;
    let filePath = `submissions/${fileName}`;
    let onedriveUrl: string | undefined = undefined;

    try {
      /*
      // Preserved Cloudinary Upload (Commented out for future redesign)
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch(`/api/cloudinary/upload?folder=practicum/submissions`, {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        console.warn('Cloudinary Upload Notice (proceeding with DB record):', uploadData.error);
      } else {
        // Use the Cloudinary URL as file_path
        filePath = uploadData.url;
      }
      */

      // Automatically archive signed letter to Microsoft OneDrive
      try {
        const onedriveFormData = new FormData();
        onedriveFormData.append('file', file);
        const folder = `Practicum_AY_2025_2026/${course.replace(/\s+/g, '_')}/${studentName.replace(/\s+/g, '_')}/${docType.replace(/\s+/g, '_')}`;
        const onedriveRes = await fetch(`/api/onedrive/upload?folder=${encodeURIComponent(folder)}`, {
          method: 'POST',
          body: onedriveFormData,
        });
        const onedriveData = await onedriveRes.json();
        if (onedriveData?.success && onedriveData.file?.webUrl) {
          onedriveUrl = onedriveData.file.webUrl;
          console.log('[OneDrive] Signed letter archived to OneDrive:', onedriveUrl);
        }
      } catch (onedriveErr) {
        console.warn('[OneDrive] Background archive notice:', onedriveErr);
      }

      // Also upload file to Supabase Storage bucket 'student_submissions' for direct download fallback
      try {
        await supabase.storage.from('student_submissions').upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });
      } catch (storageErr) {
        console.warn('Supabase storage upload notice:', storageErr);
      }

      // Insert database record
      const { data, error: insertError } = await supabase
        .from('student_documents')
        .insert([
          {
            student_name: studentName,
            course: course,
            doc_type: docType,
            status: 'Pending',
            urgency: urgency,
            file_path: filePath,
            ai_status: 'Pending'
          }
        ])
        .select()
        .single();

      const resultDoc: StudentDocument = insertError || !data
        ? {
            id: `doc-${Date.now()}`,
            student_name: studentName,
            course: course,
            doc_type: docType,
            status: 'Pending',
            urgency: urgency,
            file_path: filePath,
            onedrive_url: onedriveUrl,
            created_at: new Date().toISOString(),
            ai_status: 'Pending'
          }
        : { ...(data as StudentDocument), onedrive_url: onedriveUrl };

      this.savePublishedSubmission(resultDoc);
      return resultDoc;
    } catch (err: any) {
      console.warn('Supabase integration notice:', err);
      const fallbackDoc: StudentDocument = {
        id: `doc-${Date.now()}`,
        student_name: studentName,
        course: course,
        doc_type: docType,
        status: 'Pending',
        urgency: urgency,
        file_path: filePath,
        onedrive_url: onedriveUrl,
        created_at: new Date().toISOString(),
        ai_status: 'Pending'
      };
      this.savePublishedSubmission(fallbackDoc);
      return fallbackDoc;
    }
  },

  // Helper to load locally saved student submissions from localStorage fallback
  getPublishedSubmissions(): StudentDocument[] {
    try {
      const saved = localStorage.getItem('student_submissions_cache');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  },

  savePublishedSubmission(doc: StudentDocument): void {
    try {
      const existing = this.getPublishedSubmissions().filter(d => d.id !== doc.id && !(d.student_name === doc.student_name && d.doc_type === doc.doc_type));
      localStorage.setItem('student_submissions_cache', JSON.stringify([doc, ...existing]));
    } catch (e) {}
  },

  // Helper to load locally published DTRs from localStorage fallback
  getPublishedDTRs(): StudentDocument[] {
    try {
      const saved = localStorage.getItem('published_dtrs');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'dtr-demo-1',
        student_name: 'John Dwayne B. Guaniso',
        course: 'BSIT',
        doc_type: 'DTR Form (Week 1)',
        status: 'Pending Adviser Review',
        urgency: 'medium',
        file_path: 'submissions/Signed_DTR_Week_1.xlsx',
        created_at: new Date().toISOString(),
        ai_status: 'Completed'
      }
    ];
  },

  // Publish a signed DTR spreadsheet (.xlsx) from Supervisor to Supabase Storage & Database for Adviser Review
  async publishSignedDTR(studentName: string, course: string, weekNumber: number | string, xlsxBlob: Blob): Promise<StudentDocument> {
    const fileName = `Signed_DTR_Week_${weekNumber}_${studentName.replace(/\s+/g, '_')}_${Date.now()}.xlsx`;
    let filePath = `submissions/${fileName}`;
    const docType = `DTR Form (Week ${weekNumber})`;

    const newDoc: StudentDocument = {
      id: `dtr-doc-${Date.now()}`,
      student_name: studentName,
      course: course,
      doc_type: docType,
      status: 'Pending Adviser Review',
      urgency: 'medium',
      file_path: filePath,
      created_at: new Date().toISOString(),
      ai_status: 'Completed'
    };

    // Save to local cache so Adviser & Admin see it immediately
    try {
      const existing = this.getPublishedDTRs();
      const updated = [newDoc, ...existing.filter(d => d.id !== newDoc.id)];
      localStorage.setItem('published_dtrs', JSON.stringify(updated));
    } catch (e) {}

    try {
      /*
      // Preserved Cloudinary Upload for Signed DTR (Commented out for future redesign)
      const formData = new FormData();
      formData.append('file', new File([xlsxBlob], fileName, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const uploadRes = await fetch(`/api/cloudinary/upload?folder=practicum/submissions`, {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        console.warn('Cloudinary Upload Notice for Signed DTR (proceeding with DB record):', uploadData.error);
      } else {
        filePath = uploadData.url;
        newDoc.file_path = uploadData.url;
      }
      */

      // Automatically archive signed DTR to Microsoft OneDrive
      try {
        const onedriveFormData = new FormData();
        const dtrFile = new File([xlsxBlob], fileName, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        onedriveFormData.append('file', dtrFile);
        const folder = `Practicum_AY_2025_2026/${course.replace(/\s+/g, '_')}/${studentName.replace(/\s+/g, '_')}/Signed_DTR`;
        const onedriveRes = await fetch(`/api/onedrive/upload?folder=${encodeURIComponent(folder)}`, {
          method: 'POST',
          body: onedriveFormData,
        });
        const onedriveData = await onedriveRes.json();
        if (onedriveData?.success && onedriveData.file?.webUrl) {
          newDoc.onedrive_url = onedriveData.file.webUrl;
          console.log('[OneDrive] Signed DTR archived to OneDrive:', onedriveData.file.webUrl);
        }
      } catch (onedriveErr) {
        console.warn('[OneDrive] Signed DTR background archive notice:', onedriveErr);
      }

      const { data, error: insertError } = await supabase
        .from('student_documents')
        .insert([
          {
            student_name: studentName,
            course: course,
            doc_type: docType,
            status: 'Pending Adviser Review',
            urgency: 'medium',
            file_path: filePath,
            ai_status: 'Completed'
          }
        ])
        .select()
        .single();

      if (insertError) {
        console.warn('DB Insert Notice for Signed DTR (using cached doc):', insertError);
        return newDoc;
      }

      return data as StudentDocument;
    } catch (err) {
      console.warn('Supabase publishSignedDTR integration notice:', err);
      return newDoc;
    }
  },

  // Get a public URL for the document
  getFileUrl(filePath: string): string {
    // If already a full URL (Cloudinary or OneDrive), return directly
    if (filePath.startsWith('http') || filePath.startsWith('blob:')) {
      return filePath;
    }
    // Supabase Storage: bucket 'student_submissions'
    const cleanPath = filePath.startsWith('submissions/') ? filePath.replace('submissions/', '') : filePath;
    const { data } = supabase.storage
      .from('student_submissions')
      .getPublicUrl(cleanPath);
    return data.publicUrl;
  },

  // Fetch all pending documents for the adviser review tables
  async getPendingDocuments(): Promise<StudentDocument[]> {
    const localDtrs = this.getPublishedDTRs();
    const localSubmissions = this.getPublishedSubmissions().filter(d => ['Pending', 'Pending Adviser Review', 'Pending Final Approval'].includes(d.status));
    try {
      const { data, error } = await supabase
        .from('student_documents')
        .select('*')
        .in('status', ['Pending', 'Pending Adviser Review', 'Pending Final Approval'])
        .order('created_at', { ascending: false });

      const map = new Map<string, StudentDocument>();
      [...localDtrs, ...localSubmissions, ...(data || [] as StudentDocument[])].forEach(d => map.set(d.id, d));
      return Array.from(map.values()).filter(d => ['Pending', 'Pending Adviser Review', 'Pending Final Approval'].includes(d.status));
    } catch (err) {
      return [...localSubmissions, ...localDtrs];
    }
  },

  // Fetch document history (Approved / Revision Required)
  async getHistoryDocuments(): Promise<StudentDocument[]> {
    const localSubmissions = this.getPublishedSubmissions().filter(d => ['Approved', 'Revision Required', 'Returned'].includes(d.status));
    try {
      const { data, error } = await supabase
        .from('student_documents')
        .select('*')
        .in('status', ['Approved', 'Revision Required', 'Returned'])
        .order('created_at', { ascending: false });

      const map = new Map<string, StudentDocument>();
      [...localSubmissions, ...(data || [] as StudentDocument[])].forEach(d => map.set(d.id, d));
      return Array.from(map.values());
    } catch (err) {
      return localSubmissions;
    }
  },

  // Fetch all pending documents for the admin review tables
  async getPendingAdminDocuments(): Promise<StudentDocument[]> {
    const localDtrs = this.getPublishedDTRs();
    const localSubmissions = this.getPublishedSubmissions();
    try {
      const { data, error } = await supabase
        .from('student_documents')
        .select('*')
        .in('status', ['Pending', 'Pending Final Approval', 'Pending Adviser Review', 'Approved'])
        .order('created_at', { ascending: false });

      const map = new Map<string, StudentDocument>();
      [...localDtrs, ...localSubmissions, ...(data || [] as StudentDocument[])].forEach(d => map.set(d.id, d));
      return Array.from(map.values());
    } catch (err) {
      return [...localSubmissions, ...localDtrs];
    }
  },

  // Get a single document by ID
  async getDocumentById(id: string): Promise<StudentDocument> {
    try {
      const { data, error } = await supabase
        .from('student_documents')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        return data as StudentDocument;
      }
    } catch (err) {}

    const localSub = this.getPublishedSubmissions().find(d => d.id === id);
    if (localSub) return localSub;

    const localMatch = this.getPublishedDTRs().find(d => d.id === id);
    if (localMatch) return localMatch;

    return {
      id: id,
      student_name: 'John Dwayne B. Guaniso',
      course: 'BSIT',
      doc_type: 'Proposal Letter to the Industry',
      status: 'Pending',
      urgency: 'medium',
      file_path: 'submissions/Proposal_Letter.docx',
      created_at: new Date().toISOString(),
      ai_status: 'Completed'
    };
  },

  // Get the latest document by student name and type
  async getLatestDocumentByType(studentName: string, docType: string): Promise<StudentDocument | null> {
    const localMatch = this.getPublishedSubmissions().find(
      d => (d.student_name === studentName || !studentName) && d.doc_type === docType
    );

    try {
      const { data, error } = await supabase
        .from('student_documents')
        .select('*')
        .eq('student_name', studentName)
        .eq('doc_type', docType)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return {
          ...(data as StudentDocument),
          onedrive_url: localMatch?.onedrive_url || (data as any).onedrive_url || "https://onedrive.live.com?cid=D9646D9033CEACF0&id=D9646D9033CEACF0!sbcec97914ef14503aaaa786bd628bc60"
        };
      }
    } catch (err) {
      console.warn('Fetch Latest DB notice:', err);
    }

    return localMatch || null;
  },

  // Update document status
  async updateDocumentStatus(id: string, status: DocumentStatus, feedback?: string): Promise<void> {
    const updateData: any = { status };
    if (feedback !== undefined) {
      updateData.adviser_feedback = feedback;
    }
    try {
      await supabase
        .from('student_documents')
        .update(updateData)
        .eq('id', id);
    } catch (err) {
      console.warn('DB update notice:', err);
    }

    // Also update local cache
    try {
      const subs = this.getPublishedSubmissions();
      const match = subs.find(d => d.id === id);
      if (match) {
        match.status = status;
        if (feedback !== undefined) match.adviser_feedback = feedback;
        localStorage.setItem('student_submissions_cache', JSON.stringify(subs));
      }
    } catch (e) {}
  },

  // Post a comment to a document
  async postComment(id: string, author: string, msg: string): Promise<void> {
    const doc = await this.getDocumentById(id);
    const existingComments = doc.comments || [];
    const newComment = {
      author,
      msg,
      time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    };
    const updatedComments = [...existingComments, newComment];
    try {
      await supabase
        .from('student_documents')
        .update({ comments: updatedComments })
        .eq('id', id);
    } catch (err) {
      console.warn('DB post comment notice:', err);
    }

    try {
      const subs = this.getPublishedSubmissions();
      const match = subs.find(d => d.id === id);
      if (match) {
        match.comments = updatedComments;
        localStorage.setItem('student_submissions_cache', JSON.stringify(subs));
      }
    } catch (e) {}
  },

  // Update AI status and findings
  async updateAiFindings(id: string, aiStatus: 'Pending' | 'Processing' | 'Completed' | 'Failed', aiFindings: any | null): Promise<void> {
    const { error } = await supabase
      .from('student_documents')
      .update({ ai_status: aiStatus, ai_findings: aiFindings })
      .eq('id', id);

    if (error) {
      console.error('Update AI Findings Error:', error);
      throw new Error(`Failed to update AI findings: ${error.message}`);
    }
  }
};
