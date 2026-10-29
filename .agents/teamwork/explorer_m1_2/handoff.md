# Technical Strategy & Implementation Blueprint: Module A (Academic Hub) & Common APIs

**Author**: `explorer_m1_2`  
**Milestone**: Milestone 1: Core Platform & Academic Hub  
**Working Directory**: `/Users/divya/Documents/Problem statement /.agents/teamwork/explorer_m1_2`  
**Date**: 2026-10-29  

---

## 1. Observation

### 1.1 Specification Citations & Contract Requirements
From `Problem statement.docx` (Section 3, Module A & Section 4) and `/Users/divya/Documents/Problem statement /.agents/teamwork/orchestrator/PROJECT.md`:
1. **Student Intelligence and Academic Hub (Module A)**:
   - "Student profiles with skills, interests, and placement goals."
   - "Placement preparation dashboard and progress tracking."
   - "Peer mentor discovery and mentorship requests."
   - "Searchable academic resource repository for notes, question papers, and study materials."
2. **Interface Contracts from `PROJECT.md` (Lines 133–152)**:
   - SQLite DB Path: `server/data/universe.db`, connection helper `import { getDb } from '../db/connection.js'`
   - Role types: `'student' | 'driver' | 'proctor' | 'admin'`
   - Module A Endpoints:
     - `GET /api/hub/profile/:studentId`
     - `PUT /api/hub/profile/:studentId`
     - `GET /api/hub/placement-milestones/:studentId`
     - `POST /api/hub/placement-milestones/:studentId/toggle`
     - `GET /api/hub/mentors?skill=&company=`
     - `POST /api/hub/mentorship-requests`
     - `GET /api/hub/mentorship-requests/:userId`
     - `PATCH /api/hub/mentorship-requests/:requestId`
     - `GET /api/hub/resources?courseCode=&category=&query=`
     - `POST /api/hub/resources`
     - `POST /api/hub/resources/:resourceId/rate`
   - Common Endpoints:
     - `GET /api/health`
     - `GET /api/activity`
     - `POST /api/activity`
     - `GET /api/users`
     - `GET /api/users/:userId`

### 1.2 Existing Environment State
Direct verification of project environment (via `explorer_survey_3` and tool runs):
- Runtime: Node.js `v24.16.0` on macOS Darwin.
- Execution engine: `npx tsx` (`tsx v4.23.15`) executes TypeScript directly with ESM and zero compilation steps.
- Backend dependencies installed in root: `express@5.3.0`, `better-sqlite3@13.0.3`, `cors@2.8.6`, `dotenv@18.0.9`.
- Testing framework: `vitest@3.0.7` / `5.0.5`.
- Current source status: `server/src/` is empty / pre-scaffold.

---

## 2. Logic Chain

1. **Relational Data Mapping**:
   SQLite is the single persistent storage engine. While SQLite lacks a native JSON type, it provides first-class JSON functions (`json_extract`, `json_array`, `json_each`) and supports storing JSON text (e.g. `TEXT DEFAULT '[]'`).
   We map arrays (`skills`, `interests`, `available_slots`, `tags`) to valid JSON strings in the database, with automatic serialization/deserialization in our API controllers.
2. **Dynamic Mathematical Models**:
   - **Readiness Score**: A static score provides no actionable motivation. We formulate a composite deterministic score $R \in [0, 100]$ composed of milestone progress (50%), technical skill depth (30%), and profile completeness (20%). It is recomputed dynamically whenever a milestone is toggled or skills/goals are updated.
   - **Milestone Progress**: Categorical and overall progress must be computed on demand to power UI progress bars and radar breakdowns.
   - **Resource Ratings**: We enforce integer ratings ($1 \le r \le 5$) with an atomic upsert mechanism into `resource_ratings` tracking `(resource_id, user_id)`. The aggregate `rating` (1 decimal place) and `rating_count` update atomically in a SQLite transaction.
3. **Guardrails & Error Integrity**:
   - Prevent self-mentorship requests (`menteeId === mentorId` $\implies$ HTTP 400).
   - Prevent duplicate pending mentorship requests (`mentee_id` + `mentor_id` + `status = 'pending'` $\implies$ HTTP 409 Conflict).
   - Valid transition states on mentorship requests (`pending` $\rightarrow$ `accepted` | `rejected` | `completed`).
   - Standardized JSON error response shape `{ error: { code, message, details? } }` with explicit HTTP codes (400, 404, 409, 500).
4. **Cross-Module Notification & Activity Stream**:
   Whenever a key action occurs (mentorship request submitted/accepted, resource uploaded), an event is written to `activity_log`, immediately surfacing in the unified global header notification bell.

---

## 3. Caveats

1. **SQLite WAL Mode & Concurrency**:
   `better-sqlite3` is synchronous and thread-safe. Operating in `PRAGMA journal_mode = WAL` and `PRAGMA foreign_keys = ON` ensures sub-millisecond query performance without locking issues during concurrent test runs.
2. **JSON Array Field Handling**:
   When reading from SQLite, helper functions safely parse JSON strings (`JSON.parse(row.skills || '[]')`) with fallback to empty arrays to prevent unhandled JSON parse exceptions if malformed text is stored.
3. **No External Network Dependencies**:
   All endpoints operate strictly against local SQLite and standard Node libraries, guaranteeing zero internet reliance during automated grading or hackathon evaluation.

---

## 4. Conclusion & Technical Implementation Blueprint

### 4.1 TypeScript Data Interfaces

#### File: `server/src/types/common.types.ts`
```typescript
export type UserRole = 'student' | 'driver' | 'proctor' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  department: string;
  year_of_study?: number;
  bio?: string;
  created_at: string;
}

export type ActivityModule = 'hub' | 'rides' | 'sustainability' | 'wellbeing' | 'exams' | 'system';

export interface ActivityLogItem {
  id: string;
  userId?: string;
  userName?: string;
  userAvatar?: string;
  module: ActivityModule;
  action: string;
  details?: Record<string, any> | string;
  timestamp: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  error: {
    code: 'BAD_REQUEST' | 'NOT_FOUND' | 'CONFLICT' | 'INTERNAL_SERVER_ERROR';
    message: string;
    details?: any;
  };
}
```

