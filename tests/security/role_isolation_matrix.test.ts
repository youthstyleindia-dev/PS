import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../server/src/app';
import { AuthService } from '../../server/src/services/auth.service';

describe('Full Campus Role Isolation & Zero Privilege Escalation Matrix', () => {
  let studentToken: string;
  let driverToken: string;
  let proctorToken: string;
  let adminToken: string;

  beforeAll(() => {
    studentToken = AuthService.signToken({
      id: 'usr_student_1',
      email: 'aarav.sharma@campus.edu',
      role: 'student',
      roles: ['student'],
      name: 'Aarav Sharma',
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
      roles: ['proctor'],
      name: 'Dr. Meenakshi Sundaram',
      department: 'Computer Science & Engineering'
    });

    adminToken = AuthService.signToken({
      id: 'usr_admin_1',
      email: 'admin@campus.edu',
      role: 'admin',
      roles: ['admin'],
      name: 'Campus IT Operations',
      department: 'IT Operations'
    });
  });

  describe('1. Student Role Isolation', () => {
    it('blocks student from accessing proctor vision review endpoints (403)', async () => {
      const res = await request(app)
        .get('/api/proctor/exams/exam_1/observations')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('blocks student from creating driver ride offers (403)', async () => {
      const res = await request(app)
        .post('/api/rides/offers')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          driverId: 'usr_student_1',
          originNodeId: 'GATE_NORTH',
          destinationNodeId: 'LAB_CS_AI',
          departureTime: '09:00',
          totalSeats: 3
        });
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('blocks student from triggering facility energy shed or HPC optimization (403)', async () => {
      const res = await request(app)
        .post('/api/sustainability/toggle-optimization')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('2. Driver Role Isolation', () => {
    it('blocks driver from accessing exam review tribunals (403)', async () => {
      const res = await request(app)
        .get('/api/proctor/exams/exam_1/observations')
        .set('Authorization', `Bearer ${driverToken}`);
      expect(res.status).toBe(403);
    });

    it('blocks driver from modifying student academic milestones (403)', async () => {
      const res = await request(app)
        .post('/api/hub/placement-milestones/usr_student_1/toggle')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ milestoneId: 'ms_1' });
      expect(res.status).toBe(403);
    });
  });

  describe('3. Proctor Role Isolation', () => {
    it('blocks proctor from publishing driver ride offers (403)', async () => {
      const res = await request(app)
        .post('/api/rides/offers')
        .set('Authorization', `Bearer ${proctorToken}`)
        .send({
          driverId: 'usr_proctor_1',
          originNodeId: 'GATE_NORTH',
          destinationNodeId: 'LIB_CENTRAL',
          departureTime: '14:00',
          totalSeats: 2
        });
      expect(res.status).toBe(403);
    });

    it('allows proctor to access proctor observations endpoint', async () => {
      const res = await request(app)
        .get('/api/proctor/exams/exam_1/observations')
        .set('Authorization', `Bearer ${proctorToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('4. Admin Omnipresence & Security Logging', () => {
    it('allows admin access across exam review queue and dispatch', async () => {
      const examRes = await request(app)
        .get('/api/proctor/exams/exam_1/observations')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(examRes.status).toBe(200);

      const feedRes = await request(app)
        .get('/api/feed')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(feedRes.status).toBe(200);
    });
  });
});
