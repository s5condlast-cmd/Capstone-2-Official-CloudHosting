import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Agentation } from 'agentation';
import { Toaster } from 'sonner';
import { LandingPage } from './pages/public/LandingPage';
import { ForgotPassword } from './pages/public/ForgotPassword';
import { Login } from './pages/Login';
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { Monitoring } from './pages/admin/Monitoring';
import { PhaseGuard } from './components/layout/PhaseGuard';
import { UserManagement } from './pages/admin/UserManagement';
import { DocumentVerification } from './pages/admin/DocumentVerification';
import { Templates } from './pages/admin/Templates';
import { Reports } from './pages/admin/Reports';
import { Settings } from './pages/admin/Settings';
import { Announcements } from './pages/admin/Announcements';
import { CompanyManagement } from './pages/admin/CompanyManagement';
import { AdviserDashboard } from './pages/adviser/AdviserDashboard';
import { StudentDashboard } from './pages/student/StudentDashboard';

import { DTR } from './pages/student/DTR';
import { WeeklyJournal } from './pages/student/WeeklyJournal';
import { StudentApplicationLetter } from './pages/student/StudentApplicationLetter';
import { MemorandumOfAgreement } from './pages/student/MemorandumOfAgreement';
import { STIOJTEndorsementLetter } from './pages/student/STIOJTEndorsementLetter';
import { LetterOfConsent } from './pages/student/LetterOfConsent';
import { PerformanceAppraisal } from './pages/student/PerformanceAppraisal';
import { OJTTrainingPlan } from './pages/student/OJTTrainingPlan';
import { IntegrationPaper } from './pages/student/IntegrationPaper';
import { ProposalLetterToTheIndustry } from './pages/student/ProposalLetterToTheIndustry';
import { ReviewDocs } from './pages/adviser/ReviewDocs';
import { Endorsements } from './pages/adviser/Endorsements';
import { ClassReports } from './pages/adviser/ClassReports';
import { CompanyEvaluations } from './pages/adviser/CompanyEvaluations';
import { AdviserComparison } from './pages/adviser/AdviserComparison';
import { MOAReview } from './pages/adviser/MOAReview';
import { DocumentReviewSession } from './pages/adviser/DocumentReviewSession';
import { AdviserDocumentEditor } from './pages/adviser/AdviserDocumentEditor';
import { AdminReviewSession } from './pages/admin/AdminReviewSession';
import { AdminDocumentEditor } from './pages/admin/AdminDocumentEditor';
import { MyStudents } from './pages/adviser/MyStudents';
import { Notifications } from './pages/Notifications';

import { SupervisorDashboard } from './pages/supervisor/SupervisorDashboard';
import { MyInterns } from './pages/supervisor/MyInterns';
import { DTRApproval } from './pages/supervisor/DTRApproval';
import { EvaluateIntern } from './pages/supervisor/EvaluateIntern';
import { InternshipCompletion } from './pages/supervisor/InternshipCompletion';

import { Profile } from './pages/Profile';
import { User, Role } from './types';

