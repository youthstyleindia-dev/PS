import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../server/src/app';
import { AuthService } from '../../server/src/services/auth.service';
import { getDb, initDb } from '../../server/src/db/connection';
import { rideMatchingService } from '../../server/src/services/ride_matching.service';
import { LEGACY_ROLE_MAP } from '../../server/src/authorization/role.types';

describe('Security Audit Remediation Verification Suite (SEC-01 through SEC-10)', () => {
  let student1Token: string;
  let student2Token: string;
  let driverToken: string;
  let proctorToken: string;
  let adminToken: string;

  beforeAll(() => {
    initDb();

    student1Token = AuthService.signToken({
      id: 'usr_student_1',
      email: 'aarav.sharma@campus.edu',
      role: 'student',
      roles: ['student'],
      name: 'Aarav Sharma',
      department: 'Computer Science & Engineering'
    });

    student2Token = AuthService.signToken({
      id: 'usr_student_2',
      email: 'diya.patel@campus.edu',
      role: 'student',
      roles: ['student'],
      name: 'Diya Patel',
      department: 'Computer Science & Engineering'
    });

    driverToken = AuthService.signToken({
      id: 'usr_driver_1',
      email: 'vikram.rao@campus.edu',
      role: 'driver',
      roles: ['driver'],
      name: 'Vikram Rao',
      department: 'Mechanical Engineering'
    });

    proctorToken = AuthService.signToken({
      id: 'usr_proctor_1',
      email: 'm.sundaram@campus.edu',
      role: 'proctor',
      roles: ['proctor', 'ta_faculty'],
      name: 'Dr. Meenakshi Sundaram',
      department: 'Computer Science & Engineering'
    });

    adminToken = AuthService.signToken({
      id: 'usr_admin_1',
      email: 'admin@campus.edu',
      role: 'admin',
      roles: ['admin'],
      name: 'Campus IT Operations',
      department: 'Administration'
    });
  });

  describe('SEC-01: Wellbeing Focus Session IDOR Isolation', () => {
    it('prevents student 1 from inspecting student 2 focus session', async () => {
      const db = getDb();
      const testSessionId = 'test_wb_sess_' + Date.now();
      db.prepare(`
        INSERT INTO focus_sessions (id, user_id, start_time, target_duration_mins, actual_duration_mins, status, goal)
        VALUES (?, 'usr_student_2', datetime('now'), 30, 30, 'completed', 'Audit Verification')
      `).run(testSessionId);

      // Student 1 attempts to access Student 2 session
      const unauthorizedRes = await request(app)
        .get(`/api/wellbeing/sessions/${testSessionId}`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(unauthorizedRes.status).toBe(403);
      expect(unauthorizedRes.body.error.code).toBe('FORBIDDEN');

      // Student 2 can access own session
      const authorizedRes = await request(app)
        .get(`/api/wellbeing/sessions/${testSessionId}`)
        .set('Authorization', `Bearer ${student2Token}`);

      expect(authorizedRes.status).toBe(200);
      expect(authorizedRes.body.session.id).toBe(testSessionId);
    });

    it('prevents student 1 from stopping student 2 focus session', async () => {
      const db = getDb();
      const activeSessionId = 'test_wb_active_' + Date.now();
      db.prepare(`
        INSERT INTO focus_sessions (id, user_id, start_time, target_duration_mins, actual_duration_mins, status, goal)
        VALUES (?, 'usr_student_2', datetime('now'), 30, 0, 'active', 'Active Focus')
      `).run(activeSessionId);

      const res = await request(app)
        .post(`/api/wellbeing/sessions/${activeSessionId}/stop`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('SEC-02: Ride Seat Atomic Decrement & Concurrency Safety', () => {
    it('atomically enforces seat availability and rejects overselling beyond capacity', () => {
      const db = getDb();
      const testOfferId = 'test_off_' + Date.now();
      const testReqId1 = 'test_rq1_' + Date.now();
      const testReqId2 = 'test_rq2_' + Date.now();

      // Offer with strictly 1 available seat
      db.prepare(`
        INSERT INTO ride_offers (id, driver_id, origin_node_id, destination_node_id, departure_time, total_seats, available_seats, vehicle_type, status)
        VALUES (?, 'usr_driver_1', 'GATE_NORTH', 'ACAD_QUAD', '08:30', 1, 1, 'EV_CAR', 'open')
      `).run(testOfferId);

      // Passenger 1 request (1 seat)
      db.prepare(`
        INSERT INTO ride_requests (id, passenger_id, origin_node_id, destination_node_id, desired_departure_time, seats_needed, max_detour_ratio, status)
        VALUES (?, 'usr_student_1', 'GATE_NORTH', 'ACAD_QUAD', '08:30', 1, 0.4, 'pending')
      `).run(testReqId1);

      // Passenger 2 request (1 seat)
      db.prepare(`
        INSERT INTO ride_requests (id, passenger_id, origin_node_id, destination_node_id, desired_departure_time, seats_needed, max_detour_ratio, status)
        VALUES (?, 'usr_student_2', 'GATE_NORTH', 'ACAD_QUAD', '08:30', 1, 0.4, 'pending')
      `).run(testReqId2);

      // First booking succeeds
      const booking1 = rideMatchingService.confirmAndBookRide(db, testOfferId, testReqId1, 1);
      expect(booking1.success).toBe(true);
      expect(booking1.seatsRemaining).toBe(0);

      // Second booking must throw due to zero available seats
      expect(() => {
        rideMatchingService.confirmAndBookRide(db, testOfferId, testReqId2, 1);
      }).toThrow(/Not enough available seats/);

      // Verify DB available_seats remained 0 and did not become negative
      const offer = db.prepare('SELECT available_seats FROM ride_offers WHERE id = ?').get(testOfferId) as any;
      expect(offer.available_seats).toBe(0);
    });
  });

  describe('SEC-03: Exam Session Scheduling Authorization', () => {
    it('rejects unauthenticated requests or invalid tokens when scheduling exam sessions', async () => {
      const res = await request(app)
        .post('/api/exams/sessions')
        .set('Authorization', 'Bearer invalid_token_xyz')
        .send({
          title: 'Unauthorized Midterm',
          courseId: 'CS301',
          studentId: 'usr_student_1'
        });

      expect([401, 403]).toContain(res.status);
    });

    it('rejects student role from scheduling exam sessions', async () => {
      const res = await request(app)
        .post('/api/exams/sessions')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          title: 'Student Attempted Exam',
          courseId: 'CS301',
          studentId: 'usr_student_1'
        });

      expect(res.status).toBe(403);
    });

    it('allows admin or proctor to schedule exam sessions', async () => {
      const res = await request(app)
        .post('/api/exams/sessions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Audit Verification Exam',
          courseId: 'CS301',
          studentId: 'usr_student_1',
          scheduledStart: '2026-11-01T10:00:00Z',
          scheduledEnd: '2026-11-01T12:00:00Z'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  describe('SEC-04: Proctor Queue Assignment-Scoped Isolation', () => {
    it('scopes proctor review queue to assigned exam sessions when assignments exist', async () => {
      const db = getDb();
      const assignedExamId = 'exam_assigned_' + Date.now();
      const unassignedExamId = 'exam_unassigned_' + Date.now();

      db.prepare(`
        INSERT INTO exam_sessions (id, title, course_id, student_id, scheduled_start, scheduled_end, status)
        VALUES (?, 'Assigned Exam', 'CS301', 'usr_student_1', datetime('now'), datetime('now', '+2 hours'), 'scheduled')
      `).run(assignedExamId);

      db.prepare(`
        INSERT INTO exam_sessions (id, title, course_id, student_id, scheduled_start, scheduled_end, status)
        VALUES (?, 'Unassigned Exam', 'EE201', 'usr_student_2', datetime('now'), datetime('now', '+2 hours'), 'scheduled')
      `).run(unassignedExamId);

      // Assign proctor 1 to assignedExamId ONLY
      db.prepare(`
        INSERT INTO exam_session_assignments (id, session_id, proctor_id, status)
        VALUES (?, ?, 'usr_proctor_1', 'active')
      `).run('asgn_' + Date.now(), assignedExamId);

      // Create observable events on both exams
      db.prepare(`
        INSERT INTO observation_events (id, exam_session_id, event_type, confidence_score, provenance, review_status)
        VALUES (?, ?, 'MULTIPLE_FACES', 0.95, 'ACTUAL_INFERENCE', 'PENDING_REVIEW')
      `).run('ev_asgn_' + Date.now(), assignedExamId);

      db.prepare(`
        INSERT INTO observation_events (id, exam_session_id, event_type, confidence_score, provenance, review_status)
        VALUES (?, ?, 'ABSENCE_FROM_SEAT', 0.88, 'ACTUAL_INFERENCE', 'PENDING_REVIEW')
      `).run('ev_unasgn_' + Date.now(), unassignedExamId);

      const proctorRes = await request(app)
        .get('/api/exams/pending-reviews')
        .set('Authorization', `Bearer ${proctorToken}`);

      expect(proctorRes.status).toBe(200);
      const returnedSessionIds = proctorRes.body.map((e: any) => e.exam_session_id);
      expect(returnedSessionIds).toContain(assignedExamId);
      expect(returnedSessionIds).not.toContain(unassignedExamId);
    });
  });

  describe('SEC-05: Mentorship Request IDOR Protection', () => {
    it('prevents student 1 from reading student 2 mentorship requests', async () => {
      const res = await request(app)
        .get('/api/hub/mentorship-requests/usr_student_2')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('prevents unauthorized user from accepting mentorship request directed to another mentor', async () => {
      const db = getDb();
      const testReqId = 'mreq_sec_' + Date.now();

      // Mentorship request directed to mentor with preferred_slot
      const mentor = db.prepare('SELECT id, user_id FROM mentors LIMIT 1').get() as any;
      if (mentor) {
        db.prepare(`
          INSERT INTO mentorship_requests (id, mentee_id, mentor_id, topic, preferred_slot, status)
          VALUES (?, 'usr_student_2', ?, 'Algorithm Mentorship', 'Wed 10:00 AM', 'pending')
        `).run(testReqId, mentor.id);

        // Student 1 attempts to accept or modify it
        const res = await request(app)
          .patch(`/api/hub/mentorship-requests/${testReqId}`)
          .set('Authorization', `Bearer ${student1Token}`)
          .send({ status: 'accepted', notes: 'Hacked acceptance' });

        expect(res.status).toBe(403);
        expect(res.body.error.code).toBe('FORBIDDEN');
      }
    });
  });

  describe('SEC-06: Notification Snooping Mitigation', () => {
    it('restricts notification retrieval strictly to authenticated identity regardless of query param', async () => {
      const db = getDb();
      // Insert private notification for admin
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, module, type, is_read)
        VALUES (?, 'usr_admin_1', 'Classified Security Alert', 'Confidential notification message', 'system', 'alert', 0)
      `).run('notif_admin_' + Date.now());

      // Student 1 attempts to query admin notifications via ?userId=usr_admin_1
      const res = await request(app)
        .get('/api/notifications?userId=usr_admin_1')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(200);
      // Results must not contain admin's notification
      const messages = res.body.notifications.map((n: any) => n.message);
      expect(messages).not.toContain('Confidential notification message');
    });
  });

  describe('SEC-07: Ride Request Passenger Spoofing Prevention', () => {
    it('rejects student attempting to submit a ride request under a victim passengerId', async () => {
      const res = await request(app)
        .post('/api/rides/requests')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          passengerId: 'usr_student_2', // Spoofed ID
          originNodeId: 'CAMPUS_GATE_NORTH',
          destinationNodeId: 'LIBRARY_CENTRAL',
          desiredTime: '08:30',
          seatsNeeded: 1
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('SEC-08: Privilege Boundary & getMe Permission Report', () => {
    it('does not grant canAccessWellbeing to drivers', () => {
      const driverMe = AuthService.getMe('usr_driver_1');
      expect(driverMe.permissions.canAccessWellbeing).toBe(false);
      expect(driverMe.permissions.canOfferRides).toBe(true);
      expect(driverMe.permissions.canManageSystem).toBe(false);
    });

    it('grants canAccessWellbeing only to student and admin', () => {
      const studentMe = AuthService.getMe('usr_student_1');
      expect(studentMe.permissions.canAccessWellbeing).toBe(true);

      const adminMe = AuthService.getMe('usr_admin_1');
      expect(adminMe.permissions.canAccessWellbeing).toBe(true);
    });
  });

  describe('SEC-10: Canonical Uppercase Role Mapping', () => {
    it('resolves canonical uppercase strings to normalized role keys', () => {
      expect(LEGACY_ROLE_MAP['STUDENT']).toBe('student');
      expect(LEGACY_ROLE_MAP['TA']).toBe('ta_faculty');
      expect(LEGACY_ROLE_MAP['WARDEN']).toBe('warden');
      expect(LEGACY_ROLE_MAP['TRANSIT_DRIVER']).toBe('driver');
      expect(LEGACY_ROLE_MAP['EXAM_PROCTOR']).toBe('proctor');
      expect(LEGACY_ROLE_MAP['SYSTEM_ADMIN']).toBe('admin');
    });
  });
});
