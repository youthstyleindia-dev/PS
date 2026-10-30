import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection.js';
import { requireAuth } from '../middleware/auth.middleware.js';

export const campusRouter = Router();

/**
 * GET /api/campus/directory
 * Search campus buildings, facilities, labs, library, and transportation nodes.
 */
campusRouter.get('/directory', requireAuth, (req: Request, res: Response): void => {
  try {
    const db = getDb();
    const { category, query } = req.query as Record<string, string>;

    const conditions: string[] = [];
    const params: any[] = [];

    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }

    if (query && query.trim()) {
      conditions.push('(name LIKE ? OR building LIKE ? OR description LIKE ?)');
      const wild = `%${query.trim()}%`;
      params.push(wild, wild, wild);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT id, name, category, building, zone, description, hours, accessibility, coord_x, coord_y, node_id, is_demo
      FROM campus_locations
      ${whereClause}
      ORDER BY name ASC
    `;

    const locations = db.prepare(sql).all(...params) as any[];

    res.json({
      success: true,
      data: {
        locations: locations.map(l => ({
          id: l.id,
          name: l.name,
          category: l.category,
          building: l.building,
          zone: l.zone,
          description: l.description,
          hours: l.hours,
          accessibility: l.accessibility,
          coordinates: { x: l.coord_x, y: l.coord_y },
          nodeId: l.node_id,
          isDemo: Boolean(l.is_demo)
        })),
        total: locations.length
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message || 'Failed to fetch directory' } });
  }
});

/**
 * GET /api/campus/events
 * Discover upcoming campus events, workshops, hackathons, and seminars.
 */
campusRouter.get('/events', requireAuth, (req: Request, res: Response): void => {
  try {
    const db = getDb();
    const userId = req.user?.sub;
    const { category, query, status = 'upcoming' } = req.query as Record<string, string>;

    const conditions: string[] = [];
    const params: any[] = [];

    if (status) {
      conditions.push('e.status = ?');
      params.push(status);
    }

    if (category) {
      conditions.push('e.category = ?');
      params.push(category);
    }

    if (query && query.trim()) {
      conditions.push('(e.title LIKE ? OR e.description LIKE ?)');
      const wild = `%${query.trim()}%`;
      params.push(wild, wild);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT 
        e.*, u.name as organizer_name, u.email as organizer_email,
        c.name as community_name,
        (SELECT COUNT(1) FROM event_registrations r WHERE r.event_id = e.id AND r.user_id = ? AND r.status = 'confirmed') as has_rsvpd
      FROM campus_events e
      JOIN users u ON e.organizer_id = u.id
      LEFT JOIN communities c ON e.community_id = c.id
      ${whereClause}
      ORDER BY e.start_time ASC
    `;

    const rows = db.prepare(sql).all(userId || '', ...params) as any[];

    res.json({
      success: true,
      data: {
        events: rows.map(r => ({
          id: r.id,
          title: r.title,
          description: r.description,
          category: r.category,
          organizerId: r.organizer_id,
          organizerName: r.organizer_name,
          communityId: r.community_id,
          communityName: r.community_name,
          venue: r.venue,
          startTime: r.start_time,
          endTime: r.end_time,
          capacity: r.capacity,
          rsvpCount: r.rsvp_count,
          status: r.status,
          tags: JSON.parse(r.tags || '[]'),
          isDemo: Boolean(r.is_demo),
          hasRsvpd: Boolean(r.has_rsvpd),
          createdAt: r.created_at
        })),
        total: rows.length
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message || 'Failed to fetch events' } });
  }
});

/**
 * POST /api/campus/events/:eventId/rsvp
 * Register or cancel RSVP for an event.
 */
