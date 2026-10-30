import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection.js';
import { requireAuth } from '../middleware/auth.middleware.js';

export const mentorRouter = Router();

export interface ExplainableMatchScore {
  totalScore: number; // 0 to 100
  skillMatchCount: number;
  matchedSkills: string[];
  topicMatchCount: number;
  matchedTopics: string[];
  availabilityScore: number;
  formatMatch: boolean;
  matchReason: string;
}

/**
 * Calculates an explainable, deterministic match score between student query/skills and a mentor.
 */
export function calculateExplainableMatch(
  mentor: {
    skills: string[];
    topics: string[];
    availableSlots: string[];
    preferredFormat: string;
  },
  query: string = '',
  searchedSkills: string[] = [],
  preferredFormat: string = ''
): ExplainableMatchScore {
  const queryLower = query.toLowerCase().trim();
  const queryTerms = queryLower.split(/\s+/).filter(Boolean);

  // 1. Skill overlap (Weight: 45)
  const matchedSkills: string[] = [];
  mentor.skills.forEach(skill => {
    const sLower = skill.toLowerCase();
    const inSearched = searchedSkills.some(reqSkill => reqSkill.toLowerCase() === sLower);
    const inQuery = queryTerms.some(term => sLower.includes(term));
    if (inSearched || inQuery) {
      if (!matchedSkills.includes(skill)) matchedSkills.push(skill);
    }
  });

  const skillScore = Math.min(45, matchedSkills.length * 15);

  // 2. Topic overlap (Weight: 35)
  const matchedTopics: string[] = [];
  mentor.topics.forEach(topic => {
    const tLower = topic.toLowerCase();
    const inQuery = queryTerms.some(term => tLower.includes(term));
    if (inQuery) {
      if (!matchedTopics.includes(topic)) matchedTopics.push(topic);
    }
  });

  const topicScore = Math.min(35, matchedTopics.length * 12);

  // 3. Availability score (Weight: 10)
  const availabilityScore = mentor.availableSlots.length > 0 ? 10 : 0;

  // 4. Format match (Weight: 10)
  const formatMatch = preferredFormat
    ? mentor.preferredFormat.toLowerCase() === preferredFormat.toLowerCase() || mentor.preferredFormat === 'hybrid'
    : true;
  const formatScore = formatMatch ? 10 : 0;

  const totalScore = Math.min(100, skillScore + topicScore + availabilityScore + formatScore);

  // Construct transparent explanation string
  const reasons: string[] = [];
  if (matchedSkills.length > 0) {
    reasons.push(`Matches skills: ${matchedSkills.slice(0, 3).join(', ')}`);
  }
  if (matchedTopics.length > 0) {
    reasons.push(`Advises on: ${matchedTopics.slice(0, 2).join(', ')}`);
  }
  if (mentor.availableSlots.length > 0) {
    reasons.push(`Available (${mentor.availableSlots[0]})`);
  }

  const matchReason = reasons.length > 0
    ? reasons.join(' • ')
    : 'Available senior mentor in department';

  return {
    totalScore,
    skillMatchCount: matchedSkills.length,
    matchedSkills,
    topicMatchCount: matchedTopics.length,
    matchedTopics,
    availabilityScore,
    formatMatch,
    matchReason
  };
}

/**
 * GET /api/mentors
 * Search mentors with skill filters, ML discovery, and explainable scoring.
 */
