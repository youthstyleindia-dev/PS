import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection.js';
import { requireResourceOwner } from '../middleware/auth.middleware.js';
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
    db.prepare(`
      INSERT INTO student_profiles (user_id, target_role, placement_goals, skills, interests, resume_url, readiness_score)
      VALUES (?, '', '', '[]', '[]', '', 0)
    `).run(studentId);
    profile = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(studentId);
  }

  const skills = JSON.parse(profile.skills || '[]');
  const interests = JSON.parse(profile.interests || '[]');

  // Check milestones to ensure readiness score is up to date
  const milestones = db.prepare('SELECT id, student_id as studentId, title, category, status, target_date as targetDate, completed_at as completedAt, weight, created_at as createdAt FROM placement_milestones WHERE student_id = ?').all(studentId) as PlacementMilestone[];
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
    id: `sp_${studentId}`,
    userId: user.id,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      department: user.department,
      yearOfStudy: user.year_of_study,
      bio: user.bio
    },
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    department: user.department,
    yearOfStudy: user.year_of_study,
    bio: user.bio,
    targetRole: profile.target_role || '',
    placementGoals: profile.placement_goals ? [profile.placement_goals] : [],
    skills,
    interests,
    resumeUrl: profile.resume_url || '',
    readinessScore,
    gpa: profile.gpa || 8.5,
    updatedAt: profile.updated_at
  });
});

/**
 * PUT /api/hub/profile/:studentId
 * Update student profile skills, interests, target role, placement goals, resume
 */