campusRouter.post('/events/:eventId/rsvp', requireAuth, (req: Request, res: Response): void => {
  try {
    const db = getDb();
    const userId = req.user?.sub;
    const { eventId } = req.params;

    const event = db.prepare('SELECT id, title, capacity, rsvp_count, status FROM campus_events WHERE id = ?').get(eventId) as any;
    if (!event) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Event not found' } });
      return;
    }

    if (event.status !== 'upcoming') {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: `Cannot RSVP to ${event.status} event` } });
      return;
    }

    const existing = db.prepare('SELECT id, status FROM event_registrations WHERE event_id = ? AND user_id = ?').get(eventId, userId) as any;

    let registered = false;
    let newCount = event.rsvp_count;

    if (existing && existing.status === 'confirmed') {
      // Cancel RSVP
      db.prepare("UPDATE event_registrations SET status = 'cancelled' WHERE id = ?").run(existing.id);
      db.prepare('UPDATE campus_events SET rsvp_count = MAX(0, rsvp_count - 1) WHERE id = ?').run(eventId);
      newCount = Math.max(0, event.rsvp_count - 1);
      registered = false;
    } else {
      // Enforce capacity constraint
      if (event.rsvp_count >= event.capacity) {
        res.status(409).json({ error: { code: 'EVENT_FULL', message: 'This event has reached full capacity.' } });
        return;
      }

      if (existing) {
        db.prepare("UPDATE event_registrations SET status = 'confirmed', registered_at = CURRENT_TIMESTAMP WHERE id = ?").run(existing.id);
      } else {
        const regId = `ereg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        db.prepare(`
          INSERT INTO event_registrations (id, event_id, user_id, status)
          VALUES (?, ?, ?, 'confirmed')
        `).run(regId, eventId, userId);
      }

      db.prepare('UPDATE campus_events SET rsvp_count = rsvp_count + 1 WHERE id = ?').run(eventId);
      newCount = event.rsvp_count + 1;
      registered = true;

      // Add student notification
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, module, type, link_url)
        VALUES (?, ?, 'Event RSVP Confirmed', 'You are registered for: ' || ?, 'hub', 'success', '/events')
      `).run(`notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, userId, event.title);
    }

    res.json({
      success: true,
      data: {
        registered,
        rsvpCount: newCount
      },
      message: registered ? 'RSVP confirmed' : 'RSVP cancelled'
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message || 'Failed to update RSVP' } });
  }
});

/**
 * GET /api/campus/communities
 * List campus communities, societies, and interest clubs.
 */
campusRouter.get('/communities', requireAuth, (req: Request, res: Response): void => {
  try {
    const db = getDb();
    const userId = req.user?.sub;
    const { category } = req.query as Record<string, string>;

    const conditions: string[] = [];
    const params: any[] = [];

    if (category) {
      conditions.push('c.category = ?');
      params.push(category);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT 
        c.*,
        (SELECT COUNT(1) FROM community_memberships m WHERE m.community_id = c.id AND m.user_id = ?) as is_member
      FROM communities c
      ${whereClause}
      ORDER BY c.member_count DESC
    `;

    const rows = db.prepare(sql).all(userId || '', ...params) as any[];

    res.json({
      success: true,
      data: {
        communities: rows.map(r => ({
          id: r.id,
          name: r.name,
          slug: r.slug,
          description: r.description,
          category: r.category,
          avatar: r.avatar,
          memberCount: r.member_count,
          isMember: Boolean(r.is_member),
          isDemo: Boolean(r.is_demo),
          createdAt: r.created_at
        })),
        total: rows.length
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message || 'Failed to fetch communities' } });
  }
});

/**
 * POST /api/campus/communities/:communityId/join
 * Join or leave a campus community.
 */
