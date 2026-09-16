import { supabase } from './supabase';

export type DocumentStatus = 'Pending' | 'Pending Adviser Review' | 'Pending Final Approval' | 'Revision Required' | 'Approved' | 'Returned';
export interface StudentDocument {
  id: string; owner_id?: string; student_name: string; course: string; doc_type: string;
  status: DocumentStatus; urgency: 'low' | 'medium' | 'high'; file_path: string; created_at: string;
  ai_status?: 'Pending' | 'Processing' | 'Completed' | 'Failed'; ai_findings?: any;
  adviser_feedback?: string; comments?: { author: string; msg: string; time: string }[]; onedrive_url?: string;
}

async function listDocuments(statuses: DocumentStatus[]): Promise<StudentDocument[]> {
  const { data, error } = await supabase.from('student_documents').select('*').in('status', statuses).order('created_at', { ascending: false });
  if (error) throw new Error('Unable to load documents. Please retry.');
  return data as StudentDocument[];
}
async function saveDocument(file: Blob, filename: string, ownerId: string, name: string, course: string,
  docType: string, status: DocumentStatus, urgency = 'medium'): Promise<StudentDocument> {
  const extension = filename.split('.').pop()?.toLowerCase();
  if (!extension || !['pdf','docx','xlsx'].includes(extension)) throw new Error('Upload a PDF, DOCX, or XLSX document.');
  if (file.size > 10 * 1024 * 1024) throw new Error('Documents must be smaller than 10 MB.');
  const path = `${ownerId}/${crypto.randomUUID()}.${extension}`;
  const upload = await supabase.storage.from('student_submissions').upload(path, file, { contentType: file.type, upsert: false });
  if (upload.error) throw new Error('Your document was not uploaded. Please retry.');
  const inserted = await supabase.from('student_documents').insert({ owner_id: ownerId, student_name: name, course,
    doc_type: docType, status, urgency, file_path: path, ai_status: 'Pending' }).select('*').single();
  if (inserted.error || !inserted.data) {
    await supabase.storage.from('student_submissions').remove([path]);
    throw new Error('Your submission was not saved. Please retry.');
  }
  return inserted.data as StudentDocument;
}
export const submissionStorage = {
  async uploadSubmission(file: File, _studentName: string, _course: string, docType: string, urgency: 'low' | 'medium' | 'high' = 'medium'): Promise<StudentDocument> {
    const auth = await supabase.auth.getUser();
    if (auth.error || !auth.data.user) throw new Error('Sign in before submitting.');
    const profile = await supabase.from('profiles').select('id,full_name,section,program').eq('id', auth.data.user.id).single();
    if (profile.error || !profile.data) throw new Error('Unable to verify your student profile.');
    return saveDocument(file, file.name, profile.data.id, profile.data.full_name, profile.data.section || profile.data.program || '', docType, 'Pending', urgency);
  },
  async publishSignedDTR(_name: string, _course: string, week: string | number, blob: Blob, studentId?: string): Promise<StudentDocument> {
    if (!studentId) throw new Error('An assigned student ID is required to publish a DTR.');
    const target = await supabase.from('profiles').select('id,full_name,section,program').eq('student_id', studentId).eq('role','student').single();
    if (target.error || !target.data) throw new Error('This student is not uniquely identified or assigned to you.');
    return saveDocument(blob, 'signed-dtr.xlsx', target.data.id, target.data.full_name, target.data.section || target.data.program || '', `DTR Form (Week ${week})`, 'Pending Adviser Review');
  },
  async getFileUrl(filePath: string): Promise<string> {
    // Private storage: do not resurrect public links or arbitrary third-party URLs.
    if (!filePath || filePath.includes('://')) throw new Error('This legacy file needs migration into private practicum storage.');
    const path = filePath.replace(/^submissions\//, '');
    const { data, error } = await supabase.storage.from('student_submissions').createSignedUrl(path, 60);
    if (error || !data) throw new Error('Document unavailable or access denied.');
    return data.signedUrl;
  },
  async resolvePdfUrl(doc: StudentDocument): Promise<string> { return /\.(pdf|xlsx)$/i.test(doc.file_path) ? this.getFileUrl(doc.file_path) : ''; },
  async resolveOriginalDocxUrl(doc: StudentDocument): Promise<string | undefined> { return doc.file_path.toLowerCase().endsWith('.docx') ? this.getFileUrl(doc.file_path) : undefined; },
  async getPendingDocuments() { return listDocuments(['Pending','Pending Adviser Review','Pending Final Approval']); },
  async getHistoryDocuments() { return listDocuments(['Approved','Revision Required','Returned']); },
  async getPendingAdminDocuments() { return listDocuments(['Pending','Pending Adviser Review','Pending Final Approval','Approved']); },
  async getDocumentById(id: string): Promise<StudentDocument> {
    const { data, error } = await supabase.from('student_documents').select('*').eq('id', id).single();
    if (error || !data) throw new Error('Document not found or access denied.');
    return data as StudentDocument;
  },
  async getLatestDocumentByType(studentName: string, docType: string): Promise<StudentDocument | null> {
    const { data, error } = await supabase.from('student_documents').select('*').eq('student_name', studentName).eq('doc_type',docType)
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (error) throw new Error('Unable to load submission status.');
    return data as StudentDocument | null;
  },
  async updateDocumentStatus(id: string, status: DocumentStatus, feedback?: string): Promise<void> {
    const { error } = await supabase.from('student_documents').update({ status, ...(feedback !== undefined ? { adviser_feedback: feedback } : {}) }).eq('id',id).select('id').single();
    if (error) throw new Error('Document status was not saved.');
  },
  async postComment(id: string, _author: string, msg: string): Promise<void> {
    const { error } = await supabase.rpc('add_document_comment', { document_id: id, message: msg });
    if (error) throw new Error('Your comment was not saved.');
  },
  async updateAiFindings(id: string, aiStatus: StudentDocument['ai_status'], aiFindings: any): Promise<void> {
    const { error } = await supabase.from('student_documents').update({ ai_status: aiStatus, ai_findings: aiFindings }).eq('id',id).select('id').single();
    if (error) throw new Error('AI findings were not saved.');
  },
};
