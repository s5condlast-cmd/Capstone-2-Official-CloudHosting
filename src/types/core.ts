export type Role = 'admin' | 'adviser' | 'student' | 'supervisor';

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
  companyName?: string;
  companyId?: string;
  supervisorId?: string;
}

export interface Document {
  id: string;
  type: 'MOA' | 'DTR' | 'Journal' | 'Evaluation';
  studentId: string;
  studentName: string;
  submittedAt: string;
  status: 'Pending Adviser Review' | 'Pending Final Approval' | 'Revision Required' | 'Approved';
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

export interface Company {
  id: string;
  name: string;
  address: string;
  contactNumber: string;
  industry: string;
  status: 'Active' | 'Inactive' | 'Pending MOA';
  moaExpiry?: string;
  supervisors: string[]; // supervisor user names/IDs
  studentIds: string[];  // student user names/IDs
}

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  status: 'completed' | 'in_progress' | 'pending';
}

export interface AiFindings {
  overallAssessment: 'Good' | 'Needs Attention' | 'Critical Issues';
  grammarIssues: number;
  missingInformation: string[];
  consistencyIssues: string[];
  recommendations: string[];
  confidence: 'High' | 'Medium' | 'Low';
}