campusRouter.post('/communities/:communityId/join', requireAuth, (req: Request, res: Response): void => {
  try {
    const db = getDb();
    const userId = req.user?.sub;
    const { communityId } = req.params;

    const comm = db.prepare('SELECT id, name, member_count FROM communities WHERE id = ?').get(communityId) as any;
    if (!comm) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Community not found' } });
      return;
    }

    const existing = db.prepare('SELECT id FROM community_memberships WHERE community_id = ? AND user_id = ?').get(communityId, userId) as any;

    let isMember = false;
    let newCount = comm.member_count;

    if (existing) {
      db.prepare('DELETE FROM community_memberships WHERE id = ?').run(existing.id);
      db.prepare('UPDATE communities SET member_count = MAX(0, member_count - 1) WHERE id = ?').run(communityId);
      newCount = Math.max(0, comm.member_count - 1);
      isMember = false;
    } else {
      const memId = `cmem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      db.prepare('INSERT INTO community_memberships (id, community_id, user_id, role) VALUES (?, ?, ?, ?)').run(memId, communityId, userId, 'member');
      db.prepare('UPDATE communities SET member_count = member_count + 1 WHERE id = ?').run(communityId);
      newCount = comm.member_count + 1;
      isMember = true;
    }

    res.json({
      success: true,
      data: {
        isMember,
        memberCount: newCount
      },
      message: isMember ? `Joined ${comm.name}` : `Left ${comm.name}`
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message || 'Failed to update membership' } });
  }
});

/**
 * GET /api/campus/announcements
 * Retrieve official authorized announcements from faculty, wardens, or administrators.
 */
campusRouter.get('/announcements', requireAuth, (req: Request, res: Response): void => {
  try {
    const db = getDb();
    const announcements = db.prepare(`
      SELECT a.*, u.name as author_name, u.role as author_role, u.department as author_department
      FROM campus_announcements a
      JOIN users u ON a.author_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 20
    `).all() as any[];

    res.json({
      success: true,
      data: {
        announcements: announcements.map(a => ({
          id: a.id,
          title: a.title,
          body: a.body,
          scope: a.scope,
          priority: a.priority,
          isDemo: Boolean(a.is_demo),
          createdAt: a.created_at,
          author: {
            id: a.author_id,
            name: a.author_name,
            role: a.author_role,
            department: a.author_department
          }
        }))
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message || 'Failed to fetch announcements' } });
  }
});

/**
 * GET /api/campus/facilities/issues
 * Query facility issues scoped by role:
 * - Wardens/Admins see all assigned / campus facility defects
 * - Students see only their reported defects
 */
campusRouter.get('/facilities/issues', requireAuth, (req: Request, res: Response): void => {
  try {
    const db = getDb();
    const userId = req.user?.sub;
    const userRole = req.user?.role;
    const { status, urgency, category } = req.query as Record<string, string>;

    const conditions: string[] = [];
    const params: any[] = [];

    // Role scoping: Students only see their own reports; wardens and admins see all
    if (userRole !== 'warden' && userRole !== 'admin') {
      conditions.push('fi.reporter_id = ?');
      params.push(userId);
    }

    if (status) {
      conditions.push('fi.status = ?');
      params.push(status);
    }
    if (urgency) {
      conditions.push('fi.urgency = ?');
      params.push(urgency);
    }
    if (category) {
      conditions.push('fi.category = ?');
      params.push(category);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT fi.*, u.name as reporter_name, u.email as reporter_email,
             cl.name as location_name, cl.building as location_building
      FROM facility_issues fi
      JOIN users u ON fi.reporter_id = u.id
      LEFT JOIN campus_locations cl ON fi.location_id = cl.id
      ${whereClause}
      ORDER BY 
        CASE fi.urgency WHEN 'emergency' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
        fi.created_at DESC
      LIMIT 100
    `;

    const issues = db.prepare(sql).all(...params) as any[];

    res.json({
      success: true,
      data: {
        issues: issues.map(i => ({
          id: i.id,
          facilityName: i.facility_name,
          category: i.category,
          title: i.title,
          description: i.description,
          urgency: i.urgency,
          status: i.status,
          assignedTo: i.assigned_to,
          resolutionNotes: i.resolution_notes,
          createdAt: i.created_at,
          updatedAt: i.updated_at,
          reporter: {
            id: i.reporter_id,
            name: i.reporter_name,
            email: i.reporter_email
          },
          location: i.location_id ? {
            id: i.location_id,
            name: i.location_name,
            building: i.location_building
          } : null
        })),
        total: issues.length
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message || 'Failed to fetch facility issues' } });
  }
});

/**
 * POST /api/campus/facilities/issues
 * Student / Resident reports a facility maintenance issue.
 */
