import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../server/src/app';
import { getDb } from '../../server/src/db/connection';
import { AuthService } from '../../server/src/services/auth.service';

describe('Campus Feed Operations & Access Control E2E Suite', () => {
  const db = getDb();
  let studentToken: string;
  let facultyToken: string;
  let adminToken: string;

  beforeAll(() => {
    expect(db).toBeDefined();

    studentToken = AuthService.signToken({
      id: 'usr_student_1',
      email: 'aarav.sharma@campus.edu',
      role: 'student',
      roles: ['student'],
      name: 'Aarav Sharma',
      department: 'Computer Science & Engineering'
    });

    facultyToken = AuthService.signToken({
      id: 'usr_faculty_1',
      email: 'dr.patel@campus.edu',
      role: 'ta_faculty',
      roles: ['ta_faculty'],
      name: 'Dr. Priya Patel',
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

  it('GET /api/feed returns feed posts and announcements for authenticated user', async () => {
    const res = await request(app)
      .get('/api/feed?limit=10')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.posts)).toBe(true);
    expect(res.body.data.posts.length).toBeGreaterThan(0);
  });

  it('allows student to create general discussion post', async () => {
    const res = await request(app)
      .post('/api/feed/posts')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        body: 'Anyone interested in forming a PyTorch deep learning study group for the upcoming hackathon?',
        post_type: 'question',
        category: 'academic',
        tags: ['PyTorch', 'DeepLearning', 'StudyGroup']
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.postType).toBe('question');
  });

  it('blocks student from publishing official announcement (403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/feed/posts')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Emergency Cluster Maintenance',
        body: 'Slurm cluster will be down at midnight.',
        post_type: 'announcement',
        category: 'general'
      });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(res.body.error.message).toContain('Only authorized faculty');
  });

  it('allows faculty or admin to publish official announcement', async () => {
    const res = await request(app)
      .post('/api/feed/posts')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        title: 'Mid-Semester Lab Schedules Published',
        body: 'Please review your allocated laboratory slots on the departmental board.',
        post_type: 'announcement',
        category: 'academic'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.postType).toBe('announcement');
  });

  it('toggles reaction (like) on a post idempotently', async () => {
    const feed = await request(app)
      .get('/api/feed?limit=1')
      .set('Authorization', `Bearer ${studentToken}`);
    const postId = feed.body.data.posts[0].id;

    // First like -> toggled on
    const res1 = await request(app)
      .post(`/api/feed/posts/${postId}/reactions`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ reaction_type: 'like' });

    expect(res1.status).toBe(200);
    expect(res1.body.success).toBe(true);
    expect(typeof res1.body.data.reacted).toBe('boolean');

    // Second like -> toggled off
    const res2 = await request(app)
      .post(`/api/feed/posts/${postId}/reactions`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ reaction_type: 'like' });

    expect(res2.status).toBe(200);
    expect(res2.body.data.reacted).toBe(!res1.body.data.reacted);
  });

  it('adds comment and retrieves comment thread', async () => {
    const feed = await request(app)
      .get('/api/feed?limit=1')
      .set('Authorization', `Bearer ${studentToken}`);
    const postId = feed.body.data.posts[0].id;

    const commentRes = await request(app)
      .post(`/api/feed/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ content: 'Verified this benchmark on the Slurm cluster—performance is reproducible.' });

    expect(commentRes.status).toBe(201);
    expect(commentRes.body.success).toBe(true);
    expect(commentRes.body.data.id).toBeDefined();

    const postDetail = await request(app)
      .get(`/api/feed/posts/${postId}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(postDetail.status).toBe(200);
    expect(postDetail.body.data.comments.length).toBeGreaterThan(0);
  });

  it('toggles bookmarks for current user', async () => {
    const feed = await request(app)
      .get('/api/feed?limit=1')
      .set('Authorization', `Bearer ${studentToken}`);
    const postId = feed.body.data.posts[0].id;

    const b1 = await request(app)
      .post(`/api/feed/posts/${postId}/bookmarks`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(b1.status).toBe(200);
    expect(typeof b1.body.data.bookmarked).toBe('boolean');

    const b2 = await request(app)
      .post(`/api/feed/posts/${postId}/bookmarks`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(b2.status).toBe(200);
    expect(b2.body.data.bookmarked).toBe(!b1.body.data.bookmarked);
  });

  it('allows reporting inappropriate content for moderation queue', async () => {
    const feed = await request(app)
      .get('/api/feed?limit=1')
      .set('Authorization', `Bearer ${studentToken}`);
    const postId = feed.body.data.posts[0].id;

    const reportRes = await request(app)
      .post(`/api/feed/posts/${postId}/reports`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ reason: 'Commercial solicitation / Spam link' });

    expect([200, 201]).toContain(reportRes.status);
    expect(reportRes.body.success).toBe(true);
  });
});
