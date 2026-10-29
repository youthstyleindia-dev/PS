export type UserRole = 'student' | 'driver' | 'proctor' | 'ta_faculty' | 'warden' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  roles?: UserRole[];
  department?: string;
  yearOfStudy?: number;
  bio?: string;
}

export type ProvenanceType = 'ACTUAL_INFERENCE' | 'SIMULATED_EVENT' | 'ESTIMATED_METRIC';

// Module A: Academic Hub Types
export interface StudentSkill {
  name: string;
  proficiency?: 'beginner' | 'intermediate' | 'advanced' | 'master';
  category?: string;
}

export interface StudentProfile {
  id: string;
  userId: string;
  user: User;
  name?: string;
  email?: string;
  avatar?: string;
  department?: string;
  yearOfStudy?: number;
  bio?: string;
  skills: (StudentSkill | string)[];
  interests: string[];
  targetRole: string;
  placementGoals: string[];
  readinessScore: number; // 0 - 100
  gpa?: number;
  resumeUrl?: string;
  updatedAt?: string;
}

export interface PlacementMilestone {
  id: string;
  studentId: string;
  title: string;
  category: 'DSA' | 'SystemDesign' | 'Fundamentals' | 'FullStack' | 'MockInterview' | 'Resume' | 'SoftSkills' | 'Core CS' | 'Projects';
  status?: 'pending' | 'in_progress' | 'completed';
  completed: boolean;
  targetDate?: string;
  completedAt?: string;
}

export interface PeerMentor {
  id: string;
  userId: string;
  user: User;
  name?: string;
  email?: string;
  avatar?: string;
  department?: string;
  companyOffer: string;
  roleTitle?: string;
  domain?: string;
  skills: string[];
  availableSlots: string[];
  maxMentees: number;
  activeMenteeCount?: number;
  isAvailable?: boolean;
  rating: number; // e.g. 4.9
  reviewCount: number;
  bio: string;
}

export type MentorshipStatus = 'pending' | 'accepted' | 'rejected' | 'completed';

export interface MentorshipRequest {
  id: string;
  menteeId: string;
  mentee?: User;
  mentorId: string;
  mentor?: PeerMentor;
  topic: string;
  preferredSlot: string;
  status: MentorshipStatus;
  notes?: string;
  mentorNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type ResourceCategory = 'Notes' | 'PYQ' | 'Syllabus' | 'Guide' | 'Cheatsheet' | 'Reference';

export interface AcademicResource {
  id: string;
  title: string;
  courseCode: string;
  courseName: string;
  department: string;
  semester: number;
  category: ResourceCategory;
  fileUrl: string;
  fileSize?: string;
  fileSizeKb?: number;
  fileType?: string;
  uploaderId: string;
  uploaderName?: string;
  downloadsCount: number;
  rating: number;
  ratingsCount: number;
  ratingCount?: number;
  userRated?: number;
  tags: string[];
  createdAt: string;
}

// Activity & Notifications
export interface ActivityItem {
  id: string;
  module: 'hub' | 'rides' | 'sustainability' | 'wellbeing' | 'exams' | 'system';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  provenance?: ProvenanceType;
  link?: string;
}

// Campus Dashboard Metrics
export interface CampusMetrics {
  hub: {
    readinessScore: number;
    activeMentorships: number;
    resourcesAvailable: number;
  };
  rides: {
    activeRides: number;
    sharedDistanceKm: number;
    carbonSavedKg: number;
  };
  sustainability: {
    powerWatts: number;
    carbonGramsPerHour: number;
    ecoOptimizationActive: boolean;
    energySavedPct: number;
  };
  wellbeing: {
    focusMinutesToday: number;
    deepWorkIndex: number;
    privacyProtected: boolean;
  };
  exams: {
    activeSessions: number;
    pendingReviews: number;
    flaggedObservations: number;
  };
}
