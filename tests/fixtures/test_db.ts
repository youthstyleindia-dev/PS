import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

export function createTestDb(inMemory = true): Database.Database {
  const db = new Database(inMemory ? ':memory:' : path.join(__dirname, 'test.db'));
  db.pragma('foreign_keys = ON');

  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schemaSql);

  // Seed baseline test fixtures
  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, avatar, role, department, year_of_study, bio)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run('stu-1', 'Aarav Sharma', 'aarav@universe.edu', '/avatars/aarav.png', 'student', 'Computer Science', 3, 'Specializing in Distributed Systems & AI');
  insertUser.run('stu-2', 'Priya Patel', 'priya@universe.edu', '/avatars/priya.png', 'student', 'Data Science', 4, 'Incoming SDE at Google');
  insertUser.run('stu-3', 'Rohan Gupta', 'rohan@universe.edu', '/avatars/rohan.png', 'student', 'Electrical Eng', 2, 'Robotics enthusiast');
  insertUser.run('stu-4', 'Ananya Rao', 'ananya@universe.edu', '/avatars/ananya.png', 'student', 'Computer Science', 3, 'Competitive programmer');
  insertUser.run('stu-5', 'Vikram Singh', 'vikram@universe.edu', '/avatars/vikram.png', 'student', 'Computer Science', 4, 'AI Systems Researcher');
  insertUser.run('drv-1', 'Karan Verma', 'karan@universe.edu', '/avatars/karan.png', 'driver', 'Mechanical Eng', 4, 'Daily commuter with EV');
  insertUser.run('proctor-1', 'Dr. Meera Sen', 'proctor.meera@universe.edu', '/avatars/meera.png', 'proctor', 'Exam Office', 10, 'Certified Academic Proctor');
  insertUser.run('admin-1', 'Prof. S. Narayanan', 'admin@universe.edu', '/avatars/admin.png', 'admin', 'IT Operations', 15, 'Chief Infrastructure Officer');

  // Student profile
  db.prepare(`
    INSERT INTO student_profiles (user_id, skills, interests, target_role, readiness_score, resume_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    'stu-1',
    JSON.stringify(['TypeScript', 'C++', 'Algorithms', 'Distributed Systems']),
    JSON.stringify(['Cloud Computing', 'Autonomous Vehicles']),
    'Full-Stack Engineer',
    50,
    'https://universe.edu/resumes/aarav.pdf'
  );

  // Placement milestones
  const insertMilestone = db.prepare(`
    INSERT INTO placement_milestones (id, student_id, title, category, completed, completed_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertMilestone.run('m-1', 'stu-1', 'Solve 150 LeetCode Medium/Hard DSA Problems', 'DSA', 1, '2026-09-15 10:00:00');
  insertMilestone.run('m-2', 'stu-1', 'Design High-Throughput URL Shortener', 'SystemDesign', 1, '2026-10-01 14:00:00');
  insertMilestone.run('m-3', 'stu-1', 'Operating Systems Virtual Memory deep dive', 'CoreCS', 0, null);
  insertMilestone.run('m-4', 'stu-1', 'Conduct Peer Mock Technical Interview', 'MockInterview', 0, null);

  // Mentors
  db.prepare(`
    INSERT INTO mentors (id, user_id, company, available_slots, max_mentees, rating)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('mentor-1', 'stu-2', 'Google', JSON.stringify(['Mon 16:00', 'Wed 18:00', 'Fri 17:00']), 5, 4.9);

  db.prepare(`
    INSERT INTO mentors (id, user_id, company, available_slots, max_mentees, rating)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('mentor-2', 'stu-5', 'Microsoft', JSON.stringify(['Tue 17:00', 'Thu 19:00']), 4, 4.8);

  // Academic resources
  const insertResource = db.prepare(`
    INSERT INTO academic_resources (id, title, course_code, category, file_url, uploader_id, downloads_count, average_rating)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertResource.run('res-1', 'CS301 Advanced OS Kernel & Virtual Memory Notes', 'CS301', 'Notes', 'https://universe.edu/files/cs301_notes.pdf', 'stu-1', 42, 4.8);
  insertResource.run('res-2', 'CS301 End-Sem Exam Question Paper 2025', 'CS301', 'PYQ', 'https://universe.edu/files/cs301_pyq_2025.pdf', 'stu-2', 95, 4.9);
  insertResource.run('res-3', 'CS204 Data Structures & Algorithms Lab Guide', 'CS204', 'Guide', 'https://universe.edu/files/cs204_guide.pdf', 'stu-4', 128, 4.7);

  // Workload services
  const insertService = db.prepare(`
    INSERT INTO workload_services (id, name, description, baseline_replicas, current_replicas, target_rps, cpu_pct, gpu_pct, memory_mb)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertService.run('srv-portal', 'Student Academic Portal & LMS', 'Web application and database transactions', 2, 2, 120, 42.0, 0.0, 8192);
  insertService.run('srv-ai-gpu', 'Campus AI Research & GPU Cluster', 'Multi-tenant PyTorch and LLM inference jobs', 4, 4, 25, 68.0, 85.0, 32768);
  insertService.run('srv-iot', 'Campus Smart Infrastructure Ingestion', 'Sensor streams from dorms, gates and solar inverters', 2, 2, 450, 28.0, 0.0, 4096);

  // Domain rules
  const insertRule = db.prepare(`
    INSERT INTO domain_rules (id, user_id, domain_pattern, category, is_custom)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertRule.run('rule-1', 'stu-1', 'github.com', 'PRODUCTIVE', 0);
  insertRule.run('rule-2', 'stu-1', 'stackoverflow.com', 'PRODUCTIVE', 0);
  insertRule.run('rule-3', 'stu-1', 'youtube.com', 'DISTRACTING', 0);
  insertRule.run('rule-4', 'stu-1', 'instagram.com', 'DISTRACTING', 0);
  insertRule.run('rule-5', 'stu-1', 'google.com', 'NEUTRAL', 0);

  // Scheduled Exam Session
  db.prepare(`
    INSERT INTO exam_sessions (id, title, course_code, student_id, scheduled_start, scheduled_end, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run('exam-cs301', 'CS301 Operating Systems Final Examination', 'CS301', 'stu-1', '2026-11-01 09:00:00', '2026-11-01 12:00:00', 'in_progress');

  return db;
}