hubRouter.put('/profile/:studentId', requireResourceOwner('studentId'), (req: Request, res: Response): void => {
  const { studentId } = req.params;
  const { skills, interests, targetRole, placementGoals, resumeUrl, gpa } = req.body;
  const db = getDb();

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(studentId);
  if (!user) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: `Student with id '${studentId}' not found` } });
    return;
  }

  if (skills !== undefined && !Array.isArray(skills)) {
    res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Field "skills" must be an array' } });
    return;
  }
  if (interests !== undefined && !Array.isArray(interests)) {
    res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Field "interests" must be an array' } });
    return;
  }

  const existingProfile = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(studentId) as any;
  const newSkills = skills !== undefined ? skills : JSON.parse(existingProfile?.skills || '[]');
  const newInterests = interests !== undefined ? interests : JSON.parse(existingProfile?.interests || '[]');
  const newTargetRole = targetRole !== undefined ? targetRole : (existingProfile?.target_role || '');
  const newPlacementGoals = typeof placementGoals === 'string'
    ? placementGoals
    : Array.isArray(placementGoals)
      ? placementGoals.join(', ')
      : (existingProfile?.placement_goals || '');
  const newResumeUrl = resumeUrl !== undefined ? resumeUrl : (existingProfile?.resume_url || '');
  const newGpa = gpa !== undefined ? Number(gpa) : (existingProfile?.gpa || 8.5);

  // Recompute readiness score
  const milestones = db.prepare('SELECT id, student_id as studentId, title, category, status, target_date as targetDate, completed_at as completedAt, weight, created_at as createdAt FROM placement_milestones WHERE student_id = ?').all(studentId) as PlacementMilestone[];
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
    INSERT INTO student_profiles (user_id, target_role, placement_goals, skills, interests, resume_url, readiness_score, gpa, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      target_role = excluded.target_role,
      placement_goals = excluded.placement_goals,
      skills = excluded.skills,
      interests = excluded.interests,
      resume_url = excluded.resume_url,
      readiness_score = excluded.readiness_score,
      gpa = excluded.gpa,
      updated_at = excluded.updated_at
  `).run(
    studentId,
    newTargetRole,
    newPlacementGoals,
    JSON.stringify(newSkills),
    JSON.stringify(newInterests),
    newResumeUrl,
    newReadinessScore,
    newGpa,
    now
  );

  res.json({
    userId: studentId,
    targetRole: newTargetRole,
    placementGoals: newPlacementGoals ? [newPlacementGoals] : [],
    skills: newSkills,
    interests: newInterests,
    resumeUrl: newResumeUrl,
    readinessScore: newReadinessScore,
    gpa: newGpa,
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

  const milestonesRaw = db.prepare(`
    SELECT id, student_id as studentId, title, category, status, target_date as targetDate, completed_at as completedAt, weight, created_at as createdAt
    FROM placement_milestones
    WHERE student_id = ?
    ORDER BY created_at ASC
  `).all(studentId) as PlacementMilestone[];

  const progress = calculateMilestoneProgress(milestonesRaw);

  const formattedMilestones = milestonesRaw.map(m => ({
    ...m,
    completed: m.status === 'completed'
  }));

  res.json({
    studentId,
    progress,
    milestones: formattedMilestones
  });
});

/**
 * POST /api/hub/placement-milestones/:studentId/toggle
 * Toggle milestone status between 'completed' and 'pending'
 */
hubRouter.post('/placement-milestones/:studentId/toggle', requireResourceOwner('studentId'), (req: Request, res: Response): void => {
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
  const allMilestones = db.prepare('SELECT id, student_id as studentId, title, category, status, target_date as targetDate, completed_at as completedAt, weight, created_at as createdAt FROM placement_milestones WHERE student_id = ?').all(studentId) as PlacementMilestone[];
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
    completed: nextStatus === 'completed',
    toggledMilestone: {
      id: milestone.id,
      title: milestone.title,
      category: milestone.category,
      status: nextStatus,
      completed: nextStatus === 'completed',
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
      m.id, m.user_id as userId, m.company_offer as companyOffer, m.domain,
      m.skills, m.available_slots as availableSlots, m.max_mentees as maxMentees,
      m.active_mentees as activeMentees, m.rating, m.review_count as reviewCount,
      m.bio, m.created_at as createdAt,
      u.name, u.email, u.avatar, u.department, u.year_of_study as yearOfStudy
    FROM mentors m
    JOIN users u ON m.user_id = u.id
    ORDER BY m.rating DESC, u.name ASC
  `).all() as any[];

  let mentors = mentorsRaw.map(m => {
    const skillsList: string[] = JSON.parse(m.skills || '[]');
    const slotsList: string[] = JSON.parse(m.availableSlots || '[]');
    const isAvailable = (m.activeMentees || 0) < m.maxMentees;

    return {
      id: m.id,
      userId: m.userId,
      user: {
        id: m.userId,
        name: m.name,
        email: m.email,
        avatar: m.avatar,
        role: 'student' as const,
        department: m.department,
        yearOfStudy: m.yearOfStudy,
        bio: m.bio
      },
      name: m.name,
      email: m.email,
      avatar: m.avatar,
      department: m.department,
      yearOfStudy: m.yearOfStudy,
      companyOffer: m.companyOffer,
      roleTitle: m.domain || 'Software Engineer',
      domain: m.domain,
      skills: skillsList,
      availableSlots: slotsList,
      maxMentees: m.maxMentees,
      activeMenteeCount: m.activeMentees || 0,
      isAvailable,
      bio: m.bio || '',
      rating: m.rating,
      reviewCount: m.reviewCount || 0,
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
 * Submit a new mentorship request with duplicate check, mentor validation, and self-request prevention
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

  // Resolve mentor record (mentorId can be mentors.id or mentors.user_id)
  let mentorRecord = db.prepare('SELECT * FROM mentors WHERE id = ?').get(mentorId) as any;
  if (!mentorRecord) {
    mentorRecord = db.prepare('SELECT * FROM mentors WHERE user_id = ?').get(mentorId) as any;
  }

  // Validate mentor existence
  if (!mentorRecord) {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: `Mentor '${mentorId}' not found`
      }
    });
    return;
  }

  const effectiveMentorDbId = mentorRecord.id;
  const effectiveMentorUserId = mentorRecord.user_id;

  // Self-request prevention guardrail
  if (menteeId === effectiveMentorUserId || menteeId === mentorId) {
    res.status(400).json({
      error: {
        code: 'BAD_REQUEST',
        message: 'Cannot request mentorship from yourself'
      }
    });
    return;
  }

  // Verify mentee existence
  const mentee = db.prepare('SELECT id, name FROM users WHERE id = ?').get(menteeId) as any;
  if (!mentee) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: `Mentee '${menteeId}' not found` } });
    return;
  }

  // Duplicate pending request check
  const existingPending = db.prepare(`
    SELECT id FROM mentorship_requests
    WHERE mentee_id = ? AND mentor_id = ? AND status = 'pending'
  `).get(menteeId, effectiveMentorDbId);

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
  `).run(requestId, menteeId, effectiveMentorDbId, topic, preferredSlot, notes || '', now, now);

  // Log activity
  const activityId = 'act_' + Math.random().toString(36).substring(2, 10);
  db.prepare(`
    INSERT INTO activity_log (id, user_id, module, action, details, timestamp)
    VALUES (?, ?, 'hub', 'MENTORSHIP_REQUEST_SENT', ?, ?)
  `).run(
    activityId,
    menteeId,
    JSON.stringify({ menteeName: mentee.name, topic, requestId }),
    now
  );

  res.status(201).json({
    id: requestId,
    menteeId,
    mentorId: effectiveMentorDbId,
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
hubRouter.get('/mentorship-requests/:userId', requireResourceOwner('userId'), (req: Request, res: Response): void => {
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
      r.status, r.notes, r.mentor_notes as mentorNotes, r.created_at as createdAt, r.updated_at as updatedAt,
      u.name as mentorName, u.avatar as mentorAvatar, u.department as mentorDepartment,
      m.company_offer as mentorCompany
    FROM mentorship_requests r
    JOIN mentors m ON r.mentor_id = m.id
    JOIN users u ON m.user_id = u.id
    WHERE r.mentee_id = ?
    ORDER BY r.created_at DESC
  `).all(userId) as any[];

  const received = db.prepare(`
    SELECT 
      r.id, r.mentee_id as menteeId, r.mentor_id as mentorId, r.topic, r.preferred_slot as preferredSlot,
      r.status, r.notes, r.mentor_notes as mentorNotes, r.created_at as createdAt, r.updated_at as updatedAt,
      u.name as menteeName, u.avatar as menteeAvatar, u.department as menteeDepartment
    FROM mentorship_requests r
    JOIN mentors m ON r.mentor_id = m.id
    JOIN users u ON r.mentee_id = u.id
    WHERE m.user_id = ?
    ORDER BY r.created_at DESC
  `).all(userId) as any[];

  // Format sent with nested mentor object for client UI
  const formattedSent = sent.map(s => ({
    ...s,
    mentor: {
      id: s.mentorId,
      companyOffer: s.mentorCompany,
      user: {
        name: s.mentorName,
        avatar: s.mentorAvatar,
        department: s.mentorDepartment
      }
    }
  }));

  res.json({
    userId,
    sent: formattedSent,
    received,
    requests: formattedSent // For direct array consumer support
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

  if (req.user) {
    const mentor = db.prepare('SELECT user_id FROM mentors WHERE id = ?').get(request.mentor_id) as any;
    const isMentorOwner = mentor && req.user.sub === mentor.user_id;
    const isAdmin = req.user.role === 'admin' || (req.user.roles && req.user.roles.includes('admin'));

    if (!isMentorOwner && !isAdmin) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied: Only the designated mentor or an administrator can update this mentorship request.'
        }
      });
      return;
    }
  }

  const now = new Date().toISOString();
  const updatedNotes = notes !== undefined ? notes : request.notes;

  db.prepare(`
    UPDATE mentorship_requests
    SET status = ?, notes = ?, updated_at = ?
    WHERE id = ?
  `).run(status, updatedNotes, now, requestId);

  // If accepted, increment active_mentees count on mentor
  if (status === 'accepted' && request.status !== 'accepted') {
    db.prepare('UPDATE mentors SET active_mentees = active_mentees + 1 WHERE id = ?').run(request.mentor_id);
  }

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
    request.mentee_id,
    actionType,
    JSON.stringify({ requestId, status, notes: updatedNotes }),
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
      r.id, r.title, r.course_code as courseCode, r.course_name as courseName,
      r.semester, r.department, r.category, r.file_url as fileUrl,
      r.file_type as fileType, r.file_size_kb as fileSizeKb,
      r.uploader_id as uploaderId, r.downloads_count as downloadsCount,
      r.rating, r.rating_count as ratingCount, r.rating_count as ratingsCount,
      r.tags, r.created_at as createdAt,
      u.name as uploaderName
    FROM academic_resources r
    LEFT JOIN users u ON r.uploader_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (courseCode && courseCode !== 'All') {
    sql += ' AND UPPER(r.course_code) = UPPER(?)';
    params.push(String(courseCode).trim());
  }

  if (category && category !== 'All') {
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
    fileSize: `${((r.fileSizeKb || 1024) / 1024).toFixed(1)} MB`,
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
  const { title, courseCode, courseName, category, semester, department, fileUrl, fileType, fileSizeKb, uploaderId, tags } = req.body;
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

  const validCategories = ['Notes', 'PYQ', 'Syllabus', 'Guide', 'Cheatsheet', 'Reference'];
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
  const safeCourseName = courseName || `${courseCode} Course Material`;

  db.prepare(`
    INSERT INTO academic_resources (
      id, title, course_code, course_name, category, semester, department,
      file_url, file_type, file_size_kb, uploader_id, downloads_count, rating, rating_count, tags, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0.0, 0, ?, ?)
  `).run(
    resourceId,
    title,
    courseCode.toUpperCase().trim(),
    safeCourseName,
    category,
    semester || 5,
    department || 'Computer Science',
    fileUrl,
    fileType || 'pdf',
    fileSizeKb || 1024,
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
    courseName: safeCourseName,
    semester: semester || 5,
    department: department || 'Computer Science',
    category,
    fileUrl,
    uploaderId,
    uploaderName: uploader.name,
    downloadsCount: 0,
    rating: 0.0,
    ratingCount: 0,
    ratingsCount: 0,
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
  const { userId = 'usr_student_1', rating } = req.body;
  const db = getDb();

  if (rating === undefined || rating === null) {
    res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Field "rating" is required' } });
    return;
  }

  const numRating = Number(rating);
  if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
    res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Rating must be an integer between 1 and 5' } });
    return;
  }

  const resource = db.prepare('SELECT * FROM academic_resources WHERE id = ?').get(resourceId) as any;
  if (!resource) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: `Academic resource '${resourceId}' not found` } });
    return;
  }

  const effectiveUserId = userId || 'usr_student_1';
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(effectiveUserId) as any;
  if (!user) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: `User '${effectiveUserId}' not found` } });
    return;
  }

  // Check if user already rated this resource
  const existingRating = db.prepare('SELECT rating FROM resource_ratings WHERE resource_id = ? AND user_id = ?').get(resourceId, effectiveUserId) as any;
  const previousRating = existingRating ? existingRating.rating : undefined;

  const { newRatingAverage, newRatingCount } = calculateNewRatingAverage(
    resource.rating || 0.0,
    resource.rating_count || 0,
    numRating,
    previousRating
  );

  // Execute atomic upsert
  const rateTx = db.transaction(() => {
    db.prepare(`
      INSERT INTO resource_ratings (id, resource_id, user_id, rating, created_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(resource_id, user_id) DO UPDATE SET rating = excluded.rating
    `).run('rat_' + Math.random().toString(36).substring(2, 10), resourceId, effectiveUserId, numRating, new Date().toISOString());

    db.prepare(`
      UPDATE academic_resources
      SET rating = ?, rating_count = ?
      WHERE id = ?
    `).run(newRatingAverage, newRatingCount, resourceId);
  });

  rateTx();

  res.json({
    success: true,
    resourceId,
    rating: newRatingAverage,
    ratingCount: newRatingCount,
    averageRating: newRatingAverage,
    totalRatings: newRatingCount,
    userRating: numRating,
    isUpdate: previousRating !== undefined
  });
});