mentorRouter.get('/', requireAuth, (req: Request, res: Response): void => {
  try {
    const db = getDb();
    const {
      query = '',
      skills = '',
      department = '',
      format = '',
      available_only = 'false',
      sort = 'relevance'
    } = req.query as Record<string, string>;

    const skillList = skills ? skills.split(',').map(s => s.trim()).filter(Boolean) : [];

    const mentorsRaw = db.prepare(`
      SELECT 
        m.id, m.user_id, m.company_offer, m.domain, m.skills, m.available_slots,
        m.max_mentees, m.active_mentees, m.rating, m.review_count, m.bio,
        m.topics, m.projects, m.preferred_format, m.weekly_capacity, m.graduation_year,
        m.is_approved, m.is_demo, m.created_at,
        u.name, u.email, u.avatar, u.department, u.year_of_study
      FROM mentors m
      JOIN users u ON m.user_id = u.id
      WHERE m.is_approved = 1
    `).all() as any[];

    let mentors = mentorsRaw.map(m => {
      const parsedSkills: string[] = JSON.parse(m.skills || '[]');
      const parsedSlots: string[] = JSON.parse(m.available_slots || '[]');
      const parsedTopics: string[] = JSON.parse(m.topics || '[]');
      const parsedProjects: any[] = JSON.parse(m.projects || '[]');

      const matchAnalysis = calculateExplainableMatch(
        {
          skills: parsedSkills,
          topics: parsedTopics,
          availableSlots: parsedSlots,
          preferredFormat: m.preferred_format || 'chat'
        },
        query,
        skillList,
        format
      );

      return {
        id: m.id,
        userId: m.user_id,
        name: m.name,
        email: m.email,
        avatar: m.avatar,
        department: m.department,
        yearOfStudy: m.year_of_study,
        graduationYear: m.graduation_year || 2026,
        companyOffer: m.company_offer,
        domain: m.domain,
        skills: parsedSkills,
        topics: parsedTopics,
        projects: parsedProjects,
        availableSlots: parsedSlots,
        preferredFormat: m.preferred_format || 'chat',
        maxMentees: m.max_mentees,
        activeMentees: m.active_mentees,
        isAvailable: m.active_mentees < m.max_mentees && parsedSlots.length > 0,
        rating: m.rating,
        reviewCount: m.review_count,
        bio: m.bio,
        isDemo: Boolean(m.is_demo),
        matchScore: matchAnalysis.totalScore,
        matchReason: matchAnalysis.matchReason,
        matchedSkills: matchAnalysis.matchedSkills,
        matchedTopics: matchAnalysis.matchedTopics
      };
    });

    // Filter by department if specified
    if (department) {
      mentors = mentors.filter(m => m.department?.toLowerCase().includes(department.toLowerCase()));
    }

    // Filter by skills if specified
    if (skillList.length > 0) {
      mentors = mentors.filter(m =>
        skillList.some(s => m.skills.some(ms => ms.toLowerCase().includes(s.toLowerCase())))
      );
    }

    // Filter by available slots
    if (available_only === 'true') {
      mentors = mentors.filter(m => m.isAvailable);
    }

    // Sorting
    if (sort === 'relevance' && (query || skillList.length > 0)) {
      mentors.sort((a, b) => b.matchScore - a.matchScore);
    } else if (sort === 'rating') {
      mentors.sort((a, b) => b.rating - a.rating);
    } else if (sort === 'experience') {
      mentors.sort((a, b) => b.projects.length - a.projects.length);
    }

    res.json({
      success: true,
      data: {
        mentors,
        total: mentors.length,
        query,
        appliedFilters: { skills: skillList, department, format, available_only }
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message || 'Failed to fetch mentors' } });
  }
});

/**
 * GET /api/mentors/:mentorId
 * Detailed profile of a senior mentor.
 */
mentorRouter.get('/:mentorId', requireAuth, (req: Request, res: Response): void => {
  try {
    const db = getDb();
    const { mentorId } = req.params;

    const m = db.prepare(`
      SELECT 
        m.id, m.user_id, m.company_offer, m.domain, m.skills, m.available_slots,
        m.max_mentees, m.active_mentees, m.rating, m.review_count, m.bio,
        m.topics, m.projects, m.preferred_format, m.weekly_capacity, m.graduation_year,
        m.is_approved, m.is_demo, m.created_at,
        u.name, u.email, u.avatar, u.department, u.year_of_study
      FROM mentors m
      JOIN users u ON m.user_id = u.id
      WHERE (m.id = ? OR m.user_id = ?) AND m.is_approved = 1
    `).get(mentorId, mentorId) as any;

    if (!m) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Mentor profile not found' } });
      return;
    }

    const parsedSkills = JSON.parse(m.skills || '[]');
    const parsedSlots = JSON.parse(m.available_slots || '[]');
    const parsedTopics = JSON.parse(m.topics || '[]');
    const parsedProjects = JSON.parse(m.projects || '[]');

    res.json({
      success: true,
      data: {
        id: m.id,
        userId: m.user_id,
        name: m.name,
        email: m.email,
        avatar: m.avatar,
        department: m.department,
        yearOfStudy: m.year_of_study,
        graduationYear: m.graduation_year || 2026,
        companyOffer: m.company_offer,
        domain: m.domain,
        skills: parsedSkills,
        topics: parsedTopics,
        projects: parsedProjects,
        availableSlots: parsedSlots,
        preferredFormat: m.preferred_format || 'chat',
        maxMentees: m.max_mentees,
        activeMentees: m.active_mentees,
        isAvailable: m.active_mentees < m.max_mentees && parsedSlots.length > 0,
        rating: m.rating,
        reviewCount: m.review_count,
        bio: m.bio,
        isDemo: Boolean(m.is_demo),
        createdAt: m.created_at
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message || 'Failed to fetch mentor details' } });
  }
});