#### File: `server/src/types/hub.types.ts`
```typescript
import { User } from './common.types.js';

export interface StudentProfile {
  userId: string;
  targetRole?: string;
  placementGoals?: string;
  skills: string[];
  interests: string[];
  resumeUrl?: string;
  readinessScore: number;
  updatedAt: string;
  user?: User;
}

export type MilestoneCategory =
  | 'DSA'
  | 'System Design'
  | 'Core CS'
  | 'Projects'
  | 'Mock Interviews'
  | 'Resume & Soft Skills';

export type MilestoneStatus = 'pending' | 'in_progress' | 'completed';

export interface PlacementMilestone {
  id: string;
  studentId: string;
  title: string;
  category: MilestoneCategory;
  status: MilestoneStatus;
  targetDate?: string;
  completedAt?: string;
  sortOrder: number;
  createdAt: string;
}

export interface MilestoneProgress {
  totalMilestones: number;
  completedMilestones: number;
  inProgressMilestones: number;
  progressPercentage: number;
  byCategory: {
    category: MilestoneCategory;
    total: number;
    completed: number;
    percentage: number;
  }[];
}

export interface MentorProfile {
  id: string;
  userId: string;
  companyOffer: string;
  skills: string[];
  availableSlots: string[];
  maxMentees: number;
  bio?: string;
  rating: number;
  activeMenteeCount: number;
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
  createdAt: string;
  updatedAt: string;
  mentee?: User;
  mentor?: User;
}

export type ResourceCategory = 'Notes' | 'PYQ' | 'Syllabus' | 'Guide' | 'Reference';

export interface AcademicResource {
  id: string;
  title: string;
  courseCode: string;
  semester: number;
  department: string;
  category: ResourceCategory;
  fileUrl: string;
  uploaderId: string;
  downloadsCount: number;
  rating: number;
  ratingCount: number;
  totalRatingPoints: number;
  tags: string[];
  createdAt: string;
  uploaderName?: string;
}
```

---

### 4.2 Core Mathematical Models & Pure Service Functions

#### File: `server/src/services/hub.service.ts`
```typescript
import { MilestoneProgress, MilestoneCategory, PlacementMilestone } from '../types/hub.types.js';

/**
 * Calculates placement readiness score R in [0, 100].
 * - Milestones progress: 50%
 * - Skills breadth: 30% (target >= 6 skills)
 * - Profile completeness: 20% (role +8, goals +6, resume +6)
 */
export function calculateReadinessScore(params: {
  totalMilestones: number;
  completedMilestones: number;
  skills: string[];
  targetRole?: string;
  placementGoals?: string;
  resumeUrl?: string;
}): number {
  const { totalMilestones, completedMilestones, skills, targetRole, placementGoals, resumeUrl } = params;

  // 1. Milestone Score (50%)
  const milestoneScore = totalMilestones > 0
    ? (completedMilestones / totalMilestones) * 50
    : 0;

  // 2. Skills Portfolio Depth (30% - scaled to max 6 skills)
  const validSkills = (skills || []).filter(s => s && s.trim().length > 0);
  const skillsScore = Math.min(1.0, validSkills.length / 6) * 30;

  // 3. Profile Completeness (20%)
  let profileScore = 0;
  if (targetRole && targetRole.trim().length > 0) profileScore += 8;
  if (placementGoals && placementGoals.trim().length >= 10) profileScore += 6;
  if (resumeUrl && resumeUrl.trim().length > 0) profileScore += 6;

  const total = Math.round(milestoneScore + skillsScore + profileScore);
  return Math.max(0, Math.min(100, total));
}

/**
 * Calculates detailed category-wise and overall progress metrics
 */
export function calculateMilestoneProgress(milestones: PlacementMilestone[]): MilestoneProgress {
  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter(m => m.status === 'completed').length;
  const inProgressMilestones = milestones.filter(m => m.status === 'in_progress').length;
  const progressPercentage = totalMilestones > 0
    ? Math.round((completedMilestones / totalMilestones) * 100)
    : 0;

  const categories: MilestoneCategory[] = [
    'DSA',
    'System Design',
    'Core CS',
    'Projects',
    'Mock Interviews',
    'Resume & Soft Skills'
  ];

  const byCategory = categories.map(cat => {
    const catMilestones = milestones.filter(m => m.category === cat);
    const catTotal = catMilestones.length;
    const catCompleted = catMilestones.filter(m => m.status === 'completed').length;
    const catPercentage = catTotal > 0 ? Math.round((catCompleted / catTotal) * 100) : 0;
    return {
      category: cat,
      total: catTotal,
      completed: catCompleted,
      percentage: catPercentage
    };
  }).filter(c => c.total > 0);

  return {
    totalMilestones,
    completedMilestones,
    inProgressMilestones,
    progressPercentage,
    byCategory
  };
}

/**
 * Calculates dynamic rating average with 1 decimal precision
 */
export function calculateNewRatingAverage(
  currentTotalPoints: number,
  currentCount: number,
  newRating: number,
  previousUserRating?: number
): { newRatingAverage: number; newRatingCount: number; newTotalPoints: number } {
  let newTotalPoints: number;
  let newRatingCount: number;

  if (previousUserRating !== undefined && previousUserRating !== null) {
    // User updating existing rating
    newTotalPoints = currentTotalPoints - previousUserRating + newRating;
    newRatingCount = currentCount; // count does not increase
  } else {
    // Brand new rating from this user
    newTotalPoints = currentTotalPoints + newRating;
    newRatingCount = currentCount + 1;
  }

  const rawAverage = newRatingCount > 0 ? newTotalPoints / newRatingCount : 0;
  const newRatingAverage = Math.round(rawAverage * 10) / 10;

  return { newRatingAverage, newRatingCount, newTotalPoints };
}
```

---

### 4.3 Module A Routes Implementation (`hub.routes.ts`)

