import assert from 'node:assert';
import request from 'supertest';
import app from '../server/src/index.js';
import { getDb, initDb } from '../server/src/db/connection.js';

initDb();
const db = getDb();

async function runDeepStress() {
  console.log('>>> DEEP ADVERSARIAL STRESS TEST');

  // 1. Unicode & Special Character Search in Resources and Mentors
  const strangeQueries = [
    '🔥 🚀 💯',
    '(\\[.*?\\])+',
    '../../etc/passwd',
    'SELECT * FROM users WHERE 1=1',
    'null',
    'undefined',
    '   ',
    '漢字・日本語',
    '\\\\\\\'\'""'
  ];

  for (const q of strangeQueries) {
    const resRes = await request(app).get('/api/hub/resources').query({ query: q });
    assert.strictEqual(resRes.status, 200, `Failed on resource query: ${q}`);
    assert.ok(Array.isArray(resRes.body.resources));

    const mentorRes = await request(app).get('/api/hub/mentors').query({ skill: q, company: q });
    assert.strictEqual(mentorRes.status, 200, `Failed on mentor query: ${q}`);
    assert.ok(Array.isArray(mentorRes.body.mentors));
  }
  console.log('✔ Unicode & Special character search resilience: PASS');

  // 2. All Milestones Toggled to Completed
  const studentId = 'usr_student_1';
  const allMilestones = db.prepare('SELECT id, status FROM placement_milestones WHERE student_id = ?').all(studentId) as any[];
  
  // Set all to completed
  for (const ms of allMilestones) {
    if (ms.status !== 'completed') {
      const toggleRes = await request(app)
        .post(`/api/hub/placement-milestones/${studentId}/toggle`)
        .send({ milestoneId: ms.id });
      assert.strictEqual(toggleRes.status, 200);
    }
  }

  const profileRes = await request(app).get(`/api/hub/profile/${studentId}`);
  assert.strictEqual(profileRes.status, 200);
  assert.ok(profileRes.body.readinessScore >= 80, `Readiness score when all completed should be high: ${profileRes.body.readinessScore}`);
  console.log(`✔ All milestones completed readiness score: ${profileRes.body.readinessScore}% (PASS)`);

  // 3. Error propagation contract test across all status codes
  // 400 Bad Request
  const badReq = await request(app).post('/api/hub/mentorship-requests').send({});
  assert.strictEqual(badReq.status, 400);
  assert.ok(badReq.body.error && badReq.body.error.message, '400 must contain error message');

  // 404 Not Found
  const notFound = await request(app).get('/api/hub/profile/non_existent_student_999');
  assert.strictEqual(notFound.status, 404);
  assert.ok(notFound.body.error && notFound.body.error.message, '404 must contain error message');

  // 409 Conflict
  const conflict = await request(app).post('/api/hub/mentorship-requests').send({
    menteeId: 'usr_student_1',
    mentorId: 'men_1',
    topic: 'Testing conflict contract',
    preferredSlot: 'Sat 11:00 AM'
  });
  assert.strictEqual(conflict.status, 409);
  assert.strictEqual(conflict.body.error.code, 'CONFLICT');
  assert.ok(conflict.body.error.message.includes('already exists'));

  console.log('✔ Error payload contracts (400, 404, 409): PASS');

  // Reset milestones back to original seed state for student 1
  const seedCompleted = ['ms_1', 'ms_2', 'ms_5', 'ms_7', 'ms_8'];
  for (const ms of allMilestones) {
    const shouldBeCompleted = seedCompleted.includes(ms.id);
    db.prepare('UPDATE placement_milestones SET status = ? WHERE id = ?').run(
      shouldBeCompleted ? 'completed' : 'pending',
      ms.id
    );
  }
  // Recalculate readiness
  const completedCount = db.prepare("SELECT count(*) as c FROM placement_milestones WHERE student_id = ? AND status = 'completed'").get(studentId) as any;
  const newScore = Math.min(100, Math.round((completedCount.c / 8) * 50) + 50);
  db.prepare('UPDATE student_profiles SET readiness_score = ? WHERE user_id = ?').run(newScore, studentId);

  console.log(`✔ Milestones state cleanly restored. Readiness: ${newScore}%`);
  console.log('>>> ALL DEEP STRESS TESTS PASSED CLEANLY');
}

runDeepStress().catch(err => {
  console.error(err);
  process.exit(1);
});
