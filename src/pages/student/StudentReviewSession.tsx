/**
 * StudentReviewSession.tsx
 * STI eLMS Requirement Detail page — /student/documents/:id and /student/review/:id
 *
 * Implements the STI eLMS requirement detail experience:
 * - Top navigation bar with < Previous, centered module title, bookmark icon, and Continue >
 * - Subheader with bold requirement title and segmented toggle pills: [ Instructions ] | [ Submissions ]
 * - Instructions view: official rubric criteria, document PDF preview canvas, and action bar
 * - Submissions view: EmbedPdfWorkspace preview, Submission summary, and rich Comments discussion box
 * - Fully aligned with system design tokens (monochrome / primary / theme-aware borders & cards)
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FileText,
  Check,
  X,
  Clock,
  BarChart2,
  Calendar,
  Upload,
  Download,
  Edit3,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link2,
  File as FileIcon,
  Image as ImageIcon,
  Mic,
  Video,
  Send,
  Loader2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  FileUp,
  Inbox,
  Eye,
  Plus,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/contexts/AuthContext';
import {
  INSTITUTIONAL_REQUIREMENTS,
  InstitutionalRequirement,
  getRequirementById,
  getAdjacentRequirements,
} from '@/src/config/requirementRegistry';
import { getEditorTemplate, EditorTemplate } from '@/src/config/editorTemplates';
import { submissionStorage, StudentDocument } from '@/src/lib/submissionStorage';
import { templateStorage } from '@/src/lib/templateStorage';
import { documentGenerator } from '@/src/lib/documentGenerator';
import { EmbedPdfWorkspace } from '@/src/components/review/EmbedPdfWorkspace';
import { validateDocumentUpload } from '@/src/config/documentUploadPolicy';
import { validatePdfFileBytes } from '@/src/config/reviewPdfPolicy';
import { submitReviewDocument, submitReviewRevision } from '@/src/lib/reviewSubmissionService';

const REQUIREMENT_TO_ADMIN_TEMPLATE_ID: Record<string, string> = {
  'student-application-letter': 'h11',
  'parent-consent-with-fee': 'h2_1',
  'parent-consent-without-fee': 'h2_2',
  'student-consent-with-fee': 'h2_3',
  'student-consent-without-fee': 'h2_4',
  'moa-template': 'h3',
  'endorsement-letter': 'h4',
  'proposal-letter': 'h12',
  'weekly-journal': 'h5',
  'daily-time-record': 'h6',
  'training-plan-form': 'h7',
  'integration-paper': 'h8',
  'performance-appraisal': 'h10',
};

const TITLE_TO_ADMIN_TEMPLATE_ID: Record<string, string> = {
  'student application letter': 'h11',
  'application letter': 'h11',
  'parent consent form (with fee)': 'h2_1',
  'parent consent (with fee)': 'h2_1',
  'parent consent form (without fee)': 'h2_2',
  'parent consent (without fee)': 'h2_2',
  'student consent form (with fee)': 'h2_3',
  'student consent (with fee)': 'h2_3',
  'student consent form (without fee)': 'h2_4',
  'student consent (without fee)': 'h2_4',
  'moa template': 'h3',
  'memorandum of agreement': 'h3',
  'memorandum of agreement (moa)': 'h3',
  'endorsement letter': 'h4',
  'sti ojt endorsement letter': 'h4',
  'proposal letter': 'h12',
  'proposal letter to the industry': 'h12',
  'journal template': 'h5',
  'weekly journal': 'h5',
  'dtr form': 'h6',
  'daily time record': 'h6',
  'daily time record (dtr)': 'h6',
  'training plan form': 'h7',
  'ojt training plan': 'h7',
  'integration paper': 'h8',
  'integration paper template': 'h8',
  'performance appraisal': 'h10',
  'performance appraisal template': 'h10',
};

export function StudentReviewSession() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'instructions' | 'submissions'>('instructions');
  const [requirement, setRequirement] = useState<InstitutionalRequirement | null>(null);
  const [doc, setDoc] = useState<StudentDocument | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [templatePdfUrl, setTemplatePdfUrl] = useState<string>('');
  const templateBlobUrlRef = useRef<string | null>(null);
  const [originalDocxUrl, setOriginalDocxUrl] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Discussion comments state
  const [commentsList, setCommentsList] = useState<{ author: string; msg: string; time: string }[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);

  // File upload & prepare answer state (matching STI eLMS media_1790156986201.png)
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showPrepareAnswer, setShowPrepareAnswer] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Active toolbar formats (visual toggle)
  const [activeFormats, setActiveFormats] = useState<{ [key: string]: boolean }>({});

  const studentName = user?.name || (user as any)?.full_name || 'Student';
  const studentCourse = user?.course || (user as any)?.section || 'BSIT';

  // ── Resolve requirement & load matching submission ──────────────────────
  const loadRequirementAndDocument = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setLoadError(null);

    try {
      // 1. Check if ID matches an institutional requirement directly
      let matchedReq = getRequirementById(id);
      let foundDoc: StudentDocument | null = null;

      if (!matchedReq) {
        // Maybe it's a submission UUID
        try {
          foundDoc = await submissionStorage.getDocumentById(id);
          if (foundDoc) {
            // Find corresponding requirement by doc_type
            matchedReq =
              INSTITUTIONAL_REQUIREMENTS.find(
                r =>
                  foundDoc?.doc_type && (
                    r.name.toLowerCase() === foundDoc.doc_type.toLowerCase() ||
                    r.id.toLowerCase() === foundDoc.doc_type.toLowerCase() ||
                    foundDoc.doc_type.toLowerCase().includes(r.id.toLowerCase())
                  )
              ) || null;
          }
        } catch {
          // not a valid submission ID
        }
      }

      // If matched requirement found, also check if user has an existing submission for it
      if (matchedReq && !foundDoc && user?.id) {
        const { data } = await supabase
          .from('student_documents')
          .select('*')
          .or(`owner_id.eq.${user.id},student_name.eq.${studentName}`)
          .order('created_at', { ascending: false });

        if (data && data.length > 0) {
          foundDoc =
            (data.find(
              (d: StudentDocument) =>
                d.doc_type && (
                  d.doc_type.toLowerCase() === matchedReq!.name.toLowerCase() ||
                  d.doc_type.toLowerCase() === matchedReq!.id.toLowerCase() ||
                  d.doc_type.toLowerCase().includes(matchedReq!.code)
                )
            ) as StudentDocument) || null;
        }
      }

      // Fallback: If no requirement matched at all, generate dynamic one from foundDoc
      if (!matchedReq && foundDoc) {
        matchedReq = {
          id: foundDoc.id,
          code: '01',
          name: foundDoc.doc_type,
          subtitle: 'Institutional Practicum Deliverable',
          moduleTitle: 'OJT Requirements',
          phase: 'before_ojt',
          category: 'Requirement',
          maxScore: 100,
          startDate: 'Aug 27, 2:20 pm',
          dueDate: 'Sep 7, 5:00 pm',
          weight: '10%',
          instructions:
            'Please review the official submission guidelines and ensure your document satisfies institutional evaluation rubrics.',
          rubric: [
            { id: 1, title: 'Compliance & Format', points: 30 },
            { id: 2, title: 'Content & Execution', points: 40 },
            { id: 3, title: 'Official Signatures', points: 30 },
          ],
          maxAttempts: 2,
          allowLate: false,
          editable: true,
        };
      }

      if (!matchedReq) {
        setLoadError('Requirement could not be found.');
        return;
      }

      setRequirement(matchedReq);
      setDoc(foundDoc);

      // Attempt to load official template PDF (from admin storage upload or generated client fallback)
      try {
        const adminTemplateId =
          REQUIREMENT_TO_ADMIN_TEMPLATE_ID[matchedReq.id] ||
          TITLE_TO_ADMIN_TEMPLATE_ID[matchedReq.name.toLowerCase().trim()] ||
          matchedReq.id;

        const candidateKeys = Array.from(new Set([
          adminTemplateId,
          `${adminTemplateId}_pdf_backup`,
          matchedReq.id,
          `${matchedReq.id}_pdf_backup`,
        ]));

        try {
          const metadata = await templateStorage.getMetadata();
          const cleanReqName = matchedReq.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          const matchedMeta = metadata?.find(m => {
            const cleanMetaName = (m.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            return (
              m.id === adminTemplateId ||
              m.id === matchedReq.id ||
              cleanMetaName.includes(cleanReqName) ||
              cleanReqName.includes(cleanMetaName)
            );
          });
          if (matchedMeta?.id && !candidateKeys.includes(matchedMeta.id)) {
            candidateKeys.unshift(matchedMeta.id);
            candidateKeys.push(`${matchedMeta.id}_pdf_backup`);
          }
        } catch {
          // Non-blocking metadata check
        }

        let pdfBuffer: ArrayBuffer | undefined;

        for (const key of candidateKeys) {
          try {
            const buf = await templateStorage.getTemplatePdfBackup(key);
            if (buf && buf.byteLength > 4) {
              const header = new Uint8Array(buf.slice(0, 4));
              if (header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46) {
                pdfBuffer = buf;
                break;
              }
            }
          } catch {
            // Next key
          }

          try {
            const buf = await templateStorage.getTemplateFile(key);
            if (buf && buf.byteLength > 4) {
              const header = new Uint8Array(buf.slice(0, 4));
              if (header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46) {
                pdfBuffer = buf;
                break;
              }
            }
          } catch {
            // Next key
          }
        }

        if (pdfBuffer) {
          if (templateBlobUrlRef.current) {
            URL.revokeObjectURL(templateBlobUrlRef.current);
          }
          const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
          const blobUrl = URL.createObjectURL(blob);
          templateBlobUrlRef.current = blobUrl;
          setTemplatePdfUrl(blobUrl);
        } else {
          // If no custom upload from admin exists yet in durable storage, synthesize the official STI PDF template
          try {
            const generatedBlob = await documentGenerator.generatePdf(matchedReq.name, {
              studentName,
              programName: studentCourse,
              date: new Date().toISOString().split('T')[0],
            });
            if (templateBlobUrlRef.current) {
              URL.revokeObjectURL(templateBlobUrlRef.current);
            }
            const blobUrl = URL.createObjectURL(generatedBlob);
            templateBlobUrlRef.current = blobUrl;
            setTemplatePdfUrl(blobUrl);
          } catch (genErr) {
            console.warn('Fallback PDF generation error:', genErr);
            setTemplatePdfUrl('');
          }
        }
      } catch (err) {
        console.error('Failed to load official template PDF:', err);
        setTemplatePdfUrl('');
      }

      if (foundDoc) {
        if (foundDoc.comments && Array.isArray(foundDoc.comments)) {
          setCommentsList(foundDoc.comments);
        }
        const resolvedPdf = await submissionStorage.resolvePdfUrl(foundDoc);
        setPdfUrl(resolvedPdf);
        const resolvedDocx = await submissionStorage.resolveOriginalDocxUrl(foundDoc);
        setOriginalDocxUrl(resolvedDocx);

        // If user navigated directly to an already-submitted review, default to submissions view
        if (foundDoc.file_path) {
          setActiveTab('submissions');
        }
      }
    } catch (e: any) {
      console.error('Error loading requirement session:', e);
      setLoadError(e?.message || 'Could not load requirement session.');
    } finally {
      setIsLoading(false);
    }
  }, [id, user?.id, studentName, studentCourse]);

  useEffect(() => {
    void loadRequirementAndDocument();
  }, [loadRequirementAndDocument]);

  useEffect(() => {
    return () => {
      if (templateBlobUrlRef.current) {
        URL.revokeObjectURL(templateBlobUrlRef.current);
      }
    };
  }, []);

  // ── Sequential Navigation (< Previous / Continue >) ────────────────────
  const { previous, next } = useMemo(() => {
    if (!requirement) return { previous: null, next: null };
    return getAdjacentRequirements(requirement.id);
  }, [requirement]);

  const handleNavigatePrevious = () => {
    if (previous) {
      navigate(`/student/documents/${previous.id}`);
    } else {
      navigate('/student/documents');
    }
  };

  const handleNavigateNext = () => {
    if (next) {
      navigate(`/student/documents/${next.id}`);
    }
  };

  // ── Edit in Document Editor action ──────────────────────────────────────
  const handleEditInEditor = async () => {
    if (!requirement || !user?.id) return;

    if (!requirement.editable && requirement.redirectTo) {
      navigate(requirement.redirectTo);
      return;
    }

    try {
      // Check existing draft
      const { data: existingDrafts } = await supabase
        .from('editor_drafts')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('template_id', requirement.id)
        .is('deleted_at', null)
        .limit(1);

      if (existingDrafts && existingDrafts.length > 0 && existingDrafts[0].status !== 'locked') {
        navigate(`/student/editor?draft=${existingDrafts[0].id}`);
        return;
      }

      // Find template seed content
      const template = getEditorTemplate(requirement.id);
      const seedContent = template?.seedContent || [{ type: 'p', children: [{ text: '' }] }];

      const draftId = crypto.randomUUID();
      const { error } = await supabase.rpc('create_editor_draft', {
        p_id: draftId,
        p_title: requirement.name,
        p_template_id: requirement.id,
        p_template_name: requirement.name,
        p_phase: requirement.phase,
        p_content: seedContent,
        p_word_count: 0,
      });

      if (error) throw new Error(error.message);
      navigate(`/student/editor?draft=${draftId}`);
    } catch (e: any) {
      console.error('Failed to open draft in editor:', e);
      toast.error('Could not open document editor. Please retry.');
    }
  };

  // ── Handle file selection for attachment / revision (matching STI eLMS media_1790156986201.png) ──
  const handleRevisionFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !requirement) return;

    const validation = await validatePdfFileBytes(file);
    if (!validation.valid) {
      toast.error(validation.error || 'Submissions must be valid PDF documents (max 15 MB).');
      return;
    }

    setPendingFile(file);
    toast.success(`PDF "${file.name}" attached. Click "Save and submit" to route for review.`);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  const handleFilePicked = handleRevisionFilePicked;

  // ── Save and submit for grading action (media_1790156986201.png) ───────────
  const handleSaveAndSubmit = async () => {
    if (!requirement) return;
    const fileToUpload = pendingFile;
    if (!fileToUpload) {
      fileInputRef.current?.click();
      toast.info('Please select a PDF file using "+ Add attachments" to submit.');
      return;
    }

    const pdfCheck = await validatePdfFileBytes(fileToUpload);
    if (!pdfCheck.valid) {
      toast.error(pdfCheck.error || 'Submissions must be valid PDF documents (max 15 MB).');
      return;
    }

    setIsUploading(true);
    try {
      // Check if there is an existing review case awaiting revision for this requirement
      const { data: existingCase } = await supabase
        .from('document_review_cases')
        .select('id, stage, current_revision_id')
        .eq('student_id', user?.id)
        .eq('requirement_id', requirement.id)
        .maybeSingle();

      if (existingCase && ['adviser_revision_required', 'supervisor_revision_required'].includes(existingCase.stage)) {
        const res = await submitReviewRevision({
          caseId: existingCase.id,
          pdfFile: fileToUpload,
          filename: fileToUpload.name,
        });
        toast.success(`Revision ${res.revision_number} submitted for review successfully!`);
      } else {
        const res = await submitReviewDocument({
          requirementId: requirement.id,
          title: requirement.name,
          pdfFile: fileToUpload,
          filename: fileToUpload.name,
        });
        toast.success(`"${fileToUpload.name}" submitted for review successfully!`);
      }

      setPendingFile(null);
      setShowPrepareAnswer(false);
      await loadRequirementAndDocument();
      setActiveTab('submissions');
    } catch (err: any) {
      console.error('Submission failed:', err);
      toast.error(err?.message || 'Failed to submit document for review.');
    } finally {
      setIsUploading(false);
    }
  };

  // ── Save but don't submit yet action (media_1790156986201.png) ─────────────
  const handleSaveDraft = async () => {
    if (!requirement) return;
    const fileToUpload = pendingFile;
    if (!fileToUpload) {
      fileInputRef.current?.click();
      toast.info('Please select an attachment to save.');
      return;
    }

    setIsSavingDraft(true);
    try {
      const updatedDoc = await submissionStorage.uploadSubmission(
        fileToUpload,
        studentName,
        studentCourse,
        requirement.name,
        'medium'
      );
      toast.success(`Draft "${fileToUpload.name}" saved! You can submit it for grading whenever you're ready.`);
      setDoc(updatedDoc);
      const resolvedPdf = await submissionStorage.resolvePdfUrl(updatedDoc);
      setPdfUrl(resolvedPdf);
      const resolvedDocx = await submissionStorage.resolveOriginalDocxUrl(updatedDoc);
      setOriginalDocxUrl(resolvedDocx);
      setPendingFile(null);
      setShowPrepareAnswer(false);
      setActiveTab('submissions');
    } catch (err: any) {
      console.error('Draft save failed:', err);
      toast.error(err?.message || 'Failed to save draft.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  // ── Download Template actions ───────────────────────────────────────────
  const handleDownloadTemplateFile = async (type: 'docx' | 'pdf') => {
    if (!requirement) return;
    try {
      const adminTemplateId =
        REQUIREMENT_TO_ADMIN_TEMPLATE_ID[requirement.id] ||
        TITLE_TO_ADMIN_TEMPLATE_ID[requirement.name.toLowerCase().trim()] ||
        requirement.id;

      const candidateKeys = Array.from(new Set([
        adminTemplateId,
        `${adminTemplateId}_pdf_backup`,
        requirement.id,
        `${requirement.id}_pdf_backup`,
      ]));

      let buffer: ArrayBuffer | undefined;

      if (type === 'pdf') {
        for (const k of candidateKeys) {
          try {
            const buf = await templateStorage.getTemplatePdfBackup(k);
            if (buf && buf.byteLength > 4) {
              const h = new Uint8Array(buf.slice(0, 4));
              if (h[0] === 0x25 && h[1] === 0x50 && h[2] === 0x44 && h[3] === 0x46) {
                buffer = buf;
                break;
              }
            }
          } catch {}

          try {
            const buf = await templateStorage.getTemplateFile(k);
            if (buf && buf.byteLength > 4) {
              const h = new Uint8Array(buf.slice(0, 4));
              if (h[0] === 0x25 && h[1] === 0x50 && h[2] === 0x44 && h[3] === 0x46) {
                buffer = buf;
                break;
              }
            }
          } catch {}
        }

        if (!buffer) {
          const generatedBlob = await documentGenerator.generatePdf(requirement.name, {
            studentName,
            programName: studentCourse,
            date: new Date().toISOString().split('T')[0],
          });
          documentGenerator.downloadBlob(generatedBlob, `${requirement.name}.pdf`);
          toast.success(`Downloaded ${requirement.name}.pdf`);
          return;
        }
      } else {
        for (const k of candidateKeys) {
          try {
            const buf = await templateStorage.getTemplateFile(k);
            if (buf) {
              buffer = buf;
              break;
            }
          } catch {}
        }
      }

      if (!buffer) {
        toast.error(`The official ${type.toUpperCase()} template is not yet available.`);
        return;
      }

      const url = URL.createObjectURL(new Blob([buffer]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${requirement.name}.${type}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error('Download failed. Please retry.');
    }
  };

  // ── Post comment reply ───────────────────────────────────────────────────
  const handlePostComment = async () => {
    if (!commentText.trim()) return;

    setIsPostingComment(true);
    try {
      if (doc?.id) {
        await submissionStorage.postComment(doc.id, studentName, commentText.trim());
      }

      const nowFormatted =
        new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase() +
        ' ' +
        new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      setCommentsList(prev => [
        ...prev,
        {
          author: studentName,
          msg: commentText.trim(),
          time: nowFormatted,
        },
      ]);
      setCommentText('');
      toast.success('Comment posted.');
    } catch (err: any) {
      console.error('Failed to post comment:', err);
      toast.error(err?.message || 'Could not post comment.');
    } finally {
      setIsPostingComment(false);
    }
  };

  const toggleFormat = (format: string) => {
    setActiveFormats(prev => ({ ...prev, [format]: !prev[format] }));
  };

  // ── Loading & Error States ───────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Loading Assignment Details…
        </p>
      </div>
    );
  }

  if (loadError || !requirement) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500" />
        <h2 className="text-lg font-bold text-foreground">
          Assignment Not Found
        </h2>
        <p className="text-xs text-muted-foreground max-w-md">
          {loadError || 'The requested practicum requirement does not exist or has been archived.'}
        </p>
        <button
          onClick={() => navigate('/student/documents')}
          className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold"
        >
          Return to Documents
        </button>
      </div>
    );
  }

  const isApproved = doc?.status === 'Approved';
  const isReturned = doc?.status === 'Revision Required' || doc?.status === 'Returned';
  const isSubmitted = Boolean(doc);
  const submittedTimestamp = doc?.created_at
    ? new Date(doc.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }) +
      ', ' +
      new Date(doc.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase()
    : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Hidden file input for uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.doc"
        onChange={handleFilePicked}
        className="hidden"
      />

      {/* ── Top Navigation Bar (True 3-Column Center Alignment) ───────────── */}
      <div className="grid grid-cols-3 items-center gap-2 pt-1 pb-1">
        {/* Previous Pill Button */}
        <div className="flex items-center justify-start">
          <button
            onClick={handleNavigatePrevious}
            className="bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Previous</span>
          </button>
        </div>

        {/* Centered Module Title (Guaranteed Mathematical Center) */}
        <div className="flex items-center justify-center text-center px-2 min-w-0">
          <span className="font-bold text-xs sm:text-sm text-foreground tracking-tight truncate">
            {requirement.moduleTitle}
          </span>
        </div>

        {/* Right Continue Button */}
        <div className="flex items-center justify-end">
          <button
            onClick={handleNavigateNext}
            disabled={!next}
            className={cn(
              'px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all',
              next
                ? 'bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 cursor-pointer'
                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
            )}
          >
            <span>Continue</span>
            <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* ── Subheader Title & Segmented Pills ────────────────────────────────── */}
      <div className="space-y-2.5 pt-1">
        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
          {requirement.name}
        </h1>

        {/* Segmented Control: [ Instructions ] | [ Submissions ] */}
        <div className="inline-flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full shadow-2xs">
          <button
            onClick={() => setActiveTab('instructions')}
            className={cn(
              'px-3.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer',
              activeTab === 'instructions'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60'
            )}
          >
            Instructions
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={cn(
              'px-3.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer',
              activeTab === 'submissions'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60'
            )}
          >
            Submissions
          </button>
        </div>
      </div>

      {/* ── 2-Column Body Layout ─────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-5 items-start w-full">
        {/* ─── Left Column (fills remaining width) ─────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col space-y-3.5 w-full">
          {activeTab === 'instructions' ? (
            /* Instructions View with Embedded Document Preview Canvas */
            <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
              <div>
                <h2 className="text-base font-extrabold text-foreground tracking-tight">
                  Instructions
                </h2>
                <p className="text-xs sm:text-[13px] text-muted-foreground mt-1.5 leading-relaxed">
                  {requirement.instructions}
                </p>
              </div>

              {/* PDF Document View Frame inside Instructions */}
              <div>
                <DocumentPreviewFrame
                  requirement={requirement}
                  studentName={studentName}
                  templatePdfUrl={templatePdfUrl}
                  pdfUrl={pdfUrl}
                  originalDocxUrl={originalDocxUrl}
                  onDownloadDocx={() => void handleDownloadTemplateFile('docx')}
                  onDownloadPdf={() => void handleDownloadTemplateFile('pdf')}
                />
              </div>

              {/* Action Bar */}
              <div className="pt-4 border-t border-border/80 flex flex-wrap items-center gap-3">
                {requirement.editable ? (
                  <button
                    onClick={handleEditInEditor}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold hover:opacity-90 transition-all shadow-xs cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit in Document Editor</span>
                  </button>
                ) : (
                  <button
                    onClick={() => navigate(requirement.redirectTo || '/student/documents')}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold hover:opacity-90 transition-all shadow-xs cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Go to {requirement.name}</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setActiveTab('submissions');
                    setShowPrepareAnswer(true);
                    fileInputRef.current?.click();
                  }}
                  disabled={isUploading}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted/60 text-xs font-bold transition-all cursor-pointer"
                >
                  {isUploading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  <span>Upload Completed File</span>
                </button>

                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={() => void handleDownloadTemplateFile('docx')}
                    className="p-2 rounded-xl border border-border text-muted-foreground hover:bg-muted/60 hover:text-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Download blank DOCX template"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>DOCX</span>
                  </button>
                  <button
                    onClick={() => void handleDownloadTemplateFile('pdf')}
                    className="p-2 rounded-xl border border-border text-muted-foreground hover:bg-muted/60 hover:text-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Download reference PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Submissions View (Matching STI eLMS media_1790156986201.png before submit, or Document Viewer after submit) */
            (pdfUrl || originalDocxUrl) && !showPrepareAnswer ? (
              <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-base font-extrabold text-foreground tracking-tight">
                    Submissions
                  </h2>
                  <div className="flex items-center gap-2.5">
                    {doc && (
                      <span className="text-xs font-semibold text-foreground bg-muted px-2.5 py-1 rounded-full border border-border">
                        {doc.status}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowPrepareAnswer(true)}
                      className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-primary/5 transition-colors cursor-pointer"
                    >
                      <Plus className="size-3.5 stroke-[2.5]" />
                      <span>Prepare new answer</span>
                    </button>
                  </div>
                </div>

                {/* Adviser Remarks / Feedback Banner */}
                {doc?.adviser_feedback && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-100 flex items-start gap-2">
                    <span className="font-bold shrink-0">Adviser Remarks:</span>
                    <span>{doc.adviser_feedback}</span>
                  </div>
                )}

                {/* Interactive Document Viewer */}
                <div className="w-full h-[720px] rounded-xl overflow-hidden border border-border shadow-inner bg-zinc-950">
                  <EmbedPdfWorkspace
                    pdfUrl={pdfUrl}
                    studentName={studentName}
                    docTitle={requirement.name}
                    originalDocxUrl={originalDocxUrl}
                    readOnly
                  />
                </div>
              </div>
            ) : (
              /* Reference Image 4: Prepare answer before submit (media_1790156986201.png) */
              <div className="bg-card border border-border/80 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
                {/* Header: Prepare answer for [Requirement Name] */}
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                      Prepare answer for {requirement.name}
                    </h2>
                    {(pdfUrl || originalDocxUrl) && (
                      <button
                        type="button"
                        onClick={() => setShowPrepareAnswer(false)}
                        className="text-xs font-medium text-muted-foreground hover:text-foreground underline cursor-pointer"
                      >
                        Cancel & view current submission
                      </button>
                    )}
                  </div>

                  {/* Primary Reference Template File Link */}
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => void handleDownloadTemplateFile('pdf')}
                      className="text-primary hover:underline font-semibold text-xs sm:text-sm inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                      title="Download reference template"
                    >
                      <span>{requirement.name}.pdf</span>
                    </button>
                  </div>

                  {/* Alternative Lab Exercise / Reference Note */}
                  <div className="mt-5 space-y-1">
                    <p className="text-xs sm:text-[13px] text-foreground font-normal">
                      Alternative Lab Exercise if account is unavailable:
                    </p>
                    <button
                      type="button"
                      onClick={() => void handleDownloadTemplateFile('docx')}
                      className="text-primary hover:underline font-semibold text-xs sm:text-sm inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                      title="Download alternative guide"
                    >
                      <span>{requirement.name} (Alternative).pdf</span>
                    </button>
                  </div>
                </div>

                {/* Your answer Section */}
                <div className="pt-2">
                  <h3 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
                    Your answer
                  </h3>
                  <div className="text-xs sm:text-sm text-foreground/80 dark:text-muted-foreground mt-1.5 space-y-0.5">
                    <p>Select the files to upload and then select one of the Save options.</p>
                    <p>The maximum total size of the files is 200 MB.</p>
                  </div>

                  {/* Attached File Preview Card (if file selected) */}
                  {pendingFile && (
                    <div className="mt-4 p-3.5 rounded-xl border border-primary/30 bg-primary/5 flex items-center justify-between gap-3 max-w-lg animate-in fade-in duration-200">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <FileText className="size-4.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-[13px] font-bold text-foreground truncate">
                            {pendingFile.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {(pendingFile.size / 1024).toFixed(1)} KB &middot; Attached & ready to submit
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPendingFile(null)}
                        className="size-7 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 flex items-center justify-center transition-colors cursor-pointer"
                        title="Remove attached file"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  )}

                  {/* Action Buttons styled as System-Aligned Capsule Pills (media_1790156986201.png) */}
                  <div className="mt-5 space-y-3">
                    {/* Row 1: + Add attachments */}
                    <div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="rounded-full px-5 py-2.5 bg-primary text-primary-foreground text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 shadow-xs hover:opacity-90 active:scale-[0.98] transition cursor-pointer"
                      >
                        <Plus className="size-4 stroke-[2.8]" />
                        <span>{pendingFile ? 'Change attachment' : 'Add attachments'}</span>
                      </button>
                    </div>

                    {/* Row 2: + Save and submit for grading & + Save but don't submit yet */}
                    <div className="flex flex-wrap items-center gap-3 pt-0.5">
                      <button
                        type="button"
                        onClick={handleSaveAndSubmit}
                        disabled={isUploading}
                        className="rounded-full px-5 py-2.5 bg-primary text-primary-foreground text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 shadow-xs hover:opacity-90 active:scale-[0.98] transition cursor-pointer"
                      >
                        {isUploading ? (
                          <Loader2 className="size-4 animate-spin text-primary-foreground" />
                        ) : (
                          <Plus className="size-4 stroke-[2.8]" />
                        )}
                        <span>Save and submit for grading</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveDraft}
                        disabled={isUploading || isSavingDraft}
                        className="rounded-full px-5 py-2.5 bg-primary text-primary-foreground text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 shadow-xs hover:opacity-90 active:scale-[0.98] transition cursor-pointer"
                      >
                        {isSavingDraft ? (
                          <Loader2 className="size-4 animate-spin text-primary-foreground" />
                        ) : (
                          <Plus className="size-4 stroke-[2.8]" />
                        )}
                        <span>Save but don&apos;t submit yet</span>
                      </button>
                    </div>

                    {/* Secondary alternative: Edit in online document editor */}
                    {requirement.editable && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={handleEditInEditor}
                          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Edit3 size={13} />
                          <span>Or draft directly online in the Document Editor &rarr;</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          )}
        </div>

        {/* ─── Right Column (tight compact sidebar: 290px - 310px) ────────────────────────────── */}
        <div className="w-full lg:w-[290px] xl:w-[310px] shrink-0 flex flex-col space-y-3">
          {/* Card 1: Assignment Details matching media_1790151615061.png */}
          <div className="bg-card border border-border/80 rounded-2xl p-3.5 sm:p-4 shadow-xs">
            <h3 className="text-sm font-bold text-foreground tracking-tight pb-1">
              Assignment
            </h3>

            <div className="divide-y divide-border/60 text-xs text-foreground">
              <div className="py-2 flex items-center gap-2.5">
                <div className="size-3.5 text-muted-foreground flex items-center justify-center shrink-0">
                  <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                    <polyline points="9 8 12 5 15 8" />
                    <line x1="12" y1="5" x2="12" y2="15" />
                  </svg>
                </div>
                <span className="font-medium">Type: Dropbox</span>
              </div>

              <div className="py-2 flex items-center gap-2.5">
                <div className="size-3.5 text-muted-foreground flex items-center justify-center shrink-0">
                  <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="2" y="16" width="3" height="5" rx="1" />
                    <rect x="7" y="12" width="3" height="9" rx="1" />
                    <rect x="12" y="8" width="3" height="13" rx="1" />
                    <rect x="17" y="4" width="3" height="17" rx="1" />
                  </svg>
                </div>
                <span className="font-medium">Max score: {requirement.maxScore}</span>
              </div>

              <div className="py-2 flex items-center gap-2.5">
                <div className="size-3.5 text-muted-foreground flex items-center justify-center shrink-0">
                  <Calendar className="size-3.5 stroke-[2]" />
                </div>
                <span className="font-medium">Start: {requirement.startDate}</span>
              </div>

              <div className="py-2 flex items-center gap-2.5">
                <div className="size-3.5 text-muted-foreground flex items-center justify-center shrink-0">
                  <Calendar className="size-3.5 stroke-[2]" />
                </div>
                <span className="font-medium">Due: {requirement.dueDate}</span>
              </div>

              <div className="py-2 flex items-center gap-2.5">
                <div className="size-3.5 text-rose-500 flex items-center justify-center shrink-0">
                  <X className="size-3.5 stroke-[2.5]" />
                </div>
                <span className="text-muted-foreground">No more submissions are allowed</span>
              </div>
            </div>
          </div>

          {/* Card 2: Score matching media_1790151615061.png */}
          <div className="bg-card border border-border/80 rounded-2xl p-3.5 sm:p-4 shadow-xs">
            <h3 className="text-sm font-bold text-foreground tracking-tight pb-1">
              Score
            </h3>
            <div className="py-1.5 flex items-center gap-2 text-xs text-foreground">
              {isApproved ? (
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <ShieldCheck className="size-3.5 stroke-[2.5]" />
                  <span>{requirement.maxScore} / {requirement.maxScore} (Approved)</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground font-medium">
                  <Clock className="size-3.5 text-muted-foreground shrink-0 stroke-[2]" />
                  <span>Waiting for grade</span>
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Submission matching media_1790151615061.png */}
          <div className="bg-card border border-border/80 rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-1.5">
            <div className="flex items-center justify-between pb-0.5">
              <h3 className="text-sm font-bold text-foreground tracking-tight">
                Submission
              </h3>
              {activeTab === 'instructions' && (
                <button
                  onClick={() => setActiveTab('submissions')}
                  className="text-xs text-primary hover:underline font-semibold cursor-pointer"
                >
                  details
                </button>
              )}
            </div>

            <div className="space-y-1 text-xs text-muted-foreground pt-0.5">
              <div className="flex justify-between items-center">
                <span>Submitted:</span>
                <span className="font-medium text-foreground">{submittedTimestamp || 'Aug 27, 3:10 pm'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Attempts:</span>
                <span className="font-medium text-foreground">{isSubmitted ? '1' : '0'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Max. attempts:</span>
                <span className="font-medium text-foreground">{requirement.maxAttempts}</span>
              </div>
              <div className="flex justify-between items-center pt-0.5">
                <span>Allow late submissions:</span>
                <span className="font-medium text-foreground inline-flex items-center gap-0.5">
                  No
                  <ChevronDown className="size-3 text-muted-foreground stroke-[2.5]" />
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Comments discussion box - unconditionally visible on Instructions & Submissions */}
          <div className="bg-card border border-border/80 rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-3">
            <div>
              <h3 className="text-sm font-bold text-foreground tracking-tight">
                Comments
              </h3>
              <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                {isSubmitted ? `Submission 1 @ ${submittedTimestamp || '3:10 pm Aug 27, 2026'}` : 'Discussion & Inquiries'}
              </p>
            </div>

            {/* Rich Comment Input Box with Formatting Toolbar */}
            <div className="border border-border rounded-lg overflow-hidden bg-card focus-within:border-primary/60 transition-colors">
              {/* Toolbar matching Reference: B I U Tx link file img mic video */}
              <div className="flex items-center gap-0.5 px-1.5 py-1 border-b border-border bg-muted/40 text-muted-foreground flex-wrap">
                <button
                  type="button"
                  onClick={() => toggleFormat('bold')}
                  className={cn(
                    'size-5 rounded flex items-center justify-center text-xs font-bold transition-colors cursor-pointer',
                    activeFormats.bold ? 'bg-muted text-foreground' : 'hover:bg-muted/80'
                  )}
                  title="Bold"
                >
                  <Bold className="size-3" />
                </button>
                <button
                  type="button"
                  onClick={() => toggleFormat('italic')}
                  className={cn(
                    'size-5 rounded flex items-center justify-center text-xs font-serif italic transition-colors cursor-pointer',
                    activeFormats.italic ? 'bg-muted text-foreground' : 'hover:bg-muted/80'
                  )}
                  title="Italic"
                >
                  <Italic className="size-3" />
                </button>
                <button
                  type="button"
                  onClick={() => toggleFormat('underline')}
                  className={cn(
                    'size-5 rounded flex items-center justify-center text-xs underline transition-colors cursor-pointer',
                    activeFormats.underline ? 'bg-muted text-foreground' : 'hover:bg-muted/80'
                  )}
                  title="Underline"
                >
                  <Underline className="size-3" />
                </button>
                <button
                  type="button"
                  onClick={() => toggleFormat('strike')}
                  className={cn(
                    'size-5 rounded flex items-center justify-center text-xs transition-colors cursor-pointer',
                    activeFormats.strike ? 'bg-muted text-foreground' : 'hover:bg-muted/80'
                  )}
                  title="Strikethrough"
                >
                  <Strikethrough className="size-3" />
                </button>
                <div className="w-px h-3 bg-border mx-0.5" />
                <button
                  type="button"
                  onClick={() => toast.info('Link insertion dialog')}
                  className="size-5 rounded flex items-center justify-center hover:bg-muted/80 transition-colors cursor-pointer"
                  title="Insert link"
                >
                  <Link2 className="size-3" />
                </button>
                <button
                  type="button"
                  onClick={() => toast.info('Document attachment')}
                  className="size-5 rounded flex items-center justify-center hover:bg-muted/80 transition-colors cursor-pointer"
                  title="Attach file"
                >
                  <FileIcon className="size-3" />
                </button>
                <button
                  type="button"
                  onClick={() => toast.info('Image attachment')}
                  className="size-5 rounded flex items-center justify-center hover:bg-muted/80 transition-colors cursor-pointer"
                  title="Attach image"
                >
                  <ImageIcon className="size-3" />
                </button>
                <button
                  type="button"
                  onClick={() => toast.info('Voice comment recording')}
                  className="size-5 rounded flex items-center justify-center hover:bg-muted/80 transition-colors cursor-pointer"
                  title="Record audio"
                >
                  <Mic className="size-3" />
                </button>
                <button
                  type="button"
                  onClick={() => toast.info('Video recording')}
                  className="size-5 rounded flex items-center justify-center hover:bg-muted/80 transition-colors cursor-pointer"
                  title="Record video"
                >
                  <Video className="size-3" />
                </button>
              </div>

              {/* Textarea */}
              <textarea
                rows={2}
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Type comments or notes for your adviser here…"
                className="w-full p-2 text-xs text-foreground placeholder:text-muted-foreground bg-transparent resize-none focus:outline-none"
              />
            </div>

            {/* Post Action Button on bottom left */}
            <div>
              <button
                onClick={handlePostComment}
                disabled={isPostingComment || !commentText.trim()}
                className={cn(
                  'text-xs font-semibold transition-colors cursor-pointer',
                  commentText.trim()
                    ? 'text-primary hover:underline'
                    : 'text-muted-foreground cursor-not-allowed'
                )}
              >
                {isPostingComment ? 'Posting…' : 'Post'}
              </button>
            </div>

            {/* Existing Comments Discussion Thread */}
            {commentsList.length > 0 && (
              <div className="space-y-2 pt-2.5 border-t border-border max-h-48 overflow-y-auto pr-1">
                {commentsList.map((c, i) => {
                  const isSelf =
                    c.author.toLowerCase() === studentName.toLowerCase() ||
                    c.author.toLowerCase() === 'student';
                  return (
                    <div
                      key={i}
                      className={cn(
                        'p-2 rounded-lg border text-xs space-y-1',
                        isSelf
                          ? 'bg-primary/5 border-primary/20 ml-2'
                          : 'bg-muted/40 border-border mr-2'
                      )}
                    >
                      <div className="flex justify-between items-center gap-1">
                        <span className="font-bold text-foreground text-[11px]">
                          {c.author}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0">{c.time}</span>
                      </div>
                      <p className="text-foreground leading-relaxed text-[11px]">
                        {c.msg}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Document Template Preview Frame Component ─────────────────────────────

function DocumentPreviewFrame({
  requirement,
  studentName,
  templatePdfUrl,
  pdfUrl,
  originalDocxUrl,
  onDownloadDocx,
  onDownloadPdf,
}: {
  requirement: InstitutionalRequirement;
  studentName: string;
  templatePdfUrl?: string;
  pdfUrl?: string;
  originalDocxUrl?: string;
  onDownloadDocx: () => void;
  onDownloadPdf: () => void;
}) {
  const [zoom, setZoom] = useState(100);
  const template = useMemo(() => getEditorTemplate(requirement.id), [requirement.id]);

  const activePdfUrl = templatePdfUrl || pdfUrl;

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card flex flex-col shadow-xs">
      {/* Top Document Preview Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-muted/40 border-b border-border text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="font-semibold text-foreground truncate max-w-[280px]">
            {requirement.name}.pdf
          </span>
          <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border/80 font-medium shrink-0">
            Document Template
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onDownloadPdf}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[11px] font-bold hover:opacity-90 transition-all cursor-pointer shadow-2xs"
            title="Download PDF Template"
          >
            <Download className="w-3 h-3" />
            <span>Download PDF</span>
          </button>
          {requirement.editable && (
            <button
              onClick={onDownloadDocx}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border text-foreground hover:bg-muted text-[11px] font-semibold transition-all cursor-pointer"
              title="Download Word DOCX Template"
            >
              <Download className="w-3 h-3" />
              <span>DOCX</span>
            </button>
          )}
        </div>
      </div>

      {/* Document Body Area */}
      <div className="h-[580px] w-full overflow-hidden bg-zinc-950 flex flex-col relative">
        {activePdfUrl ? (
          <div className="w-full h-full flex-1 min-h-0 relative">
            <EmbedPdfWorkspace
              pdfUrl={activePdfUrl}
              studentName={studentName}
              docTitle={requirement.name}
              originalDocxUrl={originalDocxUrl}
              readOnly
            />
          </div>
        ) : (
          /* High-Fidelity Paper Document Sheet */
          <div
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
            className="w-full max-w-[640px] bg-white text-zinc-900 shadow-md border border-zinc-200 rounded-sm p-8 sm:p-10 font-serif text-[12px] leading-relaxed space-y-3 transition-transform"
          >
            {/* Letterhead */}
            <div className="text-center pb-2 border-b border-zinc-200 space-y-0.5">
              <div className="font-sans font-bold text-xs text-blue-900 tracking-wider uppercase">
                STI COLLEGE MARIKINA
              </div>
              <div className="text-[11px] text-zinc-500 font-sans">
                Office of the Practicum & On-the-Job Training Coordinator
              </div>
            </div>

            {/* Document Title / Date */}
            <div className="pt-2 text-right text-zinc-500 font-sans text-[11px]">
              Date: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>

            {/* Render template seed nodes if available */}
            {template && template.seedContent && template.seedContent.length > 0 ? (
              <div className="space-y-2 pt-1 text-zinc-800">
                {template.seedContent.map((node: any, idx: number) => {
                  if (node.type === 'h1' || node.type === 'h2') {
                    return (
                      <h4
                        key={idx}
                        className={cn(
                          'font-bold font-sans tracking-tight text-zinc-900',
                          node.align === 'center' ? 'text-center' : 'text-left',
                          node.type === 'h1' ? 'text-sm uppercase' : 'text-xs'
                        )}
                      >
                        {node.children?.map((c: any) => c.text).join('')}
                      </h4>
                    );
                  }

                  if (node.type === 'table') {
                    return (
                      <div key={idx} className="my-2 border border-zinc-300 rounded overflow-hidden">
                        <table className="w-full text-[11px] text-left">
                          <tbody>
                            {node.children?.map((tr: any, rIdx: number) => (
                              <tr key={rIdx} className="border-b border-zinc-200">
                                {tr.children?.map((td: any, cIdx: number) => (
                                  <td key={cIdx} className="p-1.5 border-r border-zinc-200">
                                    {td.children?.map((pNode: any) =>
                                      pNode.children?.map((c: any) => c.text).join('')
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  }

                  if (node.type === 'ul' || node.type === 'ol') {
                    return (
                      <ul key={idx} className="list-disc list-inside space-y-1 pl-2 text-[11px]">
                        {node.children?.map((li: any, lIdx: number) => (
                          <li key={lIdx}>
                            {li.children?.[0]?.children?.map((c: any) => c.text).join('')}
                          </li>
                        ))}
                      </ul>
                    );
                  }

                  // Standard paragraph
                  const isCenter = node.align === 'center';
                  return (
                    <p
                      key={idx}
                      className={cn(
                        'leading-relaxed',
                        isCenter ? 'text-center font-semibold' : 'text-justify'
                      )}
                    >
                      {node.children?.map((child: any, cIdx: number) => {
                        if (child.underline) {
                          return (
                            <span
                              key={cIdx}
                              className="underline underline-offset-4 font-semibold text-blue-900 bg-blue-50/50 px-1 rounded"
                            >
                              {child.text}
                            </span>
                          );
                        }
                        if (child.bold) {
                          return (
                            <strong key={cIdx} className="font-bold text-zinc-900">
                              {child.text}
                            </strong>
                          );
                        }
                        return child.text;
                      })}
                    </p>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <p className="font-semibold text-zinc-900">Subject: {requirement.name}</p>
                <p>Dear Sir/Ma'am,</p>
                <p className="text-justify leading-relaxed">
                  I, <span className="underline underline-offset-4 font-bold">{studentName}</span>, a student of STI College Marikina, am formally submitting this document in compliance with institutional requirements for the On-the-Job Training practicum program.
                </p>
                <p className="text-justify leading-relaxed">
                  I affirm that all information contained herein has been prepared in accordance with the prescribed guidelines and academic standards of the institution.
                </p>
                <div className="pt-6 space-y-1">
                  <p>Respectfully yours,</p>
                  <div className="font-bold pt-4 underline underline-offset-4">{studentName}</div>
                  <div className="text-zinc-500 font-sans text-[11px]">Student Trainee</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