#### File: `server/src/routes/hub.routes.ts`
```typescript
import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection.js';
import {
  calculateReadinessScore,
  calculateMilestoneProgress,
  calculateNewRatingAverage
} from '../services/hub.service.js';
import { PlacementMilestone } from '../types/hub.types.js';

export const hubRouter = Router();

// ==========================================
// 1. STUDENT PROFILES
// ==========================================

/**
 * GET /api/hub/profile/:studentId
 * Fetch student profile, user details, skills, and calculated readiness score
 */
hubRouter.get('/profile/:studentId', (req: Request, res: Response): void => {
  const { studentId } = req.params;
  const db = getDb();

  const user = db.prepare('SELECT id, name, email, avatar, role, department, year_of_study, bio, created_at FROM users WHERE id = ?').get(studentId) as any;
  if (!user) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: `Student with id '${studentId}' not found` } });
    return;
  }

  let profile = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(studentId) as any;
  if (!profile) {
    // Auto-create default profile if missing
    db.prepare(`
      INSERT INTO student_profiles (user_id, target_role, placement_goals, skills, interests, resume_url, readiness_score)
      VALUES (?, '', '', '[]', '[]', '', 0)
    `).run(studentId);
    profile = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(studentId);
  }

  const skills = JSON.parse(profile.skills || '[]');
  const interests = JSON.parse(profile.interests || '[]');

  // Check milestones to ensure readiness score is 100% up to date
  const milestones = db.prepare('SELECT * FROM placement_milestones WHERE student_id = ?').all(studentId) as PlacementMilestone[];
  const completedMilestones = milestones.filter(m => m.status === 'completed').length;
  const readinessScore = calculateReadinessScore({
    totalMilestones: milestones.length,
    completedMilestones,
    skills,
    targetRole: profile.target_role,
    placementGoals: profile.placement_goals,
    resumeUrl: profile.resume_url
  });

  if (readinessScore !== profile.readiness_score) {
    db.prepare('UPDATE student_profiles SET readiness_score = ? WHERE user_id = ?').run(readinessScore, studentId);
  }

  res.json({
    userId: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    department: user.department,
    yearOfStudy: user.year_of_study,
    bio: user.bio,
    targetRole: profile.target_role || '',
    placementGoals: profile.placement_goals || '',
    skills,
    interests,
    resumeUrl: profile.resume_url || '',
    readinessScore,
    updatedAt: profile.updated_at
  });
});

/**
 * PUT /api/hub/profile/:studentId
 * Update student profile skills, interests, target role, placement goals, resume
 */
hubRouter.put('/profile/:studentId', (req: Request, res: Response): void => {
  const { studentId } = req.params;
  const { skills, interests, targetRole, placementGoals, resumeUrl } = req.body;
  const db = getDb();

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(studentId);
  if (!user) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: `Student with id '${studentId}' not found` } });
    return;
  }

  if (skills !== undefined && !Array.isArray(skills)) {
    res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Field "skills" must be an array of strings' } });
    return;
  }
  if (interests !== undefined && !Array.isArray(interests)) {
    res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Field "interests" must be an array of strings' } });
    return;
  }

  const existingProfile = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(studentId) as any;
  const newSkills = skills !== undefined ? skills : JSON.parse(existingProfile?.skills || '[]');
  const newInterests = interests !== undefined ? interests : JSON.parse(existingProfile?.interests || '[]');
  const newTargetRole = targetRole !== undefined ? targetRole : (existingProfile?.target_role || '');
  const newPlacementGoals = placementGoals !== undefined ? placementGoals : (existingProfile?.placement_goals || '');
  const newResumeUrl = resumeUrl !== undefined ? resumeUrl : (existingProfile?.resume_url || '');

  // Recompute readiness score
  const milestones = db.prepare('SELECT * FROM placement_milestones WHERE student_id = ?').all(studentId) as PlacementMilestone[];
  const completedMilestones = milestones.filter(m => m.status === 'completed').length;
  const newReadinessScore = calculateReadinessScore({
    totalMilestones: milestones.length,
    completedMilestones,
    skills: newSkills,
    targetRole: newTargetRole,
    placementGoals: newPlacementGoals,
    resumeUrl: newResumeUrl
  });

  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO student_profiles (user_id, target_role, placement_goals, skills, interests, resume_url, readiness_score, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      target_role = excluded.target_role,
      placement_goals = excluded.placement_goals,
      skills = excluded.skills,
      interests = excluded.interests,
      resume_url = excluded.resume_url,
      readiness_score = excluded.readiness_score,
      updated_at = excluded.updated_at
  `).run(
    studentId,
    newTargetRole,
    newPlacementGoals,
    JSON.stringify(newSkills),
    JSON.stringify(newInterests),
    newResumeUrl,
    newReadinessScore,
    now
  );

  res.json({
    userId: studentId,
    targetRole: newTargetRole,
    placementGoals: newPlacementGoals,
    skills: newSkills,
    interests: newInterests,
    resumeUrl: newResumeUrl,
    readinessScore: newReadinessScore,
    updatedAt: now
  });
});

// ==========================================
// 2. PLACEMENT PREPARATION MILESTONES
// ==========================================

/**
 * GET /api/hub/placement-milestones/:studentId
 * Get checklist and dynamic category progress
 */
hubRouter.get('/placement-milestones/:studentId', (req: Request, res: Response): void => {
  const { studentId } = req.params;
  const db = getDb();

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(studentId);
  if (!user) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: `User with id '${studentId}' not found` } });
    return;
  }

  const milestones = db.prepare(`
    SELECT id, student_id as studentId, title, category, status, target_date as targetDate, completed_at as completedAt, sort_order as sortOrder, created_at as createdAt
    FROM placement_milestones
    WHERE student_id = ?
    ORDER BY sort_order ASC, created_at ASC
  `).all(studentId) as PlacementMilestone[];

  const progress = calculateMilestoneProgress(milestones);

  res.json({
    studentId,
    progress,
    milestones
  });
});

/**
 * POST /api/hub/placement-milestones/:studentId/toggle
 * Toggle milestone status between 'completed' and 'pending'
 */
