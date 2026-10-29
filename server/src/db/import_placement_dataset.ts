import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import { getDb, initDb } from './connection.js';

export interface PlacementDatasetRecord {
  Student_ID: string;
  Name: string;
  Email: string;
  Academic_Year: string;
  Program: string;
  Branch: string;
  Status: string;
  Placement_Category: string;
  Company_Profile: string;
  CTC_LPA: string;
  CGPA: string;
  Category_Inferred: string;
}

export function parseCSV(content: string): PlacementDatasetRecord[] {
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  const headerLine = lines[0];
  const headers = headerLine.split(',').map(h => h.trim());

  const records: PlacementDatasetRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Simple split since data does not contain escaped internal commas
    const cols = line.split(',').map(c => c.trim());
    if (cols.length < headers.length) continue;

    const row: any = {};
    headers.forEach((header, idx) => {
      row[header] = cols[idx] ?? '';
    });

    records.push(row as PlacementDatasetRecord);
  }

  return records;
}

export const BRANCH_NAMES: Record<string, string> = {
  COMP: 'Computer Engineering',
  IT: 'Information Technology',
  EXTC: 'Electronics & Telecommunication',
  ETRX: 'Electronics Engineering',
  'CSE - AIML': 'Computer Science & Engineering (AI & ML)',
  'CSE - DS': 'Computer Science & Engineering (Data Science)',
  MCA: 'Master of Computer Applications',
};

export const BRANCH_SKILLS: Record<string, string[]> = {
  COMP: ['Python', 'DSA', 'Java', 'System Design', 'SQL'],
  IT: ['Python', 'Full Stack', 'Cloud Architecture', 'DSA', 'PostgreSQL'],
  EXTC: ['Embedded C', 'IoT', 'Python', 'Digital Signal Processing', 'Microcontrollers'],
  ETRX: ['VLSI Design', 'Microcontrollers', 'C++', 'Circuit Simulation', 'Embedded Systems'],
  'CSE - AIML': ['Python', 'PyTorch', 'Machine Learning', 'DSA', 'Computer Vision'],
  'CSE - DS': ['Python', 'Data Science', 'SQL', 'Pandas', 'Statistical Modeling'],
  MCA: ['Java', 'Spring Boot', 'Database Systems', 'Web Applications', 'DSA'],
};

