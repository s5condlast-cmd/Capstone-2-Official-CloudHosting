export type Role = 'admin' | 'adviser' | 'student';

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  email: string;
  department?: string;
  studentId?: string;
  course?: string;
  adviserId?: string;
}

export interface Document {
  id: string;
  type: 'MOA' | 'DTR' | 'Journal' | 'Evaluation';
  studentId: string;
  studentName: string;
  submittedAt: string;
  status: 'Pending' | 'Approved' | 'Returned' | 'Under Review';
  fileUrl?: string;
  comment?: string;
  weeks?: number;
  hours?: number;
}

export interface LogEntry {
  id: string;
  message: string;
  timestamp: string;
  type: 'security' | 'system' | 'action';
}

export interface RoadmapStep {
  label: string;
  status: 'Completed' | 'In Progress' | 'Pending' | 'Upcoming' | 'Active';
  icon: string;
  isCompleted: boolean;
  isActive: boolean;
}

// AI Content Insight Review Types
export type InsightStatus = 'pass' | 'warn' | 'fail';

export interface InsightItem {
  label: string;
  status: InsightStatus;
  detail?: string;
  suggestion?: string;
}

export interface InsightCategory {
  title: string;
  icon: string;
  items: InsightItem[];
}

export interface InsightReport {
  overallScore: number;
  summaryText: string;
  categories: InsightCategory[];
  manualChecks: string[];
  analyzedAt: string;
}