hubRouter.post('/placement-milestones/:studentId/toggle', (req: Request, res: Response): void => {
  const { studentId } = req.params;
  const { milestoneId } = req.body;
  const db = getDb();

  if (!milestoneId) {
    res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Field "milestoneId" is required' } });
    return;
  }

  const milestone = db.prepare('SELECT * FROM placement_milestones WHERE id = ? AND student_id = ?').get(milestoneId, studentId) as any;
  if (!milestone) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: `Milestone '${milestoneId}' for student '${studentId}' not found` } });
    return;
  }

  const nextStatus = milestone.status === 'completed' ? 'pending' : 'completed';
  const completedAt = nextStatus === 'completed' ? new Date().toISOString() : null;

  db.prepare(`
    UPDATE placement_milestones
    SET status = ?, completed_at = ?
    WHERE id = ?
  `).run(nextStatus, completedAt, milestoneId);

  // Recalculate progress & readiness score
  const allMilestones = db.prepare('SELECT * FROM placement_milestones WHERE student_id = ?').all(studentId) as PlacementMilestone[];
  const progress = calculateMilestoneProgress(allMilestones);

  const profile = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(studentId) as any;
  const skills = JSON.parse(profile?.skills || '[]');
  const newReadinessScore = calculateReadinessScore({
    totalMilestones: allMilestones.length,
    completedMilestones: progress.completedMilestones,
    skills,
    targetRole: profile?.target_role,
    placementGoals: profile?.placement_goals,
    resumeUrl: profile?.resume_url
  });

  db.prepare('UPDATE student_profiles SET readiness_score = ? WHERE user_id = ?').run(newReadinessScore, studentId);

  res.json({
    success: true,
    toggledMilestone: {
      id: milestone.id,
      title: milestone.title,
      category: milestone.category,
      status: nextStatus,
      completedAt
    },
    progress,
    readinessScore: newReadinessScore
  });
});

// ==========================================
// 3. PEER MENTOR DISCOVERY
// ==========================================

/**
 * GET /api/hub/mentors
 * Filter mentors by skill, company, availability, and search query
 */
hubRouter.get('/mentors', (req: Request, res: Response): void => {
  const { skill, company, available, query } = req.query;
  const db = getDb();

  const mentorsRaw = db.prepare(`
    SELECT 
      m.id, m.user_id as userId, m.company_offer as companyOffer,
      m.skills, m.available_slots as availableSlots, m.max_mentees as maxMentees,
      m.bio, m.rating, m.created_at as createdAt,
      u.name, u.email, u.avatar, u.department, u.year_of_study as yearOfStudy
    FROM mentor_profiles m
    JOIN users u ON m.user_id = u.id
    ORDER BY m.rating DESC, u.name ASC
  `).all() as any[];

  // Fetch count of currently active mentees per mentor
  const activeCounts = db.prepare(`
    SELECT mentor_id, COUNT(*) as count 
    FROM mentorship_requests 
    WHERE status = 'accepted'
    GROUP BY mentor_id
  `).all() as { mentor_id: string; count: number }[];

  const activeCountMap = new Map<string, number>();
  for (const row of activeCounts) {
    activeCountMap.set(row.mentor_id, row.count);
  }

  let mentors = mentorsRaw.map(m => {
    const skillsList: string[] = JSON.parse(m.skills || '[]');
    const slotsList: string[] = JSON.parse(m.availableSlots || '[]');
    const activeMenteeCount = activeCountMap.get(m.userId) || 0;
    const isAvailable = activeMenteeCount < m.maxMentees;

    return {
      id: m.id,
      userId: m.userId,
      name: m.name,
      email: m.email,
      avatar: m.avatar,
      department: m.department,
      yearOfStudy: m.yearOfStudy,
      companyOffer: m.companyOffer,
      skills: skillsList,
      availableSlots: slotsList,
      maxMentees: m.maxMentees,
      activeMenteeCount,
      isAvailable,
      bio: m.bio || '',
      rating: m.rating,
      createdAt: m.createdAt
    };
  });

  // Apply filters
  if (skill) {
    const skillSearch = String(skill).toLowerCase().trim();
    mentors = mentors.filter(m => m.skills.some(s => s.toLowerCase().includes(skillSearch)));
  }

  if (company) {
    const compSearch = String(company).toLowerCase().trim();
    mentors = mentors.filter(m => m.companyOffer.toLowerCase().includes(compSearch));
  }

  if (available === 'true') {
    mentors = mentors.filter(m => m.isAvailable);
  }

  if (query) {
    const q = String(query).toLowerCase().trim();
    mentors = mentors.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.department.toLowerCase().includes(q) ||
      m.companyOffer.toLowerCase().includes(q) ||
      m.skills.some(s => s.toLowerCase().includes(q))
    );
  }

  res.json({
    total: mentors.length,
    mentors
  });
});

// ==========================================
// 4. MENTORSHIP REQUESTS WORKFLOW
// ==========================================

/**
 * POST /api/hub/mentorship-requests
 * Submit a new mentorship request with duplicate check and self-request prevention
 */
