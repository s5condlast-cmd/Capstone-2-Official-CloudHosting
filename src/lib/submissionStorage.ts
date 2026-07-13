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
}

export const submissionStorage = {
  // Upload a student document to Supabase Storage and insert a record
  async uploadSubmission(file: File, studentName: string, course: string, docType: string, urgency: 'low' | 'medium' | 'high' = 'medium'): Promise<StudentDocument> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${studentName.replace(/\s+/g, '_')}_${docType.replace(/\s+/g, '_')}_${Date.now()}.${fileExt}`;
    const filePath = `submissions/${fileName}`;

    // Upload file to storage
    const { error: uploadError } = await supabase.storage
      .from('student_submissions')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Storage Upload Error:', uploadError);
      throw new Error(`Failed to upload file: ${uploadError.message}`);
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
      console.error('DB Insert Error:', insertError);
      throw new Error(`Failed to insert record: ${insertError.message}`);
    }

    return data as StudentDocument;
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
    const { data, error } = await supabase
      .from('student_documents')
      .select('*')
      .in('status', ['Pending Adviser Review'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch Error:', error);
      throw new Error(`Failed to fetch documents: ${error.message}`);
    }

    return data as StudentDocument[];
  },

  // Fetch all pending documents for the admin review tables
  async getPendingAdminDocuments(): Promise<StudentDocument[]> {
    const { data, error } = await supabase
      .from('student_documents')
      .select('*')
      .in('status', ['Pending Final Approval'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch Admin Docs Error:', error);
      throw new Error(`Failed to fetch admin documents: ${error.message}`);
    }

    return data as StudentDocument[];
  },

  // Get a single document by ID
  async getDocumentById(id: string): Promise<StudentDocument> {
    const { data, error } = await supabase
      .from('student_documents')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Fetch Error:', error);
      throw new Error(`Failed to fetch document: ${error.message}`);
    }

    return data as StudentDocument;
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
  async updateDocumentStatus(id: string, status: DocumentStatus): Promise<void> {
    const { error } = await supabase
      .from('student_documents')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('Update Error:', error);
      throw new Error(`Failed to update status: ${error.message}`);
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
