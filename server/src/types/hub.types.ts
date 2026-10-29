import { User } from './common.types.js';

export interface StudentProfile {
  userId: string;
  targetRole?: string;
  placementGoals?: string;
  skills: string[];
  interests: string[];
  resumeUrl?: string;
  readinessScore: number;
  gpa?: number;
  updatedAt: string;
  user?: User;
}

export type MilestoneCategory =
  | 'DSA'
  | 'SystemDesign'
  | 'SoftSkills'
  | 'Resume'
  | 'MockInterview'
  | 'Core CS'
  | 'Projects'
  | 'Fundamentals'
  | 'FullStack';

export type MilestoneStatus = 'pending' | 'in_progress' | 'completed';

export interface PlacementMilestone {
  id: string;
  studentId: string;
  title: string;
  category: MilestoneCategory;
  status: MilestoneStatus;
  targetDate?: string;
  completedAt?: string;
  weight?: number;
  sortOrder?: number;
  createdAt: string;
}

export interface MilestoneProgress {
  totalMilestones: number;
  completedMilestones: number;
  inProgressMilestones: number;
  progressPercentage: number;
  byCategory: {
    category: string;
    total: number;
    completed: number;
    percentage: number;
  }[];
}

export interface MentorProfile {
  id: string;
  userId: string;
  companyOffer: string;
  domain: string;
  skills: string[];
  availableSlots: string[];
  maxMentees: number;
  activeMentees: number;
  bio?: string;
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
  createdAt: string;
  user?: User;
}

export type MentorshipStatus = 'pending' | 'accepted' | 'rejected' | 'completed';

export interface MentorshipRequest {
  id: string;
  menteeId: string;
  mentorId: string;
  topic: string;
  preferredSlot: string;
  status: MentorshipStatus;
  notes?: string;
  mentorNotes?: string;
  createdAt: string;
  updatedAt: string;
  mentee?: User;
  mentor?: User;
}

export type ResourceCategory = 'Notes' | 'PYQ' | 'Syllabus' | 'Guide' | 'Cheatsheet' | 'Reference';

export interface AcademicResource {
  id: string;
  title: string;
  courseCode: string;
  courseName: string;
  semester: number;
  department: string;
  category: ResourceCategory;
  fileUrl: string;
  fileType?: string;
  fileSizeKb?: number;
  uploaderId: string;
  uploaderName?: string;
  downloadsCount: number;
  rating: number;
  ratingCount: number;
  tags: string[];
  createdAt: string;
}
