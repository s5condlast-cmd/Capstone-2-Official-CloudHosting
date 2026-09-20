/**
 * useStudentDashboard.ts
 * Custom hook providing authoritative data and state for the Student Dashboard.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { supabase } from '@/src/lib/supabase';
import {
  PracticumPhase,
  StudentProfileData,
  StudentDashboardViewModel,
  PracticumContact,
} from './studentDashboard.types';
import {
  deriveRequirements,
  deriveNextPriorityAction,
  deriveWeeklyAttendance,
  deriveFeedbackStream,
  RawSubmission,
  RawDraft,
} from './studentDashboard.selectors';

export function useStudentDashboard(): StudentDashboardViewModel {
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [profileData, setProfileData] = useState<StudentProfileData>({
    id: user?.id || '',
    name: user?.name || (user as any)?.full_name || 'Student Intern',
    email: user?.email || '',
    studentId: user?.studentId || '2023-010482',
    program: user?.course || 'BS Information Technology',
    section: user?.section || 'IT401',
    companyName: 'Accenture Philippines',
    supervisorName: 'Engr. Peter Ramirez',
    studentRole: 'Software Engineering Intern',
    companyLocation: 'Cybergate Tower 1, Mandaluyong City',
    adviserName: 'Prof. Sarah Jenkins',
    profilePhase: 'before_ojt',
    renderedHours: 142.5,
    targetHours: 460.0,
  });

  const [submissions, setSubmissions] = useState<RawSubmission[]>([]);
  const [drafts, setDrafts] = useState<RawDraft[]>([]);
  const [dtrEntries, setDtrEntries] = useState<Array<{ entry_date?: string; total_hours?: number; status?: string }>>([]);
  const [activePhaseTab, setActivePhaseTab] = useState<PracticumPhase>('before_ojt');

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    setError(null);

    try {
      // 1. Fetch Student Profile & Practicum Info
      let phase: PracticumPhase = 'before_ojt';
      let program = user?.course || 'BS Information Technology';
      let section = user?.section || 'IT401';
      let studentId = user?.studentId || '2023-010482';
      let companyName = 'Accenture Philippines';
      let supervisorName = 'Engr. Peter Ramirez';
      let studentRole = 'Software Engineering Intern';
      let companyLocation = 'Cybergate Tower 1, Mandaluyong City';
      let adviserName = 'Prof. Sarah Jenkins';
      let renderedHours = 142.5;
      let targetHours = 460.0;

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profile) {
          if (profile.course) program = profile.course;
          if (profile.section) section = profile.section;
          if (profile.student_id) studentId = profile.student_id;
          if (profile.company_name) companyName = profile.company_name;
          if (profile.supervisor_name) supervisorName = profile.supervisor_name;
          if (profile.adviser_name) adviserName = profile.adviser_name;
          if (profile.company_location) companyLocation = profile.company_location;
          if (profile.student_role) studentRole = profile.student_role;
          if (profile.rendered_hours !== undefined) renderedHours = Number(profile.rendered_hours) || 0;
          if (profile.required_hours !== undefined) targetHours = Number(profile.required_hours) || 460;
          if (profile.current_phase) {
            const p = String(profile.current_phase).toLowerCase();
            if (p.includes('in')) phase = 'in_ojt';
            else if (p.includes('final')) phase = 'final';
            else phase = 'before_ojt';
          }
        }
      } catch (err) {
        console.warn('Profile fetch note:', err);
      }

      setProfileData({
        id: user.id,
        name: user.name || (user as any)?.full_name || 'Student Intern',
        email: user.email || '',
        studentId,
        program,
        section,
        companyName,
        supervisorName,
        studentRole,
        companyLocation,
        adviserName,
        profilePhase: phase,
        renderedHours,
        targetHours,
      });

      setActivePhaseTab(phase);

      // 2. Fetch Submissions (from Supabase student_documents table)
      const fetchedSubs: RawSubmission[] = [];
      try {
        const { data: docs } = await supabase
          .from('student_documents')
          .select('id, doc_type, status, created_at, adviser_feedback, file_path')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false });

        if (docs && docs.length > 0) {
          fetchedSubs.push(
            ...docs.map((d: any) => ({
              id: d.id,
              doc_type: d.doc_type,
              status: d.status,
              created_at: d.created_at,
              adviser_feedback: d.adviser_feedback,
              file_url: d.file_path,
            }))
          );
        }
      } catch (err) {
        console.warn('Student documents query note:', err);
      }

      setSubmissions(fetchedSubs);

      // 3. Fetch Drafts Index (from Supabase editor_drafts with local fallback)
      try {
        const { data: draftsData } = await supabase
          .from('editor_drafts')
          .select('id, title, template_id, template_name, phase, updated_at')
          .eq('owner_id', user.id)
          .order('updated_at', { ascending: false });

        if (draftsData && draftsData.length > 0) {
          setDrafts(
            draftsData.map((e: any) => ({
              id: e.id,
              title: e.title,
              template_id: e.template_id,
              template_name: e.template_name,
              phase: e.phase,
              updated_at: e.updated_at,
            }))
          );
        } else {
          // Local fallback if offline/mock
          const raw = localStorage.getItem(`user-drafts:${user.id}`);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) setDrafts(parsed);
          }
        }
      } catch (err) {
        console.warn('Draft index note:', err);
      }

      // 4. Fetch Attendance Entries (DTR)
      try {
        const { data: dtr } = await supabase
          .from('dtr_entries')
          .select('entry_date, total_hours, status')
          .eq('student_id', user.id);

        if (dtr && dtr.length > 0) {
          setDtrEntries(dtr);
        }
      } catch (err) {
        console.warn('DTR entries note:', err);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived Values
  const allRequirements = useMemo(() => {
    return deriveRequirements(profileData.profilePhase, submissions, drafts);
  }, [profileData.profilePhase, submissions, drafts]);

  const phaseRequirements = useMemo(() => {
    return allRequirements.filter(r => r.phase === activePhaseTab);
  }, [allRequirements, activePhaseTab]);

  const beforeItems = useMemo(() => allRequirements.filter(r => r.phase === 'before_ojt'), [allRequirements]);
  const inItems = useMemo(() => allRequirements.filter(r => r.phase === 'in_ojt'), [allRequirements]);
  const finalItems = useMemo(() => allRequirements.filter(r => r.phase === 'final'), [allRequirements]);

  const beforeDone = useMemo(() => beforeItems.filter(r => r.status === 'done').length, [beforeItems]);
  const inDone = useMemo(() => inItems.filter(r => r.status === 'done').length, [inItems]);
  const finalDone = useMemo(() => finalItems.filter(r => r.status === 'done').length, [finalItems]);

  const totalApproved = useMemo(() => allRequirements.filter(r => r.status === 'done').length, [allRequirements]);
  const totalPending = useMemo(() => allRequirements.filter(r => r.status === 'pending').length, [allRequirements]);
  const totalRevision = useMemo(() => allRequirements.filter(r => r.status === 'revision' || r.status === 'returned').length, [allRequirements]);

  const hoursPercent = useMemo(() => {
    const p = Math.min(100, Math.round((profileData.renderedHours / profileData.targetHours) * 100));
    return isNaN(p) ? 0 : p;
  }, [profileData.renderedHours, profileData.targetHours]);

  const hoursRemaining = useMemo(() => {
    return Math.max(0, profileData.targetHours - profileData.renderedHours);
  }, [profileData.renderedHours, profileData.targetHours]);

  const nextAction = useMemo(() => {
    return deriveNextPriorityAction(
      allRequirements,
      profileData.profilePhase,
      profileData.renderedHours,
      profileData.targetHours,
      Boolean(profileData.companyName && profileData.companyName !== 'Pending Placement')
    );
  }, [allRequirements, profileData]);

  const { days: weeklyAttendance, totalWeeklyHours: weeklyTotalHours } = useMemo(() => {
    return deriveWeeklyAttendance(dtrEntries);
  }, [dtrEntries]);

  const feedbackList = useMemo(() => {
    return deriveFeedbackStream(submissions);
  }, [submissions]);

  const contacts = useMemo<PracticumContact[]>(() => {
    return [
      {
        id: 'adviser',
        name: profileData.adviserName,
        role: 'Practicum Adviser',
        initials: 'SJ',
        company: 'STI College Marikina',
      },
      {
        id: 'supervisor',
        name: profileData.supervisorName,
        role: 'Corporate Supervisor',
        initials: 'PR',
        company: profileData.companyName,
      },
      {
        id: 'coordinator',
        name: 'Dr. Arthur Vance',
        role: 'OJT Coordinator',
        initials: 'AV',
        company: 'Academic Affairs',
      },
    ];
  }, [profileData]);

  return {
    profile: profileData,
    activePhaseTab,
    hoursPercent,
    hoursRemaining,
    totalApproved,
    totalPending,
    totalRevision,
    totalRequirements: allRequirements.length,
    phaseRequirements,
    beforeDone,
    beforeTotal: beforeItems.length,
    inDone,
    inTotal: inItems.length,
    finalDone,
    finalTotal: finalItems.length,
    nextAction,
    weeklyAttendance,
    weeklyTotalHours,
    feedbackList,
    contacts,
    isLoading,
    error,
    refresh: loadData,
    setActivePhaseTab,
  };
}