// Mock simple sub-pages for this prototype
const Placeholder = ({ name }: { name: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] border border-dashed border-zinc-200 dark:border-zinc-800">
    <h2 className="text-4xl font-semibold uppercase text-zinc-300">{name}</h2>
    <p className="text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wide mt-2">Prototype Implementation Pending</p>
  </div>
);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize Theme
    const savedTheme = localStorage.getItem('app-theme');
    if (savedTheme && savedTheme !== 'default') {
      document.documentElement.classList.add(savedTheme);
    }

    try {
      const saved = localStorage.getItem('practicum_session');
      if (saved) {
        setUser(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to parse session', e);
      localStorage.removeItem('practicum_session');
    }
    setLoading(false);
  }, []);

  const handleLogin = (role: Role, username: string) => {
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      username,
      name: role === 'student' ? 'John Dwayne B. Guaniso' : role.charAt(0).toUpperCase() + role.slice(1) + ' User',
      role,
      email: `${username}@practicum.edu`
    };
    localStorage.setItem('practicum_session', JSON.stringify(newUser));
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('practicum_session');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center animate-pulse">
              <svg className="w-8 h-8 text-white dark:text-zinc-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
            <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-blue-500 rounded-full border-4 border-zinc-50 dark:border-zinc-950 animate-bounce" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Practicum Portal</h2>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-[bounce_1s_infinite_0ms]" />
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-[bounce_1s_infinite_200ms]" />
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-[bounce_1s_infinite_400ms]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster position="bottom-right" toastOptions={{
        className: 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-none font-sans font-medium',
        style: { borderRadius: '8px' }
      }} />
      <Routes>
        <Route path="/" element={<LandingPage userRole={user?.role} />} />
        <Route 
          path="/login" 
          element={!user ? <Login onLogin={handleLogin} /> : <Navigate to={`/${user.role}`} replace />} 
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute user={user} allowedRole="admin">
            <MainLayout user={user} onLogout={handleLogout} />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="monitoring" element={<Monitoring />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="companies" element={<CompanyManagement />} />
          <Route path="documents" element={<DocumentVerification />} />
          <Route path="documents/:id" element={<AdminReviewSession />} />
          <Route path="documents/:id/edit" element={<AdminDocumentEditor />} />
          <Route path="templates" element={<Templates />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="profile" element={<Profile user={user} />} />
        </Route>

        {/* Adviser Routes */}
        <Route path="/adviser" element={
          <ProtectedRoute user={user} allowedRole="adviser">
            <MainLayout user={user} onLogout={handleLogout} />
          </ProtectedRoute>
        }>
          <Route index element={<AdviserDashboard />} />
          <Route path="students" element={<MyStudents />} />
          <Route path="endorsements" element={<Endorsements />} />
          <Route path="moa" element={<MOAReview />} />
          <Route path="review" element={<ReviewDocs />} />
          <Route path="review/:id" element={<DocumentReviewSession />} />
          <Route path="review/:id/edit" element={<AdviserDocumentEditor />} />
          <Route path="evaluations" element={<CompanyEvaluations />} />
          <Route path="comparison" element={<AdviserComparison />} />
          <Route path="class-reports" element={<ClassReports />} />
          <Route path="notifications" element={<Notifications user={user} />} />
          <Route path="profile" element={<Profile user={user} />} />
        </Route>

        {/* Student Routes */}
        <Route path="/student" element={
          <ProtectedRoute user={user} allowedRole="student">
            <MainLayout user={user} onLogout={handleLogout} />
          </ProtectedRoute>
        }>
          <Route index element={<StudentDashboard />} />
          <Route path="application-letter" element={<PhaseGuard phase="beforeOjt"><StudentApplicationLetter /></PhaseGuard>} />
          <Route path="consent" element={<PhaseGuard phase="beforeOjt"><LetterOfConsent /></PhaseGuard>} />
          <Route path="moa" element={<PhaseGuard phase="beforeOjt"><MemorandumOfAgreement /></PhaseGuard>} />
          <Route path="endorsement" element={<PhaseGuard phase="beforeOjt"><STIOJTEndorsementLetter /></PhaseGuard>} />
          <Route path="proposal" element={<PhaseGuard phase="beforeOjt"><ProposalLetterToTheIndustry /></PhaseGuard>} />
          <Route path="dtr" element={<PhaseGuard phase="inOjt"><DTR /></PhaseGuard>} />
          <Route path="journal" element={<PhaseGuard phase="inOjt"><WeeklyJournal /></PhaseGuard>} />
          <Route path="training-plan" element={<PhaseGuard phase="inOjt"><OJTTrainingPlan /></PhaseGuard>} />
          <Route path="evaluation" element={<PhaseGuard phase="finals"><PerformanceAppraisal /></PhaseGuard>} />
          <Route path="completion" element={<PhaseGuard phase="finals"><IntegrationPaper /></PhaseGuard>} />
          <Route path="progress" element={<Placeholder name="Progress Tracker" />} />
          <Route path="notifications" element={<Notifications user={user} />} />
          <Route path="profile" element={<Profile user={user} />} />
        </Route>

        {/* Supervisor Routes */}
        <Route path="/supervisor" element={
          <ProtectedRoute user={user} allowedRole="supervisor">
            <MainLayout user={user} onLogout={handleLogout} />
          </ProtectedRoute>
        }>
          <Route index element={<SupervisorDashboard />} />
          <Route path="interns" element={<MyInterns />} />
          <Route path="dtr" element={<DTRApproval />} />
          <Route path="evaluate" element={<EvaluateIntern />} />
          <Route path="completion" element={<InternshipCompletion />} />
          <Route path="notifications" element={<Notifications user={user} />} />
          <Route path="profile" element={<Profile user={user} />} />
        </Route>

        <Route path="*" element={<Navigate to={user ? `/${user.role}` : "/"} replace />} />
      </Routes>
      {/* @ts-ignore */}
      {import.meta.env.DEV && <Agentation />}
    </BrowserRouter>
  );
}
