import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../server/src/app';
import { AuthService } from '../../server/src/services/auth.service';
import { getDb, initDb } from '../../server/src/db/connection';
import { seedDatabase } from '../../server/src/db/seed';

describe('Role Matrix & Negative Authorization Security Test Suite', () => {
  let studentToken: string;
  let student2Token: string;
  let driverToken: string;
  let proctorToken: string;
  let adminToken: string;

  beforeAll(() => {
    initDb();

    // Create tokens for canonical seed personas
    studentToken = AuthService.signToken({
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
      department: 'Campus Central IT'
    });
  });

  // =========================================================================
  // 1. ROLE-SPECIFIC LOGIN ENTRY POINTS & ACCESS ENFORCEMENT
  // =========================================================================
  describe('1. Role-Specific Login Entry Points & Clearances', () => {
    it('denies student attempting to log into driver workspace entry point', async () => {
      const res = await request(app)
        .post('/api/auth/login/driver')
        .send({
          email: 'aarav.sharma@campus.edu',
          password: 'CampusPass123!'
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('ROLE_NOT_ASSIGNED');
      expect(res.body.error.message).toContain('driver');
    });

    it('denies student attempting to log into proctor workspace entry point', async () => {
      const res = await request(app)
        .post('/api/auth/login/proctor')
        .send({
          email: 'aarav.sharma@campus.edu',
          password: 'CampusPass123!'
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('ROLE_NOT_ASSIGNED');
    });

    it('denies student attempting to log into admin workspace entry point', async () => {
      const res = await request(app)
        .post('/api/auth/login/admin')
        .send({
          email: 'aarav.sharma@campus.edu',
          password: 'CampusPass123!'
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('ROLE_NOT_ASSIGNED');
    });

    it('allows driver to authenticate through driver entry point', async () => {
      const res = await request(app)
        .post('/api/auth/login/driver')
        .send({
          email: 'vikram.rao@campus.edu',
          password: 'CampusPass123!'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.role).toBe('driver');
    });

    it('allows proctor to authenticate through proctor entry point', async () => {
      const res = await request(app)
        .post('/api/auth/login/proctor')
        .send({
          email: 'm.sundaram@campus.edu',
          password: 'CampusPass123!'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.role).toBe('proctor');
    });

    it('allows admin to authenticate through admin entry point', async () => {
      const res = await request(app)
        .post('/api/auth/login/admin')
        .send({
          email: 'admin@campus.edu',
          password: 'CampusPass123!'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.role).toBe('admin');
    });
  });

  // =========================================================================
  // 2. VERTICAL PRIVILEGE RESTRICTION: STUDENT BOUNDARIES
  // =========================================================================
  describe('2. Vertical Privilege Boundaries (Student Restrictions)', () => {
    it('blocks student from accessing proctor examination review queue', async () => {
      const res = await request(app)
        .get('/api/exams/pending-reviews')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('blocks student from viewing proctor examination session rosters', async () => {
      const res = await request(app)
        .get('/api/exams/sessions')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('blocks student from publishing driver route offers', async () => {
      const res = await request(app)
        .post('/api/rides/offers')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          driverId: 'usr_student_1',
          originNodeId: 'GATE_NORTH',
          destinationNodeId: 'LAB_CS_AI',
          departureTime: '14:30',
          totalSeats: 3,
          vehicleType: 'EV Sedan'
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('blocks student from executing cluster sustainability workload scaling', async () => {
      const res = await request(app)
        .post('/api/sustainability/workloads/svc_academic/scale')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ targetRps: 250, currentReplicas: 4 });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('blocks student from enumerating global campus user registry', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('blocks student from assigning administrative roles to themselves', async () => {
      const res = await request(app)
        .post('/api/auth/roles/assign')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          userId: 'usr_student_1',
          roleKey: 'admin',
          reason: 'Self-elevation attempt'
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  // =========================================================================
  // 3. VERTICAL PRIVILEGE RESTRICTION: DRIVER BOUNDARIES
  // =========================================================================
  describe('3. Vertical Privilege Boundaries (Driver Restrictions)', () => {
    it('blocks driver from inspecting exam observation queues', async () => {
      const res = await request(app)
        .get('/api/exams/pending-reviews')
        .set('Authorization', `Bearer ${driverToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('blocks driver from modifying global cluster optimization mode', async () => {
      const res = await request(app)
        .post('/api/sustainability/toggle-optimization')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ enabled: true });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('allows authorized driver to publish route offers', async () => {
      const res = await request(app)
        .post('/api/rides/offers')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          driverId: 'usr_driver_1',
          originNodeId: 'GATE_NORTH',
          destinationNodeId: 'LAB_CS_AI',
          departureTime: '15:00',
          totalSeats: 3,
          vehicleType: 'EV Sedan'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.driverId).toBe('usr_driver_1');
    });
  });

  // =========================================================================
  // 4. VERTICAL PRIVILEGE RESTRICTION: PROCTOR BOUNDARIES
  // =========================================================================
  describe('4. Vertical Privilege Boundaries (Proctor Restrictions)', () => {
    it('blocks proctor from publishing driver routes', async () => {
      const res = await request(app)
        .post('/api/rides/offers')
        .set('Authorization', `Bearer ${proctorToken}`)
        .send({
          driverId: 'usr_proctor_1',
          originNodeId: 'GATE_NORTH',
          destinationNodeId: 'LAB_CS_AI',
          departureTime: '16:00',
          totalSeats: 2
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('blocks proctor from assigning roles to users', async () => {
      const res = await request(app)
        .post('/api/auth/roles/assign')
        .set('Authorization', `Bearer ${proctorToken}`)
        .send({
          userId: 'usr_student_2',
          roleKey: 'proctor'
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('allows proctor to read pending exam reviews', async () => {
      const res = await request(app)
        .get('/api/exams/pending-reviews')
        .set('Authorization', `Bearer ${proctorToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // =========================================================================
  // 5. HORIZONTAL ISOLATION: CROSS-USER DATA PROTECTION (IDOR)
  // =========================================================================
  describe('5. Horizontal Data Isolation & Cross-Student IDOR Defense', () => {
    it('blocks student A from inspecting student B focus session records', async () => {
      const res = await request(app)
        .get('/api/wellbeing/sessions/user/usr_student_2')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('blocks student A from inspecting student B domain rules', async () => {
      const res = await request(app)
        .get('/api/wellbeing/rules/usr_student_2')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('blocks student A from purging student B focus history', async () => {
      const res = await request(app)
        .delete('/api/wellbeing/history/usr_student_2')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('blocks student A from modifying student B academic placement profile', async () => {
      const res = await request(app)
        .put('/api/hub/profile/usr_student_2')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          targetRole: 'Hacked Title',
          skills: ['MaliciousSkill']
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('blocks student A from toggling student B placement milestones', async () => {
      const res = await request(app)
        .post('/api/hub/placement-milestones/usr_student_2/toggle')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ milestoneId: 'ms_1' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('allows student to inspect and delete their own wellbeing records', async () => {
      const res = await request(app)
        .get('/api/wellbeing/sessions/user/usr_student_1')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // =========================================================================
  // 6. PUBLIC REGISTRATION PRIVILEGE ESCALATION NEUTRALIZATION
  // =========================================================================
  describe('6. Public Registration Security & Least Privilege', () => {
    it('forces newly registered account to student role even if admin role was requested', async () => {
      const maliciousEmail = `attacker.${Date.now()}@campus.edu`;
      const regRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Attacker Attempting Escalation',
          email: maliciousEmail,
          password: 'SecretPassword123!',
          role: 'admin' // Attempted client-side privilege escalation
        });

      expect(regRes.status).toBe(201);
      expect(regRes.body.data.user.role).toBe('student');
      expect(regRes.body.data.user.roles).toEqual(['student']);

      // Attempt to access admin endpoint with the token
      const adminAttempt = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${regRes.body.data.token}`);

      expect(adminAttempt.status).toBe(403);
    });
  });
});
