import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { LandingPage } from './pages/public/LandingPage';
import { ForgotPassword } from './pages/public/ForgotPassword';
import { ResetPassword } from './pages/public/ResetPassword';
import { Login } from './pages/public/Login';
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

import { StudentDocumentRepository } from './pages/student/StudentDocumentRepository';
import { StudentDocumentEditor } from './pages/student/StudentDocumentEditor';
import { StudentReviewSession } from './pages/student/StudentReviewSession';
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
import { Notifications } from './pages/shared/Notifications';
import { CalendarPage } from './pages/shared/CalendarPage';

import { SupervisorDashboard } from './pages/supervisor/SupervisorDashboard';
import { MyInterns } from './pages/supervisor/MyInterns';
import { DTRApproval } from './pages/supervisor/DTRApproval';
import { WeeklyJournalReview } from './pages/supervisor/WeeklyJournalReview';
import { InternshipCompletion } from './pages/supervisor/InternshipCompletion';

import { Profile } from './pages/shared/Profile';
import { StudentReviewCenterPage } from './pages/student/StudentReviewCenterPage';
import { SupervisorReviewCenterPage } from './pages/supervisor/SupervisorReviewCenterPage';
import { AdviserReviewCenterPage } from './pages/adviser/AdviserReviewCenterPage';
import { AdminReviewCenterPage } from './pages/admin/AdminReviewCenterPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { User, Role } from './types';

// Mock simple sub-pages for this prototype
import { templateStorage } from './lib/templateStorage';

const Placeholder = ({ name }: { name: string }) => (
  <div className="flex flex-col items-center justify-center h-full min-h-[400px] border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center bg-zinc-50/50 dark:bg-zinc-900/50">
    <h2 className="text-4xl font-semibold uppercase text-zinc-300">{name}</h2>
    <p className="text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wide mt-2">Prototype Implementation Pending</p>
  </div>
);

function AppRoutes() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Initialize Theme - Default to Monochrome (Black & White)
    const savedTheme = localStorage.getItem('app-theme') || 'default';
    ['theme-blue', 'theme-indigo', 'theme-sti', 'theme-cyan'].forEach(cls => document.documentElement.classList.remove(cls));
    if (savedTheme !== 'default') {
      document.documentElement.classList.add(savedTheme);
    } else {
      localStorage.setItem('app-theme', 'default');
    }

    // Clear any troll inputs/items saved in localStorage and purge legacy templates from IndexedDB
    try {
      Object.keys(localStorage).forEach(key => {
        const val = localStorage.getItem(key);
        if (val && /tite|hahhgh|bat\s*may/i.test(val)) {
          localStorage.removeItem(key);
        }
      });

    } catch (e) { }
  }, []);

  const handleLogout = async () => {
    try { await logout(); navigate('/login', { replace: true }); }
    catch { navigate('/login', { replace: true }); }
  };

  if (loading && !user) {
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
    <>
      <Toaster position="bottom-right" toastOptions={{
        className: 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-none font-sans font-medium',
        style: { borderRadius: '8px' }
      }} />
      <Routes>
        <Route path="/" element={<LandingPage userRole={user?.role} />} />
        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to={`/${user.role}`} replace />}
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

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
          <Route path="reviews" element={<AdminReviewCenterPage />} />
          <Route path="reviews/:id" element={<AdminReviewCenterPage />} />
          <Route path="templates" element={<Templates />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="calendar" element={<CalendarPage user={user} />} />
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
          <Route path="reviews" element={<AdviserReviewCenterPage />} />
          <Route path="reviews/:id" element={<AdviserReviewCenterPage />} />
          <Route path="evaluations" element={<CompanyEvaluations />} />
          <Route path="comparison" element={<AdviserComparison />} />
          <Route path="class-reports" element={<ClassReports />} />
          <Route path="calendar" element={<CalendarPage user={user} />} />
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
          <Route path="application-letter" element={<Navigate to="/student/documents" replace />} />
          <Route path="consent" element={<Navigate to="/student/documents" replace />} />
          <Route path="moa" element={<Navigate to="/student/documents" replace />} />
          <Route path="endorsement" element={<Navigate to="/student/documents" replace />} />
          <Route path="proposal" element={<Navigate to="/student/documents" replace />} />
          <Route path="dtr" element={<Navigate to="/student/documents" replace />} />
          <Route path="journal" element={<Navigate to="/student/documents" replace />} />
          <Route path="training-plan" element={<Navigate to="/student/documents" replace />} />
          <Route path="evaluation" element={<Navigate to="/student/documents" replace />} />
          <Route path="completion" element={<Navigate to="/student/documents" replace />} />
          <Route path="documents" element={<StudentDocumentRepository />} />
          <Route path="documents/:id" element={<StudentReviewSession />} />
          <Route path="review/:id" element={<StudentReviewSession />} />
          <Route path="reviews" element={<StudentReviewCenterPage />} />
          <Route path="reviews/:id" element={<StudentReviewCenterPage />} />
          <Route path="editor" element={<StudentDocumentEditor />} />
          <Route path="progress" element={<Placeholder name="Progress Tracker" />} />
          <Route path="calendar" element={<CalendarPage user={user} />} />
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
          <Route path="journal" element={<WeeklyJournalReview />} />
          <Route path="reviews" element={<SupervisorReviewCenterPage />} />
          <Route path="reviews/:id" element={<SupervisorReviewCenterPage />} />
          <Route path="completion" element={<InternshipCompletion />} />
          <Route path="calendar" element={<CalendarPage user={user} />} />
          <Route path="notifications" element={<Notifications user={user} />} />
          <Route path="profile" element={<Profile user={user} />} />
        </Route>

        <Route path="*" element={<Navigate to={user ? `/${user.role}` : "/"} replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
