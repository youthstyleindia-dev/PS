import { getDb } from './connection.js';

export function verifyDemoData(): boolean {
  const db = getDb();
  console.log('[Verification] Starting deterministic verification of UniVerse demo dataset...\n');

  let passed = true;

  // 1. Check users
  const userCount = db.prepare('SELECT count(*) as count FROM users WHERE is_demo = 1').get() as { count: number };
  console.log(`- Demo users count: ${userCount.count} (Target: >= 20)`);
  if (userCount.count < 20) {
    console.error('FAILED: Insufficient demo users');
    passed = false;
  }

  // 2. Check mentors and ML mentors
  const mentorCount = db.prepare('SELECT count(*) as count FROM mentors WHERE is_demo = 1').get() as { count: number };
  const mlMentors = db.prepare(`
    SELECT count(*) as count FROM mentors 
    WHERE is_demo = 1 AND (skills LIKE '%Machine Learning%' OR skills LIKE '%Deep Learning%' OR domain LIKE '%Machine Learning%')
  `).get() as { count: number };
  console.log(`- Demo mentors count: ${mentorCount.count} (Target: >= 6)`);
  console.log(`- ML mentors count: ${mlMentors.count} (Target: >= 3)`);
  if (mentorCount.count < 6 || mlMentors.count < 3) {
    console.error('FAILED: Insufficient ML mentors');
    passed = false;
  }

  // 3. Check feed posts
  const postCount = db.prepare('SELECT count(*) as count FROM feed_posts WHERE is_demo = 1').get() as { count: number };
  console.log(`- Demo feed posts: ${postCount.count} (Target: >= 10)`);
  if (postCount.count < 10) {
    console.error('FAILED: Insufficient feed posts');
    passed = false;
  }

  // 4. Check communities & events
  const commCount = db.prepare('SELECT count(*) as count FROM communities WHERE is_demo = 1').get() as { count: number };
  const eventCount = db.prepare('SELECT count(*) as count FROM campus_events WHERE is_demo = 1').get() as { count: number };
  console.log(`- Communities count: ${commCount.count} (Target: >= 4)`);
  console.log(`- Campus events count: ${eventCount.count} (Target: >= 4)`);
  if (commCount.count < 4 || eventCount.count < 4) {
    console.error('FAILED: Insufficient communities or events');
    passed = false;
  }

  // 5. Check foreign key integrity
  const fkCheck = db.prepare('PRAGMA foreign_key_check').all();
  console.log(`- Foreign key integrity violations: ${fkCheck.length}`);
  if (fkCheck.length > 0) {
    console.error('FAILED: Foreign key check failed', fkCheck);
    passed = false;
  }

  console.log(`\n[Verification] Result: ${passed ? 'ALL INVARIANTS PASSED' : 'VERIFICATION FAILED'}`);
  return passed;
}

if (process.argv[1]?.endsWith('verify_demo.ts') || process.argv[1]?.endsWith('verify_demo.js')) {
  const ok = verifyDemoData();
  process.exit(ok ? 0 : 1);
}