export async function importPlacementDataset(customDb?: Database.Database): Promise<{
  totalRecords: number;
  usersCreated: number;
  profilesCreated: number;
  placementsCreated: number;
}> {
  const db = customDb || getDb();
  initDb();

  // 1. Ensure table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS placement_records (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      academic_year TEXT NOT NULL,
      program TEXT NOT NULL,
      branch TEXT NOT NULL,
      status TEXT NOT NULL,
      placement_category TEXT,
      company_profile TEXT,
      ctc_lpa REAL,
      cgpa REAL,
      category_inferred TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_placement_records_email ON placement_records(email);
    CREATE INDEX IF NOT EXISTS idx_placement_records_branch ON placement_records(branch);
    CREATE INDEX IF NOT EXISTS idx_placement_records_status ON placement_records(status);
    CREATE INDEX IF NOT EXISTS idx_placement_records_year ON placement_records(academic_year);
  `);

  // 2. Locate CSV dataset
  const datasetPath = path.resolve(process.cwd(), 'server/data/dataset/spit_dummy_placement_dataset.csv');
  if (!fs.existsSync(datasetPath)) {
    throw new Error(`Placement dataset CSV not found at ${datasetPath}`);
  }

  const rawCSV = fs.readFileSync(datasetPath, 'utf-8');
  const records = parseCSV(rawCSV);
  console.log(`[Import] Parsed ${records.length} placement records from ${datasetPath}`);

  // 3. Generate standard bcrypt hash for password123
  const passwordHash = await bcrypt.hash('password123', 10);

  // 4. Prepared Statements
  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (
      id, name, email, password_hash, avatar, role, department, year_of_study, bio, is_active, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 'student', ?, 4, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);

  const insertRoleAssignment = db.prepare(`
    INSERT OR IGNORE INTO role_assignments (
      id, user_id, role_key, status, reason
    ) VALUES (?, ?, 'student', 'active', 'Placement dataset student persona')
  `);

  const upsertStudentProfile = db.prepare(`
    INSERT INTO student_profiles (
      user_id, skills, interests, target_role, target_company, placement_goals, readiness_score, gpa
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      skills = excluded.skills,
      interests = excluded.interests,
      target_role = excluded.target_role,
      target_company = excluded.target_company,
      placement_goals = excluded.placement_goals,
      readiness_score = excluded.readiness_score,
      gpa = excluded.gpa,
      updated_at = CURRENT_TIMESTAMP
  `);

  const upsertPlacementRecord = db.prepare(`
    INSERT INTO placement_records (
      id, student_id, user_id, name, email, academic_year, program, branch, status, placement_category, company_profile, ctc_lpa, cgpa, category_inferred
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET
      student_id = excluded.student_id,
      user_id = excluded.user_id,
      name = excluded.name,
      academic_year = excluded.academic_year,
      program = excluded.program,
      branch = excluded.branch,
      status = excluded.status,
      placement_category = excluded.placement_category,
      company_profile = excluded.company_profile,
      ctc_lpa = excluded.ctc_lpa,
      cgpa = excluded.cgpa,
      category_inferred = excluded.category_inferred
  `);

  let usersCreated = 0;
  let profilesCreated = 0;
  let placementsCreated = 0;

  // 5. Execute in single high-throughput database transaction
  const importTx = db.transaction(() => {
    for (const rec of records) {
      const email = rec.Email.toLowerCase().trim();
      const studentId = rec.Student_ID.trim();
      const cleanName = rec.Name.trim();
      const branchKey = rec.Branch.trim();
      const department = BRANCH_NAMES[branchKey] || branchKey;
      const skills = BRANCH_SKILLS[branchKey] || ['Python', 'DSA', 'SQL'];
      const cgpa = parseFloat(rec.CGPA) || 7.0;
      const ctc = parseFloat(rec.CTC_LPA) || null;
      const isPlaced = rec.Status.toLowerCase() === 'placed';

      // Deterministic User ID
      const sanitizedStudentSlug = studentId.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const userId = `usr_spit_${sanitizedStudentSlug}`;
      const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanName)}`;

      const bio = `${rec.Program} in ${branchKey} (${rec.Academic_Year}). Status: ${rec.Status}${rec.Placement_Category ? ' • ' + rec.Placement_Category : ''}${ctc ? ' (' + ctc + ' LPA)' : ''}`;

      // Calculate collegiate readiness index (0-100)
      let readinessScore = Math.min(100, Math.round(cgpa * 10));
      if (isPlaced) {
        readinessScore = Math.min(100, Math.max(88, Math.round(cgpa * 10 + 5)));
      } else if (rec.Status.toLowerCase().includes('higher studies')) {
        readinessScore = Math.min(95, Math.max(80, Math.round(cgpa * 10)));
      }

      const targetRole = isPlaced && rec.Placement_Category
        ? `${rec.Placement_Category} Software Engineer`
        : 'Associate Software Engineer';

      const targetCompany = rec.Company_Profile || (isPlaced ? 'Top Product Firm' : 'Leading Tech Recruiter');

      const placementGoals = isPlaced
        ? `Secured campus offer at ${targetCompany} (${ctc} LPA)`
        : `Targeting campus placement drive in ${branchKey} (${rec.Academic_Year})`;

      // A. Insert User
      const userRes = insertUser.run(
        userId,
        cleanName,
        email,
        passwordHash,
        avatar,
        department,
        bio
      );
      if (userRes.changes > 0) {
        usersCreated++;
      }

      // B. Insert Role Assignment (STUDENT role)
      insertRoleAssignment.run(
        `ra_${userId}_student`,
        userId
      );

      // C. Upsert Student Profile
      upsertStudentProfile.run(
        userId,
        JSON.stringify(skills),
        JSON.stringify([branchKey, rec.Program, 'Campus Placement']),
        targetRole,
        targetCompany,
        placementGoals,
        readinessScore,
        cgpa
      );
      profilesCreated++;

      // D. Upsert Placement Record
      const placementRecordId = `pl_${sanitizedStudentSlug}`;
      upsertPlacementRecord.run(
        placementRecordId,
        studentId,
        userId,
        cleanName,
        email,
        rec.Academic_Year,
        rec.Program,
        rec.Branch,
        rec.Status,
        rec.Placement_Category || null,
        rec.Company_Profile || null,
        ctc,
        cgpa,
        rec.Category_Inferred || null
      );
      placementsCreated++;
    }
  });

  importTx();

  console.log(`✅ [Import] Successfully created/updated ${placementsCreated} placement records and student accounts.`);

  return {
    totalRecords: records.length,
    usersCreated,
    profilesCreated,
    placementsCreated,
  };
}

// Allow direct CLI execution
if (process.argv[1]?.endsWith('import_placement_dataset.ts') || process.argv[1]?.endsWith('import_placement_dataset.js')) {
  importPlacementDataset()
    .then(stats => {
      console.log('Import Statistics:', stats);
      process.exit(0);
    })
    .catch(err => {
      console.error('Import failed:', err);
      process.exit(1);
    });
}