/**
 * GET /api/mentorship/requests
 * Get mentorship requests for the currently authenticated user (as student or as mentor).
 */
mentorRouter.get('/requests/all', requireAuth, (req: Request, res: Response): void => {
  try {
    const db = getDb();
    const userId = req.user?.sub;

    // Sent by this student
    const sent = db.prepare(`
      SELECT 
        r.id, r.mentee_id, r.mentor_id, r.topic, r.preferred_slot, r.status,
        r.notes, r.mentor_notes, r.created_at, r.updated_at,
        u.name as mentor_name, u.avatar as mentor_avatar, u.department as mentor_department,
        m.company_offer as mentor_company,
        c.id as conversation_id
      FROM mentorship_requests r
      JOIN mentors m ON r.mentor_id = m.id
      JOIN users u ON m.user_id = u.id
      LEFT JOIN mentorship_conversations c ON c.request_id = r.id
      WHERE r.mentee_id = ?
      ORDER BY r.created_at DESC
    `).all(userId) as any[];

    // Received by this mentor
    const mentorRecord = db.prepare('SELECT id FROM mentors WHERE user_id = ?').get(userId) as any;
    let received: any[] = [];
    if (mentorRecord) {
      received = db.prepare(`
        SELECT 
          r.id, r.mentee_id, r.mentor_id, r.topic, r.preferred_slot, r.status,
          r.notes, r.mentor_notes, r.created_at, r.updated_at,
          u.name as mentee_name, u.avatar as mentee_avatar, u.department as mentee_department, u.year_of_study as mentee_year,
          c.id as conversation_id
        FROM mentorship_requests r
        JOIN users u ON r.mentee_id = u.id
        LEFT JOIN mentorship_conversations c ON c.request_id = r.id
        WHERE r.mentor_id = ?
        ORDER BY r.created_at DESC
      `).all(mentorRecord.id) as any[];
    }

    res.json({
      success: true,
      data: {
        sent: sent.map(s => ({
          id: s.id,
          menteeId: s.mentee_id,
          mentorId: s.mentor_id,
          topic: s.topic,
          preferredSlot: s.preferred_slot,
          status: s.status,
          notes: s.notes,
          mentorNotes: s.mentor_notes,
          conversationId: s.conversation_id,
          createdAt: s.created_at,
          updatedAt: s.updated_at,
          mentor: {
            name: s.mentor_name,
            avatar: s.mentor_avatar,
            department: s.mentor_department,
            company: s.mentor_company
          }
        })),
        received: received.map(r => ({
          id: r.id,
          menteeId: r.mentee_id,
          mentorId: r.mentor_id,
          topic: r.topic,
          preferredSlot: r.preferred_slot,
          status: r.status,
          notes: r.notes,
          mentorNotes: r.mentor_notes,
          conversationId: r.conversation_id,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
          mentee: {
            name: r.mentee_name,
            avatar: r.mentee_avatar,
            department: r.mentee_department,
            year: r.mentee_year
          }
        }))
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message || 'Failed to fetch requests' } });
  }
});

/**
 * POST /api/mentorship/requests
 * Submit a guidance request to a mentor.
 */