// ==========================================
// 6. PLACEMENT DATASET OBSERVATORY & EXPLORER
// ==========================================

/**
 * GET /api/hub/placements
 * Query & browse the full student placement dataset with pagination & multi-facet filters
 */
hubRouter.get('/placements', (req: Request, res: Response): void => {
  const db = getDb();
  const {
    branch,
    academicYear,
    status,
    category,
    search,
    minCgpa,
    minCtc,
    sortBy = 'ctc_lpa',
    sortOrder = 'desc',
    page = '1',
    limit = '20'
  } = req.query;

  const numPage = Math.max(1, parseInt(String(page), 10) || 1);
  const numLimit = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));
  const offset = (numPage - 1) * numLimit;

  let baseSql = 'FROM placement_records WHERE 1=1';
  const params: any[] = [];

  if (branch) {
    baseSql += ' AND LOWER(branch) = LOWER(?)';
    params.push(String(branch).trim());
  }

  if (academicYear) {
    baseSql += ' AND academic_year = ?';
    params.push(String(academicYear).trim());
  }

  if (status) {
    baseSql += ' AND LOWER(status) = LOWER(?)';
    params.push(String(status).trim());
  }

  if (category) {
    baseSql += ' AND LOWER(placement_category) = LOWER(?)';
    params.push(String(category).trim());
  }

  if (minCgpa) {
    baseSql += ' AND cgpa >= ?';
    params.push(parseFloat(String(minCgpa)) || 0);
  }

  if (minCtc) {
    baseSql += ' AND ctc_lpa >= ?';
    params.push(parseFloat(String(minCtc)) || 0);
  }

  if (search) {
    const term = `%${String(search).trim()}%`;
    baseSql += ' AND (name LIKE ? OR email LIKE ? OR student_id LIKE ? OR company_profile LIKE ?)';
    params.push(term, term, term, term);
  }

  // Count total matching
  const countRow = db.prepare(`SELECT COUNT(*) as total ${baseSql}`).get(...params) as { total: number };
  const total = countRow ? countRow.total : 0;

  // Sorting
  const allowedSortCols: Record<string, string> = {
    ctc_lpa: 'ctc_lpa',
    cgpa: 'cgpa',
    name: 'name',
    student_id: 'student_id',
    academic_year: 'academic_year'
  };
  const sortCol = allowedSortCols[String(sortBy)] || 'ctc_lpa';
  const orderDir = String(sortOrder).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const dataSql = `
    SELECT id, student_id as studentId, user_id as userId, name, email,
           academic_year as academicYear, program, branch, status,
           placement_category as placementCategory, company_profile as companyProfile,
           ctc_lpa as ctcLpa, cgpa, category_inferred as categoryInferred, created_at as createdAt
    ${baseSql}
    ORDER BY ${sortCol} ${orderDir} NULLS LAST
    LIMIT ? OFFSET ?
  `;

  const rows = db.prepare(dataSql).all(...params, numLimit, offset) as any[];

  res.json({
    total,
    page: numPage,
    limit: numLimit,
    totalPages: Math.ceil(total / numLimit),
    records: rows
  });
});

