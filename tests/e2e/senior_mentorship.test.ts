import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../server/src/app';
import { getDb } from '../../server/src/db/connection';
import { AuthService } from '../../server/src/services/auth.service';

describe('Senior Mentorship & Explainable Matching E2E Suite', () => {
  const db = getDb();
  let menteeToken: string;
  let mentorUserToken: string;
  let thirdPartyToken: string;

  let targetMentorId: string;
  let createdRequestId: string;
  let activeConvId: string;

  beforeAll(() => {
    expect(db).toBeDefined();

    menteeToken = AuthService.signToken({
      id: 'usr_student_1',
      email: 'aarav.sharma@campus.edu',
      role: 'student',
      roles: ['student'],
      name: 'Aarav Sharma',
      department: 'Computer Science & Engineering'
    });

    mentorUserToken = AuthService.signToken({
      id: 'usr_student_2',
      email: 'diya.patel@campus.edu',
      role: 'student',
      roles: ['student'],
      name: 'Diya Patel',
      department: 'Computer Science & Engineering'
    });

    thirdPartyToken = AuthService.signToken({
      id: 'usr_student_12',
      email: 'meera.iyer@campus.edu',
      role: 'student',
      roles: ['student'],
      name: 'Meera Iyer',
      department: 'Electrical Engineering'
    });

    // Resolve mentor ID for Diya Patel
    const diya = db.prepare('SELECT id FROM mentors WHERE user_id = ?').get('usr_student_2') as any;
    expect(diya).toBeDefined();
    targetMentorId = diya.id;
  });

  it('GET /api/mentors returns searchable mentors with explainable match scores', async () => {
    const res = await request(app)
      .get('/api/mentors?skills=Machine%20Learning&query=PyTorch')
      .set('Authorization', `Bearer ${menteeToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.mentors.length).toBeGreaterThan(0);

    const first = res.body.data.mentors[0];
    expect(first.matchScore).toBeGreaterThanOrEqual(40);
    expect(first.matchReason).toBeDefined();
    expect(Array.isArray(first.skills)).toBe(true);
  });

  it('submits guidance request to senior mentor', async () => {
    // Clean up any existing request for this pair
    db.prepare('DELETE FROM mentorship_requests WHERE mentee_id = ? AND mentor_id = ?').run('usr_student_1', targetMentorId);

    const res = await request(app)
      .post('/api/mentorship/requests')
      .set('Authorization', `Bearer ${menteeToken}`)
      .send({
        mentor_id: targetMentorId,
        topic: 'Machine Learning Internship Preparation',
        preferred_slot: 'Tuesday 17:00 - 18:00',
        notes: 'Reviewing PyTorch models for Summer research internships'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    createdRequestId = res.body.data.id;
  });

  it('blocks duplicate pending guidance request to the same mentor', async () => {
    const res = await request(app)
      .post('/api/mentorship/requests')
      .set('Authorization', `Bearer ${menteeToken}`)
      .send({
        mentor_id: targetMentorId,
        topic: 'Duplicate Request Test',
        preferred_slot: 'Tuesday 17:00 - 18:00'
      });

    expect([400, 409]).toContain(res.status);
    const errMsg = res.body.error?.message || res.body.error;
    expect(errMsg).toContain('You already have a pending mentorship request');
  });

  it('allows mentor to accept guidance request and provisions private conversation', async () => {
    const res = await request(app)
      .patch(`/api/mentorship/requests/${createdRequestId}`)
      .set('Authorization', `Bearer ${mentorUserToken}`)
      .send({
        status: 'accepted',
        mentor_notes: 'Happy to connect! Let us discuss your PyTorch training scripts.'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('accepted');
    expect(res.body.data.conversationId).toBeDefined();
    activeConvId = res.body.data.conversationId;
  });

  it('allows mentee and mentor to exchange private messages', async () => {
    // Mentee sends message
    const msg1 = await request(app)
      .post(`/api/mentorship/conversations/${activeConvId}/messages`)
      .set('Authorization', `Bearer ${menteeToken}`)
      .send({ content: 'Hi Diya! Attached my recent CNN benchmark repository.' });

    expect(msg1.status).toBe(201);
    expect(msg1.body.success).toBe(true);
    expect(msg1.body.data.content).toContain('CNN benchmark');

    // Mentor sends message
    const msg2 = await request(app)
      .post(`/api/mentorship/conversations/${activeConvId}/messages`)
      .set('Authorization', `Bearer ${mentorUserToken}`)
      .send({ content: 'Looks great Aarav. I will review the loss curves tonight.' });

    expect(msg2.status).toBe(201);
    expect(msg2.body.success).toBe(true);

    // Retrieve conversation history
    const history = await request(app)
      .get(`/api/mentorship/conversations/${activeConvId}`)
      .set('Authorization', `Bearer ${menteeToken}`);

    expect(history.status).toBe(200);
    expect(history.body.data.messages.length).toBeGreaterThanOrEqual(2);
  });

  it('strictly isolates private mentorship conversations from unauthorized third parties', async () => {
    const res = await request(app)
      .get(`/api/mentorship/conversations/${activeConvId}`)
      .set('Authorization', `Bearer ${thirdPartyToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(res.body.error.message).toContain('private mentorship conversation');
  });
});