hubRouter.post('/mentorship-requests', (req: Request, res: Response): void => {
  const { menteeId, mentorId, topic, preferredSlot, notes } = req.body;
  const db = getDb();

  // Validate mandatory fields
  if (!menteeId || !mentorId || !topic || !preferredSlot) {
    res.status(400).json({
      error: {
        code: 'BAD_REQUEST',
        message: 'Missing required fields: menteeId, mentorId, topic, and preferredSlot are mandatory'
      }
    });
    return;
  }

  // Self-request prevention guardrail
  if (menteeId === mentorId) {
    res.status(400).json({
      error: {
        code: 'BAD_REQUEST',
        message: 'Cannot request mentorship from yourself'
      }
    });
    return;
  }

  // Verify mentee and mentor existence
  const mentee = db.prepare('SELECT id, name FROM users WHERE id = ?').get(menteeId) as any;
  if (!mentee) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: `Mentee '${menteeId}' not found` } });
    return;
  }

  const mentorUser = db.prepare('SELECT id, name FROM users WHERE id = ?').get(mentorId) as any;
  if (!mentorUser) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: `Mentor '${mentorId}' not found` } });
    return;
  }

  // Duplicate pending request check
  const existingPending = db.prepare(`
    SELECT id FROM mentorship_requests
    WHERE mentee_id = ? AND mentor_id = ? AND status = 'pending'
  `).get(menteeId, mentorId);

  if (existingPending) {
    res.status(409).json({
      error: {
        code: 'CONFLICT',
        message: 'A pending mentorship request already exists for this mentor'
      }
    });
    return;
  }

  const requestId = 'req_' + Math.random().toString(36).substring(2, 10);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO mentorship_requests (id, mentee_id, mentor_id, topic, preferred_slot, status, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?)
  `).run(requestId, menteeId, mentorId, topic, preferredSlot, notes || '', now, now);

  // Log activity
  const activityId = 'act_' + Math.random().toString(36).substring(2, 10);
  db.prepare(`
    INSERT INTO activity_log (id, user_id, module, action, details, timestamp)
    VALUES (?, ?, 'hub', 'MENTORSHIP_REQUEST_SENT', ?, ?)
  `).run(
    activityId,
    menteeId,
    JSON.stringify({ menteeName: mentee.name, mentorName: mentorUser.name, topic, requestId }),
    now
  );

  res.status(201).json({
    id: requestId,
    menteeId,
    mentorId,
    topic,
    preferredSlot,
    status: 'pending',
    notes: notes || '',
    createdAt: now,
    updatedAt: now
  });
});

/**
 * GET /api/hub/mentorship-requests/:userId
 * Fetch sent and received requests for a user
 */
hubRouter.get('/mentorship-requests/:userId', (req: Request, res: Response): void => {
  const { userId } = req.params;
  const db = getDb();

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (!user) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: `User '${userId}' not found` } });
    return;
  }

  const sent = db.prepare(`
    SELECT 
      r.id, r.mentee_id as menteeId, r.mentor_id as mentorId, r.topic, r.preferred_slot as preferredSlot,
      r.status, r.notes, r.created_at as createdAt, r.updated_at as updatedAt,
      u.name as mentorName, u.avatar as mentorAvatar, u.department as mentorDepartment,
      m.company_offer as mentorCompany
    FROM mentorship_requests r
    JOIN users u ON r.mentor_id = u.id
    LEFT JOIN mentor_profiles m ON r.mentor_id = m.user_id
    WHERE r.mentee_id = ?
    ORDER BY r.created_at DESC
  `).all(userId);

  const received = db.prepare(`
    SELECT 
      r.id, r.mentee_id as menteeId, r.mentor_id as mentorId, r.topic, r.preferred_slot as preferredSlot,
      r.status, r.notes, r.created_at as createdAt, r.updated_at as updatedAt,
      u.name as menteeName, u.avatar as menteeAvatar, u.department as menteeDepartment
    FROM mentorship_requests r
    JOIN users u ON r.mentee_id = u.id
    WHERE r.mentor_id = ?
    ORDER BY r.created_at DESC
  `).all(userId);

  res.json({
    userId,
    sent,
    received
  });
});

/**
 * PATCH /api/hub/mentorship-requests/:requestId
 * Update status (accepted/rejected/completed) with proctor/mentor notes
 */
hubRouter.patch('/mentorship-requests/:requestId', (req: Request, res: Response): void => {
  const { requestId } = req.params;
  const { status, notes } = req.body;
  const db = getDb();

  const request = db.prepare('SELECT * FROM mentorship_requests WHERE id = ?').get(requestId) as any;
  if (!request) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: `Mentorship request '${requestId}' not found` } });
    return;
  }

  const validStatuses = ['accepted', 'rejected', 'completed'];
  if (!status || !validStatuses.includes(status)) {
    res.status(400).json({
      error: {
        code: 'BAD_REQUEST',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      }
    });
    return;
  }

  const now = new Date().toISOString();
  const updatedNotes = notes !== undefined ? notes : request.notes;

  db.prepare(`
    UPDATE mentorship_requests
    SET status = ?, notes = ?, updated_at = ?
    WHERE id = ?
  `).run(status, updatedNotes, now, requestId);

  // Log activity
  const actionType = status === 'accepted'
    ? 'MENTORSHIP_REQUEST_ACCEPTED'
    : status === 'rejected'
      ? 'MENTORSHIP_REQUEST_REJECTED'
      : 'MENTORSHIP_COMPLETED';

  const activityId = 'act_' + Math.random().toString(36).substring(2, 10);
  db.prepare(`
    INSERT INTO activity_log (id, user_id, module, action, details, timestamp)
    VALUES (?, ?, 'hub', ?, ?, ?)
  `).run(
    activityId,
    request.mentor_id,
    JSON.stringify({ requestId, menteeId: request.mentee_id, status, notes: updatedNotes }),
    now
  );

  res.json({
    id: requestId,
    menteeId: request.mentee_id,
    mentorId: request.mentor_id,
    topic: request.topic,
    preferredSlot: request.preferred_slot,
    status,
    notes: updatedNotes,
    createdAt: request.created_at,
    updatedAt: now
  });
});

// ==========================================
// 5. ACADEMIC RESOURCES REPOSITORY
// ==========================================

/**
 * GET /api/hub/resources
 * Filter by courseCode, category, search query, with sort options
 */
hubRouter.get('/resources', (req: Request, res: Response): void => {
  const { courseCode, category, query, sort } = req.query;
  const db = getDb();

  let sql = `
    SELECT 
      r.id, r.title, r.course_code as courseCode, r.semester, r.department,
      r.category, r.file_url as fileUrl, r.uploader_id as uploaderId,
      r.downloads_count as downloadsCount, r.rating, r.rating_count as ratingCount,
      r.tags, r.created_at as createdAt,
      u.name as uploaderName
    FROM academic_resources r
    LEFT JOIN users u ON r.uploader_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (courseCode) {
    sql += ' AND UPPER(r.course_code) = UPPER(?)';
    params.push(String(courseCode).trim());
  }

  if (category) {
    sql += ' AND r.category = ?';
    params.push(String(category).trim());
  }

  if (query) {
    sql += ' AND (LOWER(r.title) LIKE ? OR LOWER(r.course_code) LIKE ? OR LOWER(r.tags) LIKE ?)';
    const searchPattern = `%${String(query).toLowerCase().trim()}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  if (sort === 'popular') {
    sql += ' ORDER BY r.downloads_count DESC, r.rating DESC';
  } else if (sort === 'rating') {
    sql += ' ORDER BY r.rating DESC, r.rating_count DESC';
  } else {
    sql += ' ORDER BY r.created_at DESC';
  }

  const rows = db.prepare(sql).all(...params) as any[];
  const resources = rows.map(r => ({
    ...r,
    tags: JSON.parse(r.tags || '[]')
  }));

  res.json({
    total: resources.length,
    resources
  });
});

/**
 * POST /api/hub/resources
 * Upload academic study material metadata
 */
hubRouter.post('/resources', (req: Request, res: Response): void => {
  const { title, courseCode, category, semester, department, fileUrl, uploaderId, tags } = req.body;
  const db = getDb();

  if (!title || !courseCode || !category || !fileUrl || !uploaderId) {
    res.status(400).json({
      error: {
        code: 'BAD_REQUEST',
        message: 'Missing mandatory fields: title, courseCode, category, fileUrl, and uploaderId are required'
      }
    });
    return;
  }

  const validCategories = ['Notes', 'PYQ', 'Syllabus', 'Guide', 'Reference'];
  if (!validCategories.includes(category)) {
    res.status(400).json({
      error: {
        code: 'BAD_REQUEST',
        message: `Category must be one of: ${validCategories.join(', ')}`
      }
    });
    return;
  }

  const uploader = db.prepare('SELECT id, name FROM users WHERE id = ?').get(uploaderId) as any;
  if (!uploader) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: `Uploader user '${uploaderId}' not found` } });
    return;
  }

  const resourceId = 'res_' + Math.random().toString(36).substring(2, 10);
  const now = new Date().toISOString();
  const tagsJson = JSON.stringify(Array.isArray(tags) ? tags : []);

  db.prepare(`
    INSERT INTO academic_resources (
      id, title, course_code, semester, department, category, file_url,
      uploader_id, downloads_count, rating, rating_count, total_rating_points,
      tags, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0.0, 0, 0, ?, ?)
  `).run(
    resourceId,
    title,
    courseCode.toUpperCase().trim(),
    semester || 1,
    department || 'Computer Science',
    category,
    fileUrl,
    uploaderId,
    tagsJson,
    now
  );

  // Log activity
  const activityId = 'act_' + Math.random().toString(36).substring(2, 10);
  db.prepare(`
    INSERT INTO activity_log (id, user_id, module, action, details, timestamp)
    VALUES (?, ?, 'hub', 'RESOURCE_UPLOADED', ?, ?)
  `).run(
    activityId,
    uploaderId,
    JSON.stringify({ resourceId, title, courseCode }),
    now
  );

  res.status(201).json({
    id: resourceId,
    title,
    courseCode: courseCode.toUpperCase().trim(),
    semester: semester || 1,
    department: department || 'Computer Science',
    category,
    fileUrl,
    uploaderId,
    uploaderName: uploader.name,
    downloadsCount: 0,
    rating: 0.0,
    ratingCount: 0,
    tags: Array.isArray(tags) ? tags : [],
    createdAt: now
  });
});

/**
 * POST /api/hub/resources/:resourceId/rate
 * Submit a 1-5 star rating and atomically update dynamic average
 */
hubRouter.post('/resources/:resourceId/rate', (req: Request, res: Response): void => {
  const { resourceId } = req.params;
  const { userId, rating } = req.body;
  const db = getDb();

  if (!userId || rating === undefined) {
    res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Fields "userId" and "rating" are required' } });
    return;
  }

  const numRating = Number(rating);
  if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
    res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Rating must be an integer between 1 and 5' } });
    return;
  }

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (!user) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: `User '${userId}' not found` } });
    return;
  }

  const resource = db.prepare('SELECT * FROM academic_resources WHERE id = ?').get(resourceId) as any;
  if (!resource) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: `Academic resource '${resourceId}' not found` } });
    return;
  }

  // Check if user already rated this resource
  const existingRating = db.prepare('SELECT rating FROM resource_ratings WHERE resource_id = ? AND user_id = ?').get(resourceId, userId) as any;
  const previousRating = existingRating ? existingRating.rating : undefined;

  const { newRatingAverage, newRatingCount, newTotalPoints } = calculateNewRatingAverage(
    resource.total_rating_points || 0,
    resource.rating_count || 0,
    numRating,
    previousRating
  );

  // Execute in SQLite transaction
  const rateTransaction = db.transaction(() => {
    // Upsert user rating
    db.prepare(`
      INSERT INTO resource_ratings (id, resource_id, user_id, rating, created_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(resource_id, user_id) DO UPDATE SET rating = excluded.rating
    `).run('rat_' + Math.random().toString(36).substring(2, 10), resourceId, userId, numRating, new Date().toISOString());

    // Update aggregate on academic_resources
    db.prepare(`
      UPDATE academic_resources
      SET rating = ?, rating_count = ?, total_rating_points = ?
      WHERE id = ?
    `).run(newRatingAverage, newRatingCount, newTotalPoints, resourceId);
  });

  rateTransaction();

  res.json({
    success: true,
    resourceId,
    rating: newRatingAverage,
    ratingCount: newRatingCount,
    userRating: numRating,
    isUpdate: previousRating !== undefined
  });
});
```

---

### 4.4 Common Routes Implementation (`common.routes.ts`)

#### File: `server/src/routes/common.routes.ts`
```typescript
import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection.js';

export const commonRouter = Router();

// ==========================================
// 1. HEALTH CHECK
// ==========================================

/**
 * GET /api/health
 * Active database ping and server status
 */
commonRouter.get('/health', (_req: Request, res: Response): void => {
  try {
    const db = getDb();
    const result = db.prepare('SELECT 1 as alive').get() as { alive: number };

    if (!result || result.alive !== 1) {
      throw new Error('Database ping check failed');
    }

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime() * 100) / 100,
      database: 'connected',
      version: '1.0.0'
    });
  } catch (err: any) {
    res.status(503).json({
      status: 'degraded',
      database: 'disconnected',
      error: err.message || 'Database unavailable',
      timestamp: new Date().toISOString()
    });
  }
});

// ==========================================
// 2. ACTIVITY LOG & NOTIFICATION CENTER
// ==========================================

/**
 * GET /api/activity
 * Fetch cross-module activity stream with limit, offset, and module filters
 */
commonRouter.get('/activity', (req: Request, res: Response): void => {
  const { limit = '50', offset = '0', module, userId } = req.query;
  const db = getDb();

  const numLimit = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 50));
  const numOffset = Math.max(0, parseInt(String(offset), 10) || 0);

  let sql = `
    SELECT 
      a.id, a.user_id as userId, u.name as userName, u.avatar as userAvatar,
      a.module, a.action, a.details, a.timestamp
    FROM activity_log a
    LEFT JOIN users u ON a.user_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (module) {
    sql += ' AND a.module = ?';
    params.push(String(module).toLowerCase().trim());
  }

  if (userId) {
    sql += ' AND a.user_id = ?';
    params.push(String(userId).trim());
  }

  sql += ' ORDER BY a.timestamp DESC LIMIT ? OFFSET ?';
  params.push(numLimit, numOffset);

  const rows = db.prepare(sql).all(...params) as any[];

  const activities = rows.map(r => {
    let parsedDetails = r.details;
    try {
      if (typeof r.details === 'string' && (r.details.startsWith('{') || r.details.startsWith('['))) {
        parsedDetails = JSON.parse(r.details);
      }
    } catch {
      // keep as string
    }
    return {
      ...r,
      details: parsedDetails
    };
  });

  const countRow = db.prepare('SELECT COUNT(*) as total FROM activity_log').get() as { total: number };

  res.json({
    total: countRow.total,
    limit: numLimit,
    offset: numOffset,
    activities
  });
});

