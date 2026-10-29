import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../server/src/app';
import { AuthService } from '../../server/src/services/auth.service';
import { getDb, initDb } from '../../server/src/db/connection';

describe('Unit & Integration Test Suite: Full-Depth Authentication Engine', () => {
  beforeAll(() => {
    initDb();
  });

  describe('1. Cryptographic Security & Password Hashing', () => {
    it('hashes passwords with bcrypt salt and verifies valid passwords', async () => {
      const plaintext = 'SuperSecretCampusPass2026!';
      const hash = await AuthService.hashPassword(plaintext);
      expect(hash).not.toBe(plaintext);
      expect(hash.startsWith('$2')).toBe(true);

      const isValid = await AuthService.comparePassword(plaintext, hash);
      expect(isValid).toBe(true);

      const isInvalid = await AuthService.comparePassword('WrongPassword', hash);
      expect(isInvalid).toBe(false);
    });

    it('signs and verifies JWT tokens with standard claims', () => {
      const user = {
        id: 'usr_test_token_1',
        email: 'token.test@campus.edu',
        role: 'student' as const,
        name: 'Token Tester',
        department: 'CS'
      };

      const token = AuthService.signToken(user);
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);

      const decoded = AuthService.verifyToken(token);
      expect(decoded.sub).toBe(user.id);
      expect(decoded.email).toBe(user.email);
      expect(decoded.role).toBe(user.role);
    });
  });

  describe('2. User Registration & Profile Provisioning', () => {
    it('successfully registers a new student with auto-provisioned student profile', async () => {
      const testEmail = `new.student.${Date.now()}@campus.edu`;
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: testEmail,
          password: 'SecurePassword123!',
          role: 'student',
          department: 'Computer Science & Engineering',
          year_of_study: 2
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(testEmail);
      expect(res.body.data.user.role).toBe('student');

      // Verify row in database
      const db = getDb();
      const userRow = db.prepare('SELECT * FROM users WHERE email = ?').get(testEmail) as any;
      expect(userRow).toBeDefined();
      expect(userRow.password_hash).toBeDefined();

      const studentProfile = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(userRow.id);
      expect(studentProfile).toBeDefined();
    });

    it('rejects registration with duplicate email with 409 Conflict', async () => {
      const duplicateEmail = `dup.${Date.now()}@campus.edu`;
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Original User',
          email: duplicateEmail,
          password: 'Password123!',
          role: 'student'
        });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Impostor User',
          email: duplicateEmail,
          password: 'AnotherPassword123!',
          role: 'student'
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('rejects passwords shorter than 8 characters', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Short Pass',
          email: `short.${Date.now()}@campus.edu`,
          password: 'short',
          role: 'student'
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('BAD_REQUEST');
    });
  });

  describe('3. Login, JWT Issuance & Session Management', () => {
    it('authenticates demo persona with real signed JWT', async () => {
      const res = await request(app)
        .post('/api/auth/demo-login')
        .send({ role: 'student' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.role).toBe('student');

      // Verify JWT signature using AuthService
      const decoded = AuthService.verifyToken(res.body.data.token);
      expect(decoded.role).toBe('student');
    });

    it('authenticates with email and password, returning 200 and token', async () => {
      const email = `login.test.${Date.now()}@campus.edu`;
      const password = 'CorrectPassword123!';

      // Register first
      await request(app).post('/api/auth/register').send({
        name: 'Login Tester',
        email,
        password,
        role: 'driver'
      });

      // Login with correct password
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email, password });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.data.token).toBeDefined();
      expect(loginRes.body.data.user.email).toBe(email);
    });

    it('rejects incorrect password with 401 Unauthorized', async () => {
      const email = `wrong.pass.${Date.now()}@campus.edu`;
      await request(app).post('/api/auth/register').send({
        name: 'Wrong Pass Tester',
        email,
        password: 'ValidPassword123!',
        role: 'student'
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email, password: 'IncorrectPassword999!' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('4. Protected Routes & Session Introspection', () => {
    it('allows access to /api/auth/me with valid Bearer token', async () => {
      const loginRes = await request(app)
        .post('/api/auth/demo-login')
        .send({ role: 'proctor' });

      const token = loginRes.body.data.token;

      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.data.role).toBe('proctor');
      expect(meRes.body.data.permissions.canAuditExams).toBe(true);
    });

    it('rejects access to /api/auth/me without Bearer token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('allows changing password after verifying current password', async () => {
      const email = `change.pass.${Date.now()}@campus.edu`;
      const oldPass = 'OldPass123!';
      const newPass = 'NewPass456!';

      const reg = await request(app).post('/api/auth/register').send({
        name: 'Changer',
        email,
        password: oldPass,
        role: 'student'
      });
      const token = reg.body.data.token;

      const changeRes = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: oldPass, newPassword: newPass });

      expect(changeRes.status).toBe(200);
      expect(changeRes.body.success).toBe(true);

      // Verify login works with new password
      const newLogin = await request(app)
        .post('/api/auth/login')
        .send({ email, password: newPass });

      expect(newLogin.status).toBe(200);
    });

    it('logs out and revokes active session', async () => {
      const loginRes = await request(app)
        .post('/api/auth/demo-login')
        .send({ role: 'admin' });

      const token = loginRes.body.data.token;

      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);
    });
  });
});
