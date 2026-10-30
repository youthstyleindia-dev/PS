import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../server/src/app';
import { AuthService } from '../../server/src/services/auth.service';
import { getDb, initDb } from '../../server/src/db/connection';

describe('UniVerse Campus Operations & Multi-Role Integration Suite', () => {
  let studentToken: string;
  let mentorToken: string;
  let driverToken: string;
  let wardenToken: string;
  let adminToken: string;
  let student3Token: string;

  beforeAll(() => {
    initDb();

    studentToken = AuthService.signToken({
      id: 'usr_student_1',
      email: 'aarav.sharma@campus.edu',
      role: 'student',
      roles: ['student'],
      name: 'Aarav Sharma',
      department: 'Computer Science & Engineering'
    });

    mentorToken = AuthService.signToken({
      id: 'usr_student_2',
      email: 'diya.patel@campus.edu',
      role: 'student',
      roles: ['student', 'mentor'],
      name: 'Diya Patel',
      department: 'Computer Science & Engineering'
    });

    driverToken = AuthService.signToken({
      id: 'usr_driver_1',
      email: 'vikram.rao@campus.edu',
      role: 'driver',
      roles: ['driver'],
      name: 'Vikram Rao',
      department: 'Campus Transit'
    });

    wardenToken = AuthService.signToken({
      id: 'usr_warden_1',
      email: 'warden@campus.edu',
      role: 'warden',
      roles: ['warden'],
      name: 'Campus Residential Warden',
      department: 'Hostel Administration'
    });

    adminToken = AuthService.signToken({
      id: 'usr_admin_1',
      email: 'admin@campus.edu',
      role: 'admin',
      roles: ['admin'],
      name: 'Campus IT Operations',
      department: 'Information Technology'
    });

    student3Token = AuthService.signToken({
      id: 'usr_student_3',
      email: 'rohan.verma@campus.edu',
      role: 'student',
      roles: ['student'],
      name: 'Rohan Verma',
      department: 'Electrical Engineering'
    });
  });

  describe('1. Campus Feed & Content Operations', () => {
    let createdPostId: string;

    it('allows student to publish a new discussion post', async () => {
      const res = await request(app)
        .post('/api/feed/posts')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          post_type: 'discussion',
          title: 'Autonomous Systems Reading Group',
          body: 'We are organizing weekly paper reviews on distributed consensus (Raft, Paxos). Who wants to join?',
          tags: ['systems', 'distributed', 'research'],
          visibility: 'campus'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.title).toBe('Autonomous Systems Reading Group');
      createdPostId = res.body.data.id;
    });

    it('fetches feed posts with tab and tag filters', async () => {
      const res = await request(app)
        .get('/api/feed?tab=for_you')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.posts.length).toBeGreaterThan(0);
    });

    it('allows student to like and toggle reaction on a post', async () => {
      const res = await request(app)
        .post(`/api/feed/posts/${createdPostId}/reactions`)
        .set('Authorization', `Bearer ${student3Token}`)
        .send({ reaction_type: 'like' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reacted).toBe(true);
    });

    it('allows student to bookmark a post', async () => {
      const res = await request(app)
        .post(`/api/feed/posts/${createdPostId}/bookmarks`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bookmarked).toBe(true);
    });

    it('allows student to add a comment to a post', async () => {
      const res = await request(app)
        .post(`/api/feed/posts/${createdPostId}/comments`)
        .set('Authorization', `Bearer ${mentorToken}`)
        .send({ content: 'Count me in! I can present the Raft paper.' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toContain('Count me in');
    });

    it('forbids unauthorized student from deleting another user post', async () => {
      const res = await request(app)
        .delete(`/api/feed/posts/${createdPostId}`)
        .set('Authorization', `Bearer ${student3Token}`);

      expect(res.status).toBe(403);
    });

    it('allows author to delete their own post', async () => {
      const res = await request(app)
        .delete(`/api/feed/posts/${createdPostId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('2. Senior Mentorship Lifecycle & Private Messaging', () => {
    let requestId: string;
    let conversationId: string;

    it('allows student to submit mentorship request to an approved mentor', async () => {
      const res = await request(app)
        .post('/api/mentorship/requests')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          mentor_id: 'usr_student_2', // Diya Patel
          topic: 'PyTorch Model Optimization & Placement Guidance',
          preferred_slot: 'Wednesday 16:00 - 17:30',
          notes: 'Seeking guidance on preparing for ML engineer campus interviews.'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      requestId = res.body.data.id;
    });

    it('allows mentor to accept mentorship request and spawns conversation', async () => {
      const res = await request(app)
        .patch(`/api/mentorship/requests/${requestId}`)
        .set('Authorization', `Bearer ${mentorToken}`)
        .send({
          status: 'accepted',
          mentor_notes: 'Happy to help! Let us connect on Wednesday.'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('accepted');
      expect(res.body.data.conversationId).toBeDefined();
      conversationId = res.body.data.conversationId;
    });

    it('allows participants to exchange messages in the accepted mentorship conversation', async () => {
      const sendRes = await request(app)
        .post(`/api/mentorship/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ content: 'Hi Diya, thank you for accepting! Should I share my GitHub repo beforehand?' });

      expect(sendRes.status).toBe(201);
      expect(sendRes.body.success).toBe(true);
      expect(sendRes.body.data.content).toContain('GitHub repo');

      const replyRes = await request(app)
        .post(`/api/mentorship/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${mentorToken}`)
        .send({ content: 'Yes, please share it along with your resume!' });

      expect(replyRes.status).toBe(201);
      expect(replyRes.body.success).toBe(true);

      const fetchRes = await request(app)
        .get(`/api/mentorship/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(fetchRes.status).toBe(200);
      expect(fetchRes.body.data.messages.length).toBeGreaterThanOrEqual(2);
    });

    it('strictly forbids non-participant from reading the private mentorship conversation', async () => {
      const res = await request(app)
        .get(`/api/mentorship/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${student3Token}`);

      expect(res.status).toBe(403);
    });
  });

  describe('3. Warden & Campus Facility Defect Triage', () => {
    let issueId: string;

    it('allows student to file a campus facility defect report', async () => {
      const res = await request(app)
        .post('/api/campus/facilities/issues')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'AC cooling unit failure in Turing Computer Lab 3',
          description: 'Server racks overheating due to blower failure on east wall.',
          category: 'electrical',
          urgency: 'high',
          location_id: 'LAB_CS_AI'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.status).toBe('open');
      issueId = res.body.data.id;
    });

    it('allows warden to view open facility issues', async () => {
      const res = await request(app)
        .get('/api/campus/facilities/issues?status=open')
        .set('Authorization', `Bearer ${wardenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.issues.some((i: any) => i.id === issueId)).toBe(true);
    });

    it('forbids students from changing facility issue triage status', async () => {
      const res = await request(app)
        .patch(`/api/campus/facilities/issues/${issueId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ status: 'resolved' });

      expect(res.status).toBe(403);
    });

    it('allows warden to assign and resolve facility issues with resolution audit notes', async () => {
      const progressRes = await request(app)
        .patch(`/api/campus/facilities/issues/${issueId}`)
        .set('Authorization', `Bearer ${wardenToken}`)
        .send({
          status: 'in_progress',
          resolution_notes: 'Technician dispatched with replacement fan assembly.'
        });

      expect(progressRes.status).toBe(200);
      expect(progressRes.body.data.status).toBe('in_progress');

      const resolveRes = await request(app)
        .patch(`/api/campus/facilities/issues/${issueId}`)
        .set('Authorization', `Bearer ${wardenToken}`)
        .send({
          status: 'resolved',
          resolution_notes: 'Fan assembly replaced. Ambient room temperature restored to 21°C.'
        });

      expect(resolveRes.status).toBe(200);
      expect(resolveRes.body.data.status).toBe('resolved');
      expect(resolveRes.body.data.resolution_notes).toContain('Fan assembly replaced');
    });
  });

  describe('4. Transit Driver Operations & Lifecycle', () => {
    let createdOfferId: string;

    it('allows transit driver to view assigned trips', async () => {
      const res = await request(app)
        .get('/api/rides/driver/trips')
        .set('Authorization', `Bearer ${driverToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.offers)).toBe(true);
    });

    it('allows transit driver to publish route offer', async () => {
      const res = await request(app)
        .post('/api/rides/offers')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          driverId: 'usr_driver_1',
          originNodeId: 'GATE_NORTH',
          destinationNodeId: 'GATE_SOUTH',
          departureTime: '17:30',
          totalSeats: 4,
          vehicleType: 'EV_CAR'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.offerId).toBeDefined();
      expect(res.body.driverRoute.length).toBeGreaterThanOrEqual(2);
      createdOfferId = res.body.offerId;
    });

    it('allows driver to update trip status through lifecycle: open -> in_progress -> completed', async () => {
      const startRes = await request(app)
        .patch(`/api/rides/offers/${createdOfferId}/status`)
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ status: 'in_progress' });

      expect(startRes.status).toBe(200);
      expect(startRes.body.success).toBe(true);
      expect(startRes.body.data.status).toBe('in_progress');

      const completeRes = await request(app)
        .patch(`/api/rides/offers/${createdOfferId}/status`)
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ status: 'completed' });

      expect(completeRes.status).toBe(200);
      expect(completeRes.body.data.status).toBe('completed');
    });

    it('forbids students from changing driver trip status', async () => {
      const res = await request(app)
        .patch(`/api/rides/offers/${createdOfferId}/status`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ status: 'cancelled' });

      expect(res.status).toBe(403);
    });
  });

  describe('5. UniVerse Campus Copilot Grounded AI', () => {
    let conversationId: string;

    it('allows user to initiate assistant conversation', async () => {
      const res = await request(app)
        .post('/api/assistant/conversations')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ title: 'Guidance on ML mentors and carpooling' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      conversationId = res.body.data.id;
    });

    it('answers query with grounded citations from live database records', async () => {
      const res = await request(app)
        .post(`/api/assistant/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ message: 'Can you recommend an ML senior mentor who works with PyTorch?' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toBeDefined();
      expect(res.body.data.sources.length).toBeGreaterThan(0);
      // Citations must point to real records in DB
      const mentorSource = res.body.data.sources.find((s: any) => s.sourceType === 'mentor');
      expect(mentorSource).toBeDefined();
    });

    it('answers query regarding upcoming hackathons with event citations', async () => {
      const res = await request(app)
        .post(`/api/assistant/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ message: 'Are there any hackathons or AI workshops coming up?' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toBeDefined();
      expect(res.body.data.sources.length).toBeGreaterThan(0);
    });
  });
});