mentorRouter.post('/requests', requireAuth, (req: Request, res: Response): void => {
  try {
    const db = getDb();
    const userId = req.user?.sub;
    const { mentor_id, topic, preferred_slot, notes = '' } = req.body;

    if (!mentor_id || !topic || !preferred_slot) {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'mentor_id, topic, and preferred_slot are required' } });
      return;
    }

    // Resolve mentor
    let mentor = db.prepare('SELECT * FROM mentors WHERE id = ?').get(mentor_id) as any;
    if (!mentor) {
      mentor = db.prepare('SELECT * FROM mentors WHERE user_id = ?').get(mentor_id) as any;
    }

    if (!mentor) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Mentor not found' } });
      return;
    }

    if (mentor.user_id === userId) {
      res.status(400).json({ error: { code: 'SELF_REQUEST', message: 'You cannot request mentorship from yourself.' } });
      return;
    }

    // Check duplicate pending request
    const existing = db.prepare(`
      SELECT id FROM mentorship_requests 
      WHERE mentee_id = ? AND mentor_id = ? AND status = 'pending'
    `).get(userId, mentor.id) as any;

    if (existing) {
      res.status(409).json({ error: { code: 'DUPLICATE_REQUEST', message: 'You already have a pending mentorship request with this senior.' } });
      return;
    }

    const reqId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    db.prepare(`
      INSERT INTO mentorship_requests (id, mentee_id, mentor_id, topic, preferred_slot, status, notes)
      VALUES (?, ?, ?, ?, ?, 'pending', ?)
    `).run(reqId, userId, mentor.id, String(topic).trim(), String(preferred_slot).trim(), String(notes || '').trim());

    // Notify mentor
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, module, type, link_url)
      VALUES (?, ?, 'New Mentorship Request', 'A student requested guidance on ' || ?, 'hub', 'info', '/mentors')
    `).run(`notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, mentor.user_id, topic);

    res.status(201).json({
      success: true,
      data: {
        id: reqId,
        menteeId: userId,
        mentorId: mentor.id,
        topic,
        preferredSlot: preferred_slot,
        status: 'pending',
        notes
      },
      message: 'Mentorship request submitted successfully'
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message || 'Failed to submit mentorship request' } });
  }
});

/**
 * PATCH /api/mentorship/requests/:requestId
 * Accept, decline, or complete a mentorship request.
 * Automatically provisions a private conversation when accepted!
 */