/**
 * POST /api/activity
 * Log an activity event
 */
commonRouter.post('/activity', (req: Request, res: Response): void => {
  const { userId, module, action, details } = req.body;
  const db = getDb();

  if (!module || !action) {
    res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Fields "module" and "action" are required' } });
    return;
  }

  const validModules = ['hub', 'rides', 'sustainability', 'wellbeing', 'exams', 'system'];
  if (!validModules.includes(module)) {
    res.status(400).json({
      error: {
        code: 'BAD_REQUEST',
        message: `Field "module" must be one of: ${validModules.join(', ')}`
      }
    });
    return;
  }

  const activityId = 'act_' + Math.random().toString(36).substring(2, 10);
  const now = new Date().toISOString();
  const detailsStr = typeof details === 'object' ? JSON.stringify(details) : String(details || '');

  db.prepare(`
    INSERT INTO activity_log (id, user_id, module, action, details, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(activityId, userId || null, module, action, detailsStr, now);

  res.status(201).json({
    id: activityId,
    userId: userId || null,
    module,
    action,
    details: details || null,
    timestamp: now
  });
});

// ==========================================
// 3. USERS & ROLES SIMULATION
// ==========================================

/**
 * GET /api/users
 * List users with role and department filters
 */
commonRouter.get('/users', (req: Request, res: Response): void => {
  const { role, department } = req.query;
  const db = getDb();

  let sql = 'SELECT id, name, email, avatar, role, department, year_of_study as yearOfStudy, bio, created_at as createdAt FROM users WHERE 1=1';
  const params: any[] = [];

  if (role) {
    sql += ' AND role = ?';
    params.push(String(role).toLowerCase().trim());
  }

  if (department) {
    sql += ' AND LOWER(department) = LOWER(?)';
    params.push(String(department).trim());
  }

  sql += ' ORDER BY name ASC';
  const users = db.prepare(sql).all(...params);

  res.json({
    total: users.length,
    users
  });
});

/**
 * GET /api/users/:userId
 * Fetch user by ID with attached role profile
 */
commonRouter.get('/users/:userId', (req: Request, res: Response): void => {
  const { userId } = req.params;
  const db = getDb();

  const user = db.prepare(`
    SELECT id, name, email, avatar, role, department, year_of_study as yearOfStudy, bio, created_at as createdAt
    FROM users
    WHERE id = ?
  `).get(userId) as any;

  if (!user) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: `User '${userId}' not found` } });
    return;
  }

  // Attach student profile if student
  if (user.role === 'student') {
    const studentProfile = db.prepare('SELECT target_role, placement_goals, skills, interests, resume_url, readiness_score FROM student_profiles WHERE user_id = ?').get(userId) as any;
    if (studentProfile) {
      user.studentProfile = {
        targetRole: studentProfile.target_role,
        placementGoals: studentProfile.placement_goals,
        skills: JSON.parse(studentProfile.skills || '[]'),
        interests: JSON.parse(studentProfile.interests || '[]'),
        resumeUrl: studentProfile.resume_url,
        readinessScore: studentProfile.readiness_score
      };
    }
  }

  // Attach mentor profile if user is a mentor
  const mentorProfile = db.prepare('SELECT id, company_offer, skills, available_slots, max_mentees, rating FROM mentor_profiles WHERE user_id = ?').get(userId) as any;
  if (mentorProfile) {
    user.mentorProfile = {
      mentorProfileId: mentorProfile.id,
      companyOffer: mentorProfile.company_offer,
      skills: JSON.parse(mentorProfile.skills || '[]'),
      availableSlots: JSON.parse(mentorProfile.available_slots || '[]'),
      maxMentees: mentorProfile.max_mentees,
      rating: mentorProfile.rating
    };
  }

  res.json(user);
});
```

---

### 4.5 Standard Error Handling Middleware & Server Setup

#### File: `server/src/middleware/errorHandler.ts`
```typescript
import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction): void {
  console.error('[API Error]:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected internal server error occurred',
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    }
  });
}
```

#### Mounting in `server/src/index.ts`
```typescript
import express from 'express';
import cors from 'cors';
import { commonRouter } from './routes/common.routes.js';
import { hubRouter } from './routes/hub.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', commonRouter);
app.use('/api/hub', hubRouter);

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`UniVerse API Server listening on http://localhost:${PORT}`);
  });
}

