import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { LandingPage } from './pages/public/LandingPage';
import { ForgotPassword } from './pages/public/ForgotPassword';
import { ResetPassword } from './pages/public/ResetPassword';
import { Login } from './pages/public/Login';
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { PhaseGuard } from './components/layout/PhaseGuard';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { User, Role } from './types';
import { applyAccentTheme, getStoredAccentTheme } from './config/accentThemes';

// ─── Lazy-Loaded Portal, Review Center & Editor Routes ───────────────────────
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard').then((m: any) => ({ default: m.AdminDashboard || m.default })));
const Monitoring = React.lazy(() => import('./pages/admin/Monitoring').then((m: any) => ({ default: m.Monitoring || m.default })));
const UserManagement = React.lazy(() => import('./pages/admin/UserManagement').then((m: any) => ({ default: m.UserManagement || m.default })));
const CompanyManagement = React.lazy(() => import('./pages/admin/CompanyManagement').then((m: any) => ({ default: m.CompanyManagement || m.default })));
const DocumentVerification = React.lazy(() => import('./pages/admin/DocumentVerification').then((m: any) => ({ default: m.DocumentVerification || m.default })));
const Templates = React.lazy(() => import('./pages/admin/Templates').then((m: any) => ({ default: m.Templates || m.default })));
const Reports = React.lazy(() => import('./pages/admin/Reports').then((m: any) => ({ default: m.Reports || m.default })));
const Settings = React.lazy(() => import('./pages/admin/Settings').then((m: any) => ({ default: m.Settings || m.default })));
const Announcements = React.lazy(() => import('./pages/admin/Announcements').then((m: any) => ({ default: m.Announcements || m.default })));
const AdminReviewSession = React.lazy(() => import('./pages/admin/AdminReviewSession').then((m: any) => ({ default: m.AdminReviewSession || m.default })));
const AdminDocumentEditor = React.lazy(() => import('./pages/admin/AdminDocumentEditor').then((m: any) => ({ default: m.AdminDocumentEditor || m.default })));
const AdminReviewCenterPage = React.lazy(() => import('./pages/admin/AdminReviewCenterPage').then((m: any) => ({ default: m.AdminReviewCenterPage || m.default })));

const AdviserDashboard = React.lazy(() => import('./pages/adviser/AdviserDashboard').then((m: any) => ({ default: m.AdviserDashboard || m.default })));
const MyStudents = React.lazy(() => import('./pages/adviser/MyStudents').then((m: any) => ({ default: m.MyStudents || m.default })));
const Endorsements = React.lazy(() => import('./pages/adviser/Endorsements').then((m: any) => ({ default: m.Endorsements || m.default })));
const MOAReview = React.lazy(() => import('./pages/adviser/MOAReview').then((m: any) => ({ default: m.MOAReview || m.default })));
const ReviewDocs = React.lazy(() => import('./pages/adviser/ReviewDocs').then((m: any) => ({ default: m.ReviewDocs || m.default })));
const DocumentReviewSession = React.lazy(() => import('./pages/adviser/DocumentReviewSession').then((m: any) => ({ default: m.DocumentReviewSession || m.default })));
const AdviserDocumentEditor = React.lazy(() => import('./pages/adviser/AdviserDocumentEditor').then((m: any) => ({ default: m.AdviserDocumentEditor || m.default })));
const AdviserReviewCenterPage = React.lazy(() => import('./pages/adviser/AdviserReviewCenterPage').then((m: any) => ({ default: m.AdviserReviewCenterPage || m.default })));
const CompanyEvaluations = React.lazy(() => import('./pages/adviser/CompanyEvaluations').then((m: any) => ({ default: m.CompanyEvaluations || m.default })));
const AdviserComparison = React.lazy(() => import('./pages/adviser/AdviserComparison').then((m: any) => ({ default: m.AdviserComparison || m.default })));
const ClassReports = React.lazy(() => import('./pages/adviser/ClassReports').then((m: any) => ({ default: m.ClassReports || m.default })));