campusRouter.post('/facilities/issues', requireAuth, (req: Request, res: Response): void => {
  try {
    const db = getDb();
    const reporterId = req.user?.sub;
    const { facilityName, category, title, description, locationId, location_id, urgency = 'medium' } = req.body;
    const effectiveLocationId = locationId || location_id;

    if (!title || !description || !category) {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'title, description, and category are required' } });
      return;
    }

    let validLocationId: string | null = null;
    let derivedFacilityName = facilityName;
    if (effectiveLocationId) {
      const loc = db.prepare('SELECT id, name FROM campus_locations WHERE id = ? OR node_id = ?').get(effectiveLocationId, effectiveLocationId) as any;
      if (loc) {
        validLocationId = loc.id;
        derivedFacilityName = derivedFacilityName || loc.name;
      } else {
        derivedFacilityName = derivedFacilityName || effectiveLocationId;
      }
    } else {
      derivedFacilityName = derivedFacilityName || 'General Campus Facility';
    }

    const validCategories = ['plumbing', 'electrical', 'internet_wifi', 'furniture', 'cleanliness', 'safety', 'hvac', 'structural', 'other'];
    if (!validCategories.includes(category)) {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: `category must be one of: ${validCategories.join(', ')}` } });
      return;
    }

    const validUrgencies = ['low', 'medium', 'high', 'critical', 'emergency'];
    if (!validUrgencies.includes(urgency)) {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: `urgency must be one of: ${validUrgencies.join(', ')}` } });
      return;
    }

    const dbCategory = ['plumbing', 'electrical', 'internet_wifi', 'furniture', 'cleanliness', 'safety'].includes(category) ? category : 'other';
    const dbUrgency = ['low', 'medium', 'high', 'emergency'].includes(urgency) ? urgency : (urgency === 'critical' ? 'emergency' : 'medium');

    const issueId = `issue_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    db.prepare(`
      INSERT INTO facility_issues (id, reporter_id, location_id, facility_name, category, title, description, urgency, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open')
    `).run(issueId, reporterId, validLocationId, derivedFacilityName, dbCategory, title, description, dbUrgency);

    // Notify residential warden
    try {
      const warden = db.prepare("SELECT id FROM users WHERE role = 'warden' LIMIT 1").get() as any;
      if (warden) {
        db.prepare(`
          INSERT INTO notifications (id, user_id, title, message, module, type, is_read, link_url)
          VALUES (?, ?, ?, ?, 'system', 'alert', 0, '/facilities')
        `).run(
          `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          warden.id,
          `New Facility Defect: ${title}`,
          `Reported in ${derivedFacilityName} (${urgency.toUpperCase()} urgency).`,
          '/facilities'
        );
      }
    } catch {
      // Non-critical notification failure
    }

    res.status(201).json({
      success: true,
      data: {
        id: issueId,
        facilityName: derivedFacilityName,
        category,
        title,
        description,
        urgency,
        status: 'open',
        createdAt: new Date().toISOString()
      },
      message: 'Facility issue reported successfully'
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message || 'Failed to report facility issue' } });
  }
});

/**
 * PATCH /api/campus/facilities/issues/:issueId
 * Warden / Admin triage and status transition.
 */
campusRouter.patch('/facilities/issues/:issueId', requireAuth, (req: Request, res: Response): void => {
  try {
    const db = getDb();
    const userRole = req.user?.role;
    const { issueId } = req.params;
    const { status, assignedTo, assigned_to, resolutionNotes, resolution_notes } = req.body;

    if (userRole !== 'warden' && userRole !== 'admin') {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only authorized wardens and administrators can triage facility defects' } });
      return;
    }

    const existing = db.prepare('SELECT * FROM facility_issues WHERE id = ?').get(issueId) as any;
    if (!existing) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Facility issue not found' } });
      return;
    }

    const validStatuses = ['open', 'assigned', 'in_progress', 'resolved', 'rejected'];
    if (status && !validStatuses.includes(status)) {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: `status must be one of: ${validStatuses.join(', ')}` } });
      return;
    }

    const newStatus = status || existing.status;
    const effectiveAssigned = assignedTo !== undefined ? assignedTo : (assigned_to !== undefined ? assigned_to : existing.assigned_to);
    const effectiveNotes = resolutionNotes !== undefined ? resolutionNotes : (resolution_notes !== undefined ? resolution_notes : existing.resolution_notes);

    db.prepare(`
      UPDATE facility_issues
      SET status = ?, assigned_to = ?, resolution_notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newStatus, effectiveAssigned, effectiveNotes, issueId);

    // Notify the reporting student
    try {
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, module, type, is_read, link_url)
        VALUES (?, ?, ?, ?, 'system', 'info', 0, '/facilities')
      `).run(
        `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        existing.reporter_id,
        `Facility Issue Updated: ${existing.title}`,
        `Status updated to "${newStatus.toUpperCase()}". ${effectiveNotes ? 'Notes: ' + effectiveNotes : ''}`
      );
    } catch {
      // Non-critical notification failure
    }

    res.json({
      success: true,
      data: {
        id: issueId,
        status: newStatus,
        assignedTo: effectiveAssigned,
        resolutionNotes: effectiveNotes,
        resolution_notes: effectiveNotes,
        updatedAt: new Date().toISOString()
      },
      message: `Facility defect status updated to ${newStatus}`
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message || 'Failed to update facility issue' } });
  }
});
