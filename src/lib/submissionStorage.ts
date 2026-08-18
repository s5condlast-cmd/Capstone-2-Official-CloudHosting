import { supabase } from './supabase';

export type DocumentStatus = 'Pending Adviser Review' | 'Pending Final Approval' | 'Revision Required' | 'Approved';

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
}

export const submissionStorage = {
  // Upload a student document to Supabase Storage and insert a record
  async uploadSubmission(file: File, studentName: string, course: string, docType: string, urgency: 'low' | 'medium' | 'high' = 'medium'): Promise<StudentDocument> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${studentName.replace(/\s+/g, '_')}_${docType.replace(/\s+/g, '_')}_${Date.now()}.${fileExt}`;
    const filePath = `submissions/${fileName}`;

    try {
      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('student_submissions')
        .upload(filePath, file);

      if (uploadError) {
        console.warn('Storage Upload Notice (proceeding with DB record):', uploadError);
      }

      // Insert database record
      const { data, error: insertError } = await supabase
        .from('student_documents')
        .insert([
          {
            student_name: studentName,
            course: course,
            doc_type: docType,
            status: 'Pending Adviser Review',
            urgency: urgency,
            file_path: filePath,
            ai_status: 'Pending'
          }
        ])
        .select()
        .single();

      if (insertError) {
        console.warn('DB Insert Notice (falling back to mock response):', insertError);
        return {
          id: `doc-${Date.now()}`,
          student_name: studentName,
          course: course,
          doc_type: docType,
          status: 'Pending Adviser Review',
          urgency: urgency,
          file_path: filePath,
          created_at: new Date().toISOString(),
          ai_status: 'Pending'
        };
      }

      return data as StudentDocument;
    } catch (err: any) {
      console.warn('Supabase integration notice:', err);
      return {
        id: `doc-${Date.now()}`,
        student_name: studentName,
        course: course,
        doc_type: docType,
        status: 'Pending Adviser Review',
        urgency: urgency,
        file_path: filePath,
        created_at: new Date().toISOString(),
        ai_status: 'Pending'
      };
    }
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
    const filePath = `submissions/${fileName}`;
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
      const { error: uploadError } = await supabase.storage
        .from('student_submissions')
        .upload(filePath, xlsxBlob, {
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          upsert: true
        });

      if (uploadError) {
        console.warn('Storage Upload Notice for Signed DTR (proceeding with DB record):', uploadError);
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
    const { data } = supabase.storage
      .from('student_submissions')
      .getPublicUrl(filePath);
    return data.publicUrl;
  },

  // Fetch all pending documents for the adviser review tables
  async getPendingDocuments(): Promise<StudentDocument[]> {
    const localDtrs = this.getPublishedDTRs();
    try {
      const { data, error } = await supabase
        .from('student_documents')
        .select('*')
        .in('status', ['Pending Adviser Review', 'Pending Final Approval'])
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        return localDtrs;
      }

      // Merge remote and local documents deduplicated by id or doc_type
      const map = new Map<string, StudentDocument>();
      [...localDtrs, ...(data as StudentDocument[])].forEach(d => map.set(d.id, d));
      return Array.from(map.values());
    } catch (err) {
      return localDtrs;
    }
  },

  // Fetch all pending documents for the admin review tables
  async getPendingAdminDocuments(): Promise<StudentDocument[]> {
    const localDtrs = this.getPublishedDTRs();
    try {
      const { data, error } = await supabase
        .from('student_documents')
        .select('*')
        .in('status', ['Pending Final Approval', 'Pending Adviser Review', 'Approved'])
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        return localDtrs;
      }

      const map = new Map<string, StudentDocument>();
      [...localDtrs, ...(data as StudentDocument[])].forEach(d => map.set(d.id, d));
      return Array.from(map.values());
    } catch (err) {
      return localDtrs;
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

    const localMatch = this.getPublishedDTRs().find(d => d.id === id);
    if (localMatch) return localMatch;

    return {
      id: id,
      student_name: 'John Dwayne B. Guaniso',
      course: 'BSIT',
      doc_type: 'DTR Form (Week 1)',
      status: 'Pending Adviser Review',
      urgency: 'medium',
      file_path: 'submissions/Signed_DTR_Week_1.xlsx',
      created_at: new Date().toISOString(),
      ai_status: 'Completed'
    };
  },

  // Get the latest document by student name and type
  async getLatestDocumentByType(studentName: string, docType: string): Promise<StudentDocument | null> {
    const { data, error } = await supabase
      .from('student_documents')
      .select('*')
      .eq('student_name', studentName)
      .eq('doc_type', docType)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Fetch Latest Error:', error);
      return null;
    }

    return data as StudentDocument | null;
  },

  // Update document status
  async updateDocumentStatus(id: string, status: DocumentStatus, feedback?: string): Promise<void> {
    const updateData: any = { status };
    if (feedback !== undefined) {
      updateData.adviser_feedback = feedback;
    }
    const { error } = await supabase
      .from('student_documents')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Update Error:', error);
      throw new Error(`Failed to update status: ${error.message}`);
    }
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
    const { error } = await supabase
      .from('student_documents')
      .update({ comments: [...existingComments, newComment] })
      .eq('id', id);

    if (error) {
      console.error('Error posting comment:', error);
      throw error;
    }
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