mentorRouter.patch('/requests/:requestId', requireAuth, (req: Request, res: Response): void => {
  try {
    const db = getDb();
    const userId = req.user?.sub;
    const { requestId } = req.params;
    const { status, mentor_notes = '' } = req.body;

    if (!['accepted', 'rejected', 'completed'].includes(status)) {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Status must be accepted, rejected, or completed' } });
      return;
    }

    const request = db.prepare('SELECT * FROM mentorship_requests WHERE id = ?').get(requestId) as any;
    if (!request) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Mentorship request not found' } });
      return;
    }

    const mentor = db.prepare('SELECT user_id FROM mentors WHERE id = ?').get(request.mentor_id) as any;
    if (!mentor || mentor.user_id !== userId) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only the designated mentor can respond to this request.' } });
      return;
    }

    let conversationId: string | null = null;

    db.transaction(() => {
      db.prepare(`
        UPDATE mentorship_requests 
        SET status = ?, mentor_notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(status, String(mentor_notes || ''), requestId);

      if (status === 'accepted') {
        db.prepare('UPDATE mentors SET active_mentees = active_mentees + 1 WHERE id = ?').run(request.mentor_id);

        // Check if conversation already exists or create new
        const existingConv = db.prepare('SELECT id FROM mentorship_conversations WHERE request_id = ?').get(requestId) as any;
        if (existingConv) {
          conversationId = existingConv.id;
        } else {
          conversationId = `mconv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          db.prepare(`
            INSERT INTO mentorship_conversations (id, request_id, mentee_id, mentor_id, status)
            VALUES (?, ?, ?, ?, 'active')
          `).run(conversationId, requestId, request.mentee_id, mentor.user_id);

          // Add opening welcome message
          const msgId = `mmsg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          const initialGreeting = mentor_notes
            ? `Hi! I accepted your guidance request. ${mentor_notes}`
            : `Hi! I've accepted your guidance request on '${request.topic}'. Let's connect here!`;
          db.prepare(`
            INSERT INTO mentorship_messages (id, conversation_id, sender_id, content)
            VALUES (?, ?, ?, ?)
          `).run(msgId, conversationId, mentor.user_id, initialGreeting);
        }

        // Notify student
        db.prepare(`
          INSERT INTO notifications (id, user_id, title, message, module, type, link_url)
          VALUES (?, ?, 'Mentorship Request Accepted', 'Your senior mentor accepted your guidance request! Private chat is now open.', 'hub', 'success', '/mentors')
        `).run(`notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, request.mentee_id);
      } else if (status === 'rejected') {
        db.prepare(`
          INSERT INTO notifications (id, user_id, title, message, module, type, link_url)
          VALUES (?, ?, 'Mentorship Request Update', 'The mentor is currently at capacity or unable to take your request.', 'hub', 'info', '/mentors')
        `).run(`notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, request.mentee_id);
      }
    })();

    res.json({
      success: true,
      data: {
        id: requestId,
        status,
        conversationId
      },
      message: `Mentorship request marked as ${status}`
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message || 'Failed to update request' } });
  }
});

/**
 * GET /api/mentorship/conversations/:conversationId
 * Access private conversation between student and mentor.
 */
mentorRouter.get('/conversations/:conversationId', requireAuth, (req: Request, res: Response): void => {
  try {
    const db = getDb();
    const userId = req.user?.sub;
    const { conversationId } = req.params;

    const conv = db.prepare('SELECT * FROM mentorship_conversations WHERE id = ?').get(conversationId) as any;
    if (!conv) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Conversation not found' } });
      return;
    }

    // Role privacy guard: only mentee or mentor can access
    if (conv.mentee_id !== userId && conv.mentor_id !== userId) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied: private mentorship conversation.' } });
      return;
    }

    const messages = db.prepare(`
      SELECT m.*, u.name as sender_name, u.avatar as sender_avatar, u.role as sender_role
      FROM mentorship_messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = ?
      ORDER BY m.created_at ASC
    `).all(conversationId) as any[];

    // Mark unread messages as read
    db.prepare(`
      UPDATE mentorship_messages 
      SET is_read = 1 
      WHERE conversation_id = ? AND sender_id != ? AND is_read = 0
    `).run(conversationId, userId);

    res.json({
      success: true,
      data: {
        conversation: {
          id: conv.id,
          requestId: conv.request_id,
          menteeId: conv.mentee_id,
          mentorId: conv.mentor_id,
          status: conv.status,
          createdAt: conv.created_at
        },
        messages: messages.map(m => ({
          id: m.id,
          conversationId: m.conversation_id,
          senderId: m.sender_id,
          content: m.content,
          isRead: Boolean(m.is_read),
          createdAt: m.created_at,
          sender: {
            id: m.sender_id,
            name: m.sender_name,
            avatar: m.sender_avatar,
            role: m.sender_role
          }
        }))
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message || 'Failed to fetch conversation' } });
  }
});

/**
 * POST /api/mentorship/conversations/:conversationId/messages
 * Send message in private mentorship chat.
 */
mentorRouter.post('/conversations/:conversationId/messages', requireAuth, (req: Request, res: Response): void => {
  try {
    const db = getDb();
    const userId = req.user?.sub;
    const { conversationId } = req.params;
    const { content } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Message content cannot be empty' } });
      return;
    }

    const conv = db.prepare('SELECT * FROM mentorship_conversations WHERE id = ?').get(conversationId) as any;
    if (!conv) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Conversation not found' } });
      return;
    }

    if (conv.mentee_id !== userId && conv.mentor_id !== userId) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied: private mentorship conversation.' } });
      return;
    }

    const msgId = `mmsg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const sanitizedContent = String(content).trim().slice(0, 5000);

    db.prepare(`
      INSERT INTO mentorship_messages (id, conversation_id, sender_id, content)
      VALUES (?, ?, ?, ?)
    `).run(msgId, conversationId, userId, sanitizedContent);

    // Update conversation timestamp
    db.prepare('UPDATE mentorship_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(conversationId);

    // Notify recipient
    const recipientId = conv.mentee_id === userId ? conv.mentor_id : conv.mentee_id;
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, module, type, link_url)
      VALUES (?, ?, 'New Mentorship Message', 'You received a message in your mentorship conversation.', 'hub', 'info', '/mentors')
    `).run(`notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, recipientId);

    const msg = db.prepare(`
      SELECT m.*, u.name as sender_name, u.avatar as sender_avatar, u.role as sender_role
      FROM mentorship_messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `).get(msgId) as any;

    res.status(201).json({
      success: true,
      data: {
        id: msg.id,
        conversationId: msg.conversation_id,
        senderId: msg.sender_id,
        content: msg.content,
        isRead: false,
        createdAt: msg.created_at,
        sender: {
          id: msg.sender_id,
          name: msg.sender_name,
          avatar: msg.sender_avatar,
          role: msg.sender_role
        }
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message || 'Failed to send message' } });
  }
});