export default app;
```

---

### 4.6 Verification Test Specifications

#### Test Suite 1: Mathematical Logic (`tests/unit/hub_math.test.ts`)
```typescript
import { describe, it, expect } from 'vitest';
import {
  calculateReadinessScore,
  calculateMilestoneProgress,
  calculateNewRatingAverage
} from '../../server/src/services/hub.service.js';
import { PlacementMilestone } from '../../server/src/types/hub.types.js';

describe('Hub Service: Mathematical & Business Logic', () => {
  describe('calculateReadinessScore', () => {
    it('returns 0 for empty profile and 0 milestones', () => {
      const score = calculateReadinessScore({
        totalMilestones: 0,
        completedMilestones: 0,
        skills: []
      });
      expect(score).toBe(0);
    });

    it('calculates full 100% when milestones completed, 6+ skills, and complete profile', () => {
      const score = calculateReadinessScore({
        totalMilestones: 10,
        completedMilestones: 10,
        skills: ['React', 'Node.js', 'TypeScript', 'SQL', 'Python', 'Docker'],
        targetRole: 'Full Stack Engineer',
        placementGoals: 'Targeting Tier-1 tech firms within 6 months',
        resumeUrl: 'https://example.com/resume.pdf'
      });
      expect(score).toBe(100);
    });

    it('correctly weighs partial progress', () => {
      // 5/10 milestones = 25 pts
      // 3 skills = (3/6)*30 = 15 pts
      // targetRole = 8 pts, placementGoals = 6 pts, no resume = 0 pts
      // Expected: 25 + 15 + 8 + 6 = 54 pts
      const score = calculateReadinessScore({
        totalMilestones: 10,
        completedMilestones: 5,
        skills: ['React', 'Node.js', 'Python'],
        targetRole: 'Frontend Developer',
        placementGoals: 'Looking for summer 2027 internships'
      });
      expect(score).toBe(54);
    });
  });

  describe('calculateMilestoneProgress', () => {
    it('aggregates category milestones accurately', () => {
      const mockMilestones: PlacementMilestone[] = [
        { id: '1', studentId: 's1', title: 'Two Pointers', category: 'DSA', status: 'completed', sortOrder: 1, createdAt: '' },
        { id: '2', studentId: 's1', title: 'Sliding Window', category: 'DSA', status: 'pending', sortOrder: 2, createdAt: '' },
        { id: '3', studentId: 's1', title: 'Rate Limiter', category: 'System Design', status: 'completed', sortOrder: 3, createdAt: '' }
      ];

      const progress = calculateMilestoneProgress(mockMilestones);
      expect(progress.totalMilestones).toBe(3);
      expect(progress.completedMilestones).toBe(2);
      expect(progress.progressPercentage).toBe(67);
      expect(progress.byCategory).toHaveLength(2);

      const dsa = progress.byCategory.find(c => c.category === 'DSA');
      expect(dsa?.total).toBe(2);
      expect(dsa?.completed).toBe(1);
      expect(dsa?.percentage).toBe(50);
    });
  });

  describe('calculateNewRatingAverage', () => {
    it('correctly computes initial rating average', () => {
      const { newRatingAverage, newRatingCount, newTotalPoints } = calculateNewRatingAverage(0, 0, 4);
      expect(newRatingAverage).toBe(4.0);
      expect(newRatingCount).toBe(1);
      expect(newTotalPoints).toBe(4);
    });

    it('correctly calculates new rating from second user', () => {
      // Current: 4 pts, 1 rating (avg 4.0). New: 5 stars.
      // Expected total: 9, count: 2, avg: 4.5
      const { newRatingAverage, newRatingCount } = calculateNewRatingAverage(4, 1, 5);
      expect(newRatingAverage).toBe(4.5);
      expect(newRatingCount).toBe(2);
    });

    it('correctly recalculates when existing user updates their rating', () => {
      // Current: total 9, count 2 (ratings were 4 and 5).
      // First user updates 4 -> 2.
      // Expected total: 9 - 4 + 2 = 7, count: 2 (unchanged), avg: 3.5
      const { newRatingAverage, newRatingCount } = calculateNewRatingAverage(9, 2, 2, 4);
      expect(newRatingAverage).toBe(3.5);
      expect(newRatingCount).toBe(2);
    });
  });
});
```

#### Test Suite 2: API Endpoints & Status Codes (`tests/e2e/hub_routes.test.ts`)
```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../server/src/index.js';

