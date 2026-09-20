/**
 * StudentDashboard.tsx
 * Modern Bento-Style Student Dashboard
 * 
 * Features:
 * - Practicum Overview card with hours & clearance progress tiles
 * - Next Priority Action banner
 * - Active Requirements checklist with 3D square thumbnails (matching "Popular products")
 * - Weekly Attendance Activity 7-day pill bar chart (matching "Product view")
 * - Adviser Remarks & Activity feed (matching "Comments")
 * - Practicum Support Team contacts
 */

import React from 'react';
import {
  StudentDashboardView,
  useStudentDashboard,
  RequirementStatus,
  RequirementItem as DashboardRequirement,
} from '@/src/features/student-dashboard';

export type { RequirementStatus, DashboardRequirement };

export const StudentDashboard: React.FC = () => {
  const vm = useStudentDashboard();

  return <StudentDashboardView vm={vm} />;
};

export default StudentDashboard;
