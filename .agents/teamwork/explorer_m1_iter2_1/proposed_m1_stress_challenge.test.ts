import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../server/src/index';
import { getDb } from '../../server/src/db/connection';

describe('Milestone 1 Adversarial & Stress Challenge Suite', () => {
  const db = getDb();

  beforeAll(() => {
    expect(db).toBeDefined();
  });

  // ============================================================================
  // 1. CONCURRENCY STRESS
  // ============================================================================
  describe('1. Concurrency Stress', () => {
    it('concurrent milestone toggles: student readiness and status remain consistent', async () => {
      const studentId = 'usr_student_1';
      const milestoneId = 'ms_1';

      // Send 5 rapid toggles in parallel
      const toggles = Array.from({ length: 5 }, () =>
        request(app)
          .post(`/api/hub/placement-milestones/${studentId}/toggle`)
          .send({ milestoneId })
      );

      const responses = await Promise.all(toggles);
      for (const res of responses) {
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('readinessScore');
      }

      // Check final state in DB
      const row = db.prepare('SELECT status FROM placement_milestones WHERE id = ?').get(milestoneId) as any;
      expect(['completed', 'pending']).toContain(row.status);
    });

    it('concurrent resource ratings: validates rating count and average consistency', async () => {
      const resId = 'res_adv_conc_1';
      db.prepare('DELETE FROM academic_resources WHERE id = ?').run(resId);
      db.prepare('DELETE FROM resource_ratings WHERE resource_id = ?').run(resId);

      db.prepare(`
        INSERT INTO academic_resources (
          id, title, course_code, course_name, category, semester, department,
          file_url, uploader_id, downloads_count, rating, rating_count
        ) VALUES (?, 'Concurrency Test Doc', 'CS888', 'Concurrency', 'Notes', 5, 'CS', 'http://example.com/c.pdf', 'usr_student_1', 0, 0.0, 0)
      `).run(resId);

      // Create 8 distinct users
      for (let i = 1; i <= 8; i++) {
        const uId = `usr_stress_rate_${i}`;
        db.prepare('INSERT OR IGNORE INTO users (id, name, email, role) VALUES (?, ?, ?, ?)').run(
          uId, `Rate User ${i}`, `rate_${i}@campus.edu`, 'student'
        );
      }

      // Fire 8 concurrent rate requests (each user gives 5 stars)
      const ratings = Array.from({ length: 8 }, (_, i) =>
        request(app)
          .post(`/api/hub/resources/${resId}/rate`)
          .send({ userId: `usr_stress_rate_${i + 1}`, rating: 5 })
      );

      const responses = await Promise.all(ratings);
      for (const res of responses) {
        expect(res.status).toBe(200);
      }

      const resRow = db.prepare('SELECT rating, rating_count FROM academic_resources WHERE id = ?').get(resId) as any;
      const countRow = db.prepare('SELECT COUNT(*) as count FROM resource_ratings WHERE resource_id = ?').get(resId) as any;

      expect(countRow.count).toBe(8);
      expect(resRow.rating_count).toBe(8);
      expect(resRow.rating).toBe(5.0);
    });

    it('concurrent mentorship requests: race condition on duplicate submissions', async () => {
      // Clear any pending requests between student 2 and mentor 2
      db.prepare("DELETE FROM mentorship_requests WHERE mentee_id = 'usr_student_2' AND mentor_id = 'men_2'").run();

      const reqPayload = {
        menteeId: 'usr_student_2',
        mentorId: 'men_2',
        topic: 'Graph Algorithms Concurrency Check',
        preferredSlot: 'Wednesday 3 PM'
      };

      // Rapidly fire 3 requests simultaneously
      const submissions = [
        request(app).post('/api/hub/mentorship-requests').send(reqPayload),
        request(app).post('/api/hub/mentorship-requests').send(reqPayload),
        request(app).post('/api/hub/mentorship-requests').send(reqPayload)
      ];

      const responses = await Promise.all(submissions);
      const statuses = responses.map(r => r.status);

      // Exactly one request should succeed (201), subsequent should be 409 CONFLICT
      const createdCount = statuses.filter(s => s === 201).length;
      const conflictCount = statuses.filter(s => s === 409).length;

      expect(createdCount).toBe(1);
      expect(conflictCount).toBe(2);

      const dbRows = db.prepare("SELECT COUNT(*) as c FROM mentorship_requests WHERE mentee_id = 'usr_student_2' AND mentor_id = 'men_2' AND status = 'pending'").get() as any;
      expect(dbRows.c).toBe(1);
    });
  });

  // ============================================================================
  // 2. SQL INJECTION & MALICIOUS INPUTS
  // ============================================================================
  describe('2. SQL Injection & Malicious Inputs', () => {
    it('neutralizes SQL injection in resource search (courseCode and query)', async () => {
      const maliciousPayloads = [
        "' OR '1'='1",
        "'; DROP TABLE academic_resources; --",
        "1; SELECT * FROM users; --",
        "' UNION SELECT id, name, email, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null FROM users --"
      ];

      for (const payload of maliciousPayloads) {
        const res = await request(app)
          .get('/api/hub/resources')
          .query({ courseCode: payload, query: payload });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('resources');
        expect(Array.isArray(res.body.resources)).toBe(true);
      }

      // Verify table still exists and wasn't dropped
      const check = db.prepare("SELECT count(*) as c FROM academic_resources").get() as any;
      expect(check.c).toBeGreaterThan(0);
    });

    it('neutralizes SQL injection in mentor search filters', async () => {
      const injectionQuery = "'; DELETE FROM mentors; --";
      const res = await request(app)
        .get('/api/hub/mentors')
        .query({ skill: injectionQuery, company: injectionQuery, query: injectionQuery });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('mentors');

      const mentorCount = db.prepare("SELECT count(*) as c FROM mentors").get() as any;
      expect(mentorCount.c).toBeGreaterThan(0);
    });

    it('rejects out-of-bounds ratings (0, 6, negative, float, non-number)', async () => {
      const badRatings = [0, 6, -1, 3.5, 'five', null, undefined, 999];

      for (const badRating of badRatings) {
        const res = await request(app)
          .post('/api/hub/resources/res_1/rate')
          .send({ userId: 'usr_student_1', rating: badRating });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
      }
    });

    it('handles oversized text payloads without crashing Express', async () => {
      const hugeNotes = 'A'.repeat(50000); // 50 KB text string
      const res = await request(app)
        .post('/api/hub/mentorship-requests')
        .send({
          menteeId: 'usr_student_1',
          mentorId: 'men_3',
          topic: 'Large Payload Stress Test',
          preferredSlot: 'Saturday 10 AM',
          notes: hugeNotes
        });

      // Should either be 201 or 409 (if duplicate pending exists), but NOT 500 or crash
      expect([201, 409]).toContain(res.status);
    });

    it('rejects POST mentorship-requests with non-existent mentorId with 404 NOT FOUND', async () => {
      const res = await request(app)
        .post('/api/hub/mentorship-requests')
        .send({
          menteeId: 'usr_student_1',
          mentorId: 'non_existent_mentor_uuid_99999',
          topic: 'Testing Unchecked Mentor ID',
          preferredSlot: 'Friday 4 PM'
        });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('rejects POST resources/:id/rate with non-existent userId with 404 NOT FOUND', async () => {
      const res = await request(app)
        .post('/api/hub/resources/res_1/rate')
        .send({
          userId: 'non_existent_user_ghost_999',
          rating: 4
        });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('rejects POST /api/activity with non-existent userId with 404 NOT FOUND', async () => {
      const res = await request(app)
        .post('/api/activity')
        .send({
          userId: 'non_existent_user_ghost_999',
          module: 'hub',
          action: 'TEST_UNVALIDATED_USER'
        });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  // ============================================================================
  // 3. DATABASE CONSTRAINT ENFORCEMENT
  // ============================================================================
  describe('3. Database Constraint Enforcement', () => {
    it('verifies SQLite foreign key cascade deletions', () => {
      const tempUserId = 'usr_cascade_victim';
      db.prepare('DELETE FROM users WHERE id = ?').run(tempUserId);

      // Create user
      db.prepare(`
        INSERT INTO users (id, name, email, role, department)
        VALUES (?, 'Cascade Victim', 'victim@campus.edu', 'student', 'CS')
      `).run(tempUserId);

      // Create student profile
      db.prepare(`
        INSERT INTO student_profiles (user_id, readiness_score)
        VALUES (?, 50)
      `).run(tempUserId);

      // Create milestone
      const msId = 'ms_cascade_test';
      db.prepare(`
        INSERT INTO placement_milestones (id, student_id, title, category, status)
        VALUES (?, ?, 'Milestone To Cascade', 'DSA', 'pending')
      `).run(msId, tempUserId);

      // Create activity log
      const actId = 'act_cascade_test';
      db.prepare(`
        INSERT INTO activity_log (id, user_id, module, action)
        VALUES (?, ?, 'hub', 'CASCADE_TEST')
      `).run(actId, tempUserId);

      // Verify records exist
      expect(db.prepare('SELECT user_id FROM student_profiles WHERE user_id = ?').get(tempUserId)).toBeDefined();
      expect(db.prepare('SELECT id FROM placement_milestones WHERE id = ?').get(msId)).toBeDefined();
      expect(db.prepare('SELECT id FROM activity_log WHERE id = ?').get(actId)).toBeDefined();

      // Delete the parent user
      db.prepare('DELETE FROM users WHERE id = ?').run(tempUserId);

      // Verify cascade deleted children
      expect(db.prepare('SELECT user_id FROM student_profiles WHERE user_id = ?').get(tempUserId)).toBeUndefined();
      expect(db.prepare('SELECT id FROM placement_milestones WHERE id = ?').get(msId)).toBeUndefined();
      expect(db.prepare('SELECT id FROM activity_log WHERE id = ?').get(actId)).toBeUndefined();
    });

    it('enforces UNIQUE constraint on users.email', () => {
      expect(() => {
        db.prepare(`
          INSERT INTO users (id, name, email, role)
          VALUES ('usr_duplicate_email', 'Duplicate User', 'aarav.sharma@campus.edu', 'student')
        `).run();
      }).toThrow(/UNIQUE constraint failed: users\.email/);
    });

    it('enforces CHECK constraint on student_profiles.readiness_score [0, 100]', () => {
      expect(() => {
        db.prepare('UPDATE student_profiles SET readiness_score = 105 WHERE user_id = ?').run('usr_student_1');
      }).toThrow(/CHECK constraint failed/);

      expect(() => {
        db.prepare('UPDATE student_profiles SET readiness_score = -1 WHERE user_id = ?').run('usr_student_1');
      }).toThrow(/CHECK constraint failed/);
    });

    it('enforces CHECK constraint on users.role', () => {
      expect(() => {
        db.prepare(`
          INSERT INTO users (id, name, email, role)
          VALUES ('usr_illegal_role', 'Hacker', 'hacker@campus.edu', 'superadmin')
        `).run();
      }).toThrow(/CHECK constraint failed/);
    });

    it('enforces CHECK constraint on academic_resources.category', () => {
      expect(() => {
        db.prepare(`
          INSERT INTO academic_resources (id, title, course_code, course_name, category, file_url, uploader_id)
          VALUES ('res_illegal_cat', 'Title', 'CS101', 'Intro', 'MaliciousCategory', 'http://a.pdf', 'usr_student_1')
        `).run();
      }).toThrow(/CHECK constraint failed/);
    });

    it('enforces CHECK constraint on resource_ratings.rating [1, 5]', () => {
      expect(() => {
        db.prepare(`
          INSERT INTO resource_ratings (id, resource_id, user_id, rating)
          VALUES ('rat_invalid', 'res_1', 'usr_student_1', 0)
        `).run();
      }).toThrow(/CHECK constraint failed/);

      expect(() => {
        db.prepare(`
          INSERT INTO resource_ratings (id, resource_id, user_id, rating)
          VALUES ('rat_invalid_6', 'res_1', 'usr_student_1', 6)
        `).run();
      }).toThrow(/CHECK constraint failed/);
    });
  });

  // ============================================================================
  // 4. EDGE CASE VALIDATION & LOGIC FLAWS
  // ============================================================================
  describe('4. Edge Case Validation & Logic Flaws', () => {
    it('rejects self-mentorship when student requests mentorship from themselves', async () => {
      // Find an existing mentor
      const mentor = db.prepare('SELECT id, user_id FROM mentors LIMIT 1').get() as any;
      expect(mentor).toBeDefined();

      // Case 1: menteeId === mentorId (using mentor table ID)
      const res1 = await request(app)
        .post('/api/hub/mentorship-requests')
        .send({
          menteeId: mentor.user_id,
          mentorId: mentor.id,
          topic: 'Self Mentorship Test',
          preferredSlot: 'Friday 2 PM'
        });

      expect(res1.status).toBe(400);
      expect(res1.body.error.message).toMatch(/Cannot request mentorship from yourself/i);

      // Case 2: menteeId === mentor.user_id
      const res2 = await request(app)
        .post('/api/hub/mentorship-requests')
        .send({
          menteeId: mentor.user_id,
          mentorId: mentor.user_id,
          topic: 'Self Mentorship Test 2',
          preferredSlot: 'Friday 2 PM'
        });

      expect(res2.status).toBe(400);
      expect(res2.body.error.message).toMatch(/Cannot request mentorship from yourself/i);
    });

    it('successfully updates mentorship request status via PATCH /api/hub/mentorship-requests/:requestId', async () => {
      // Get any existing request
      const req = db.prepare('SELECT id FROM mentorship_requests LIMIT 1').get() as { id: string };
      expect(req).toBeDefined();

      const res = await request(app)
        .patch(`/api/hub/mentorship-requests/${req.id}`)
        .send({
          status: 'accepted',
          notes: 'Session accepted'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', req.id);
      expect(res.body).toHaveProperty('status', 'accepted');
      expect(res.body).toHaveProperty('notes', 'Session accepted');
    });

    it('accepts valid 1-star and 5-star boundary ratings', async () => {
      const resMin = await request(app)
        .post('/api/hub/resources/res_1/rate')
        .send({ userId: 'usr_student_1', rating: 1 });
      expect(resMin.status).toBe(200);
      expect(resMin.body.userRating).toBe(1);

      const resMax = await request(app)
        .post('/api/hub/resources/res_1/rate')
        .send({ userId: 'usr_student_1', rating: 5 });
      expect(resMax.status).toBe(200);
      expect(resMax.body.userRating).toBe(5);
    });

    it('handles empty query parameters without errors across all GET endpoints', async () => {
      const endpoints = [
        '/api/hub/mentors?skill=&company=&available=&query=',
        '/api/hub/resources?courseCode=&category=&query=&sort=',
        '/api/activity?limit=&offset=&module=&userId=',
        '/api/users?role=&department='
      ];

      for (const ep of endpoints) {
        const res = await request(app).get(ep);
        expect(res.status).toBe(200);
      }
    });

    it('returns 404 for non-existent routes and users', async () => {
      const resUser = await request(app).get('/api/users/non_existent_usr_404');
      expect(resUser.status).toBe(404);

      const resProfile = await request(app).get('/api/hub/profile/non_existent_usr_404');
      expect(resProfile.status).toBe(404);

      const resRoute = await request(app).get('/api/non_existent_endpoint');
      expect(resRoute.status).toBe(404);
    });
  });
});