const StudentDashboard = React.lazy(() => import('./pages/student/StudentDashboard').then((m: any) => ({ default: m.StudentDashboard || m.default })));
const StudentDocumentRepository = React.lazy(() => import('./pages/student/StudentDocumentRepository').then((m: any) => ({ default: m.StudentDocumentRepository || m.default })));
const StudentDocumentEditor = React.lazy(() => import('./pages/student/StudentDocumentEditor').then((m: any) => ({ default: m.StudentDocumentEditor || m.default })));
const StudentReviewSession = React.lazy(() => import('./pages/student/StudentReviewSession').then((m: any) => ({ default: m.StudentReviewSession || m.default })));
const StudentReviewCenterPage = React.lazy(() => import('./pages/student/StudentReviewCenterPage').then((m: any) => ({ default: m.StudentReviewCenterPage || m.default })));

const SupervisorDashboard = React.lazy(() => import('./pages/supervisor/SupervisorDashboard').then((m: any) => ({ default: m.SupervisorDashboard || m.default })));
const MyInterns = React.lazy(() => import('./pages/supervisor/MyInterns').then((m: any) => ({ default: m.MyInterns || m.default })));
const DTRApproval = React.lazy(() => import('./pages/supervisor/DTRApproval').then((m: any) => ({ default: m.DTRApproval || m.default })));
const WeeklyJournalReview = React.lazy(() => import('./pages/supervisor/WeeklyJournalReview').then((m: any) => ({ default: m.WeeklyJournalReview || m.default })));
const InternshipCompletion = React.lazy(() => import('./pages/supervisor/InternshipCompletion').then((m: any) => ({ default: m.InternshipCompletion || m.default })));
const SupervisorReviewCenterPage = React.lazy(() => import('./pages/supervisor/SupervisorReviewCenterPage').then((m: any) => ({ default: m.SupervisorReviewCenterPage || m.default })));

const Notifications = React.lazy<React.ComponentType<{ user: any }>>(() => import('./pages/shared/Notifications').then((m: any) => ({ default: m.Notifications || m.default })));
const CalendarPage = React.lazy<React.ComponentType<{ user: any }>>(() => import('./pages/shared/CalendarPage').then((m: any) => ({ default: m.CalendarPage || m.default })));
const Profile = React.lazy<React.ComponentType<{ user: any }>>(() => import('./pages/shared/Profile').then((m: any) => ({ default: m.Profile || m.default })));
const AttendancePage = React.lazy(() => import('./pages/shared/AttendancePage').then((m: any) => ({ default: m.AttendancePage || m.default })));

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
    // Restore the saved accent and clear any stale theme classes.
    applyAccentTheme(getStoredAccentTheme());

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

const RouteLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[50vh] w-full gap-3 text-muted-foreground">
    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    <span className="text-xs font-medium">Loading view…</span>
  </div>
);

  return (
    <>
      <Toaster position="bottom-right" toastOptions={{
        className: 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-none font-sans font-medium',
        style: { borderRadius: '8px' }
      }} />
      <ErrorBoundary>
        <React.Suspense fallback={<RouteLoadingFallback />}>
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
          <Route path="attendance" element={<AttendancePage />} />
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
          <Route path="attendance" element={<AttendancePage />} />
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
          <Route path="dtr" element={<Navigate to="/student/attendance" replace />} />
          <Route path="journal" element={<Navigate to="/student/documents" replace />} />
          <Route path="training-plan" element={<Navigate to="/student/documents" replace />} />
          <Route path="evaluation" element={<Navigate to="/student/documents" replace />} />
          <Route path="completion" element={<Navigate to="/student/documents" replace />} />
          <Route path="documents" element={<StudentDocumentRepository />} />
          <Route path="repository" element={<Navigate to="/student/documents" replace />} />
          <Route path="documents/:id" element={<StudentReviewSession />} />
          <Route path="review/:id" element={<StudentReviewSession />} />
          <Route path="reviews" element={<StudentReviewCenterPage />} />
          <Route path="reviews/:id" element={<StudentReviewCenterPage />} />
          <Route path="editor" element={<StudentDocumentEditor />} />
          <Route path="attendance" element={<AttendancePage />} />
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
          <Route path="attendance" element={<AttendancePage />} />
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
      </React.Suspense>
      </ErrorBoundary>
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