/**
 * GET /api/hub/placements/stats
 * Aggregated collegiate placement telemetry across the full 1,997 student dataset
 */
hubRouter.get('/placements/stats', (_req: Request, res: Response): void => {
  const db = getDb();

  // Overview KPIs
  const kpis = db.prepare(`
    SELECT
      COUNT(*) as totalCandidates,
      SUM(CASE WHEN LOWER(status) = 'placed' THEN 1 ELSE 0 END) as totalPlaced,
      ROUND(AVG(CASE WHEN LOWER(status) = 'placed' THEN ctc_lpa ELSE NULL END), 2) as avgCtc,
      MAX(ctc_lpa) as highestCtc,
      ROUND(AVG(cgpa), 2) as avgCgpa
    FROM placement_records
  `).get() as any;

  const total = kpis.totalCandidates || 1;
  const placed = kpis.totalPlaced || 0;
  const placementRate = Math.round((placed / total) * 1000) / 10;

  // Branch breakdown
  const branchBreakdown = db.prepare(`
    SELECT
      branch,
      COUNT(*) as total,
      SUM(CASE WHEN LOWER(status) = 'placed' THEN 1 ELSE 0 END) as placed,
      ROUND(AVG(CASE WHEN LOWER(status) = 'placed' THEN ctc_lpa ELSE NULL END), 2) as avgCtc,
      ROUND(AVG(cgpa), 2) as avgCgpa,
      MAX(ctc_lpa) as highestCtc
    FROM placement_records
    GROUP BY branch
    ORDER BY total DESC
  `).all() as any[];

  const formattedBranches = branchBreakdown.map(b => ({
    ...b,
    placementRate: Math.round(((b.placed || 0) / (b.total || 1)) * 1000) / 10
  }));

  // Category breakdown
  const categoryBreakdown = db.prepare(`
    SELECT
      COALESCE(placement_category, 'Uncategorized') as category,
      COUNT(*) as count,
      ROUND(AVG(ctc_lpa), 2) as avgCtc,
      MAX(ctc_lpa) as maxCtc
    FROM placement_records
    WHERE LOWER(status) = 'placed'
    GROUP BY placement_category
    ORDER BY avgCtc DESC
  `).all() as any[];

  // Status breakdown
  const statusBreakdown = db.prepare(`
    SELECT
      status,
      COUNT(*) as count,
      ROUND((COUNT(*) * 100.0) / (SELECT COUNT(*) FROM placement_records), 1) as percentage
    FROM placement_records
    GROUP BY status
    ORDER BY count DESC
  `).all() as any[];

  // Year breakdown
  const yearBreakdown = db.prepare(`
    SELECT
      academic_year as academicYear,
      COUNT(*) as total,
      SUM(CASE WHEN LOWER(status) = 'placed' THEN 1 ELSE 0 END) as placed,
      ROUND(AVG(CASE WHEN LOWER(status) = 'placed' THEN ctc_lpa ELSE NULL END), 2) as avgCtc
    FROM placement_records
    GROUP BY academic_year
    ORDER BY academic_year ASC
  `).all() as any[];

  // Top company recruiters
  const topRecruiters = db.prepare(`
    SELECT
      company_profile as companyCode,
      COUNT(*) as offersCount,
      ROUND(AVG(ctc_lpa), 2) as avgCtc,
      MAX(ctc_lpa) as maxCtc,
      placement_category as tier
    FROM placement_records
    WHERE company_profile IS NOT NULL AND company_profile != ''
    GROUP BY company_profile
    ORDER BY offersCount DESC
    LIMIT 10
  `).all() as any[];

  res.json({
    provenance: '[AUTHENTIC DATASET]',
    kpis: {
      totalCandidates: total,
      totalPlaced: placed,
      placementRate,
      avgCtc: kpis.avgCtc || 0,
      highestCtc: kpis.highestCtc || 0,
      avgCgpa: kpis.avgCgpa || 0
    },
    branchBreakdown: formattedBranches,
    categoryBreakdown,
    statusBreakdown,
    yearBreakdown,
    topRecruiters
  });
});