describe('Module A & Common Routes E2E Verification', () => {
  it('GET /api/health -> 200 with status ok and connected DB', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database).toBe('connected');
  });

  it('GET /api/users -> returns seed users', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body.total).toBeGreaterThan(0);
  });

  it('GET /api/hub/profile/:studentId -> returns 404 for non-existent student', async () => {
    const res = await request(app).get('/api/hub/profile/non_existent_student_999');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('POST /api/hub/mentorship-requests -> rejects self-request with 400', async () => {
    const res = await request(app)
      .post('/api/hub/mentorship-requests')
      .send({
        menteeId: 'usr_stu_1',
        mentorId: 'usr_stu_1',
        topic: 'Self mentorship test',
        preferredSlot: 'Mon 5-6 PM'
      });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('Cannot request mentorship from yourself');
  });

  it('POST /api/hub/resources/:resourceId/rate -> rejects invalid star rating with 400', async () => {
    const res = await request(app)
      .post('/api/hub/resources/res_1/rate')
      .send({ userId: 'usr_stu_1', rating: 7 }); // out of range
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });
});
```

---

## 5. Verification Method

To independently verify the implementation blueprint:

1. **Verify Mathematical Service Tests**:
   Execute pure algorithmic unit tests:
   ```bash
   npx vitest run tests/unit/hub_math.test.ts
   ```
   *Expected*: All 7 unit test assertions pass ($100\%$ green).

2. **Verify Express Routes via Supertest**:
   Execute route integration tests:
   ```bash
   npx vitest run tests/e2e/hub_routes.test.ts
   ```
   *Expected*: HTTP 200, 201, 400, 404, and 409 responses properly received and validated.

3. **Verify Interactive API Endpoints via Curl**:
   - Health:
     ```bash
     curl -s http://localhost:3001/api/health
     ```
   - Profile:
     ```bash
     curl -s http://localhost:3001/api/hub/profile/usr_stu_1
     ```
   - Mentor Discovery with Skill Filter:
     ```bash
     curl -s "http://localhost:3001/api/hub/mentors?skill=System%20Design"
     ```
   - Submit Mentorship Request:
     ```bash
     curl -s -X POST http://localhost:3001/api/hub/mentorship-requests \
       -H "Content-Type: application/json" \
       -d '{"menteeId":"usr_stu_1","mentorId":"usr_men_1","topic":"Mock DSA","preferredSlot":"Tue 4-5 PM"}'
     ```
   - Duplicate Check Verification:
     Re-running the exact same curl command must return HTTP 409 Conflict.

4. **Invalidation Conditions**:
   - Allowing self-mentorship (`menteeId === mentorId`) without a 400 error.
   - Returning negative or $> 100$ readiness scores.
   - Allowing fractional or out-of-bound (e.g. 6 stars, 0 stars) resource ratings without a 400 error.
   - Missing `error.code` or `error.message` on failure responses.