/**
 * GET /api/hub/placements/student/:idOrEmail
 * Query detailed placement, profile, and focus activity for a specific student
 */
hubRouter.get('/placements/student/:idOrEmail', (req: Request, res: Response): void => {
  const { idOrEmail } = req.params;
  const db = getDb();

  const record = db.prepare(`
    SELECT pr.*, u.avatar, u.department as userDepartment, sp.readiness_score as readinessScore, sp.skills, sp.placement_goals as placementGoals
    FROM placement_records pr
    LEFT JOIN users u ON pr.user_id = u.id OR LOWER(pr.email) = LOWER(u.email)
    LEFT JOIN student_profiles sp ON u.id = sp.user_id
    WHERE LOWER(pr.email) = LOWER(?) OR LOWER(pr.student_id) = LOWER(?) OR pr.id = ? OR pr.user_id = ?
  `).get(idOrEmail, idOrEmail, idOrEmail, idOrEmail) as any;

  if (!record) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: `Placement record '${idOrEmail}' not found` } });
    return;
  }

  // Fetch student focus session count
  const focusCount = db.prepare('SELECT COUNT(*) as count FROM focus_sessions WHERE user_id = ?').get(record.user_id) as { count: number };

  res.json({
    ...record,
    focusSessionsCount: focusCount ? focusCount.count : 0,
    skills: record.skills ? JSON.parse(record.skills) : []
  });
});
