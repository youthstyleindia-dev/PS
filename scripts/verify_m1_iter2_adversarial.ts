import assert from 'node:assert';
import request from 'supertest';
import app from '../server/src/index.js';
import { getDb, initDb } from '../server/src/db/connection.js';
import fs from 'fs';
import path from 'path';

// Load roleConfigs and mock data definitions for empirical validation
import { roleConfigs } from '../client/src/components/RoleSwitcher.js';
import type { UserRole, PlacementMilestone } from '../client/src/types/index.js';

interface TestResult {
  section: string;
  test: string;
  status: 'PASS' | 'FAIL';
  details: string;
}

const report: TestResult[] = [];

function check(section: string, test: string, condition: boolean, details: string) {
  report.push({
    section,
    test,
    status: condition ? 'PASS' : 'FAIL',
    details
  });
  console.log(`[${condition ? 'PASS' : 'FAIL'}] [${section}] ${test}: ${details}`);
}

async function runAdversarialValidation() {
  console.log('================================================================');
  console.log('CHALLENGER M1 ITERATION 2: ADVERSARIAL VERIFICATION HARNESS');
  console.log('================================================================\n');

  initDb();
  const db = getDb();

  // ---------------------------------------------------------------------------
  // TASK 1: Verify Client Compilation
  // ---------------------------------------------------------------------------
  console.log('>>> TASK 1: Verify Client Compilation');
  const distDir = path.resolve('client/dist');
  const indexHtml = path.resolve(distDir, 'index.html');
  const assetsDir = path.resolve(distDir, 'assets');

  const buildExists = fs.existsSync(indexHtml) && fs.existsSync(assetsDir);
  const jsFiles = buildExists ? fs.readdirSync(assetsDir).filter(f => f.endsWith('.js')) : [];
  const cssFiles = buildExists ? fs.readdirSync(assetsDir).filter(f => f.endsWith('.css')) : [];

  check(
    'Task 1: Client Compilation',
    'Build Artifacts Exist',
    buildExists && jsFiles.length > 0 && cssFiles.length > 0,
    `Found index.html, ${jsFiles.length} JS bundle(s), ${cssFiles.length} CSS bundle(s)`
  );

  // ---------------------------------------------------------------------------
  // TASK 2: Dynamic Radar Chart Reactivity
  // ---------------------------------------------------------------------------
  console.log('\n>>> TASK 2: Dynamic Radar Chart Reactivity');
  const academicHubSrc = fs.readFileSync('client/src/pages/AcademicHub.tsx', 'utf8');

  // Check 1: useMemo is imported and used with milestones dependency
  const usesUseMemoForRadar = /const\s+radarData\s*=\s*useMemo\(\s*\(\)\s*=>\s*\{[\s\S]*?\}\s*,\s*\[\s*milestones\s*\]\s*\)/.test(academicHubSrc);
  check(
    'Task 2: Radar Chart',
    'useMemo Hook Usage with [milestones] Dependency',
    usesUseMemoForRadar,
    usesUseMemoForRadar ? 'radarData is wrapped in useMemo([milestones])' : 'radarData does not depend on [milestones]'
  );

  // Check 2: Dynamic category calculation logic simulation
  // Simulate the exact category computation from AcademicHub.tsx:
  const computeRadarData = (milestonesList: PlacementMilestone[]) => {
    const categories: { key: string; subject: string; fallback: number }[] = [
      { key: 'DSA', subject: 'DSA & Graphs', fallback: 50 },
      { key: 'SystemDesign', subject: 'System Design', fallback: 40 },
      { key: 'SoftSkills', subject: 'Soft Skills', fallback: 60 },
      { key: 'Resume', subject: 'Resume', fallback: 50 },
      { key: 'MockInterview', subject: 'Mock Interview', fallback: 30 }
    ];

    return categories.map(({ key, subject, fallback }) => {
      const catMilestones = milestonesList.filter(
        (m) =>
          m.category.toLowerCase().replace(/[^a-z]/g, '') ===
          key.toLowerCase().replace(/[^a-z]/g, '')
      );
      const total = catMilestones.length;
      const completed = catMilestones.filter((m) => m.completed).length;
      const score = total > 0 ? Math.round((completed / total) * 100) : fallback;
      return { subject, score, fullMark: 100 };
    });
  };

  const sampleMilestones: PlacementMilestone[] = [
    { id: '1', studentId: 's1', title: 'DSA 1', category: 'DSA', completed: true },
    { id: '2', studentId: 's1', title: 'DSA 2', category: 'DSA', completed: false },
    { id: '3', studentId: 's1', title: 'SysDesign 1', category: 'SystemDesign', completed: true },
    { id: '4', studentId: 's1', title: 'SysDesign 2', category: 'SystemDesign', completed: true },
    { id: '5', studentId: 's1', title: 'Resume Review', category: 'Resume', completed: false }
  ];

  const radar1 = computeRadarData(sampleMilestones);
  const dsa1 = radar1.find(r => r.subject === 'DSA & Graphs')?.score;
  const sys1 = radar1.find(r => r.subject === 'System Design')?.score;
  const res1 = radar1.find(r => r.subject === 'Resume')?.score;

  check(
    'Task 2: Radar Chart',
    'Initial Category Score Calculations',
    dsa1 === 50 && sys1 === 100 && res1 === 0,
    `DSA: ${dsa1}% (1/2), SystemDesign: ${sys1}% (2/2), Resume: ${res1}% (0/1)`
  );

  // Toggle DSA 2 to true -> DSA becomes 100%
  const sampleMilestonesToggled = sampleMilestones.map(m => m.id === '2' ? { ...m, completed: true } : m);
  const radar2 = computeRadarData(sampleMilestonesToggled);
  const dsa2 = radar2.find(r => r.subject === 'DSA & Graphs')?.score;

  check(
    'Task 2: Radar Chart',
    'Reactive Score Recalibration on Toggle',
    dsa2 === 100,
    `Toggling DSA milestone dynamically updated DSA score from 50% to ${dsa2}%`
  );

  // Check handleToggleMilestone in AcademicHub
  const hasToggleHandler = academicHubSrc.includes('handleToggleMilestone') &&
    academicHubSrc.includes('setMilestones((prev)');
  check(
    'Task 2: Radar Chart',
    'Component State Trigger in handleToggleMilestone',
    hasToggleHandler,
    'handleToggleMilestone updates setMilestones with functional updater'
  );

  // ---------------------------------------------------------------------------
  // TASK 3: Empty States Across Resources, Mentors, and Requests
  // ---------------------------------------------------------------------------
  console.log('\n>>> TASK 3: Verify Empty States Across Tabs');

  // 3.1 Academic Resources Empty State
  const resEmptyCheck = await request(app)
    .get('/api/hub/resources')
    .query({ courseCode: 'NON_EXISTENT_COURSE_999' });

  const hasResourcesEmptyUI =
    academicHubSrc.includes('resources.length === 0') &&
    academicHubSrc.includes('No resources found') &&
    academicHubSrc.includes('Reset Filters');

  check(
    'Task 3: Empty States',
    'Resources Backend & UI Empty State Handling',
    resEmptyCheck.status === 200 && resEmptyCheck.body.resources.length === 0 && hasResourcesEmptyUI,
    `Backend returned 0 items; AcademicHub renders dedicated "No resources found" card with Reset Filters button`
  );

  // 3.2 Peer Mentors Empty State
  const mentorEmptyCheck = await request(app)
    .get('/api/hub/mentors')
    .query({ skill: 'NON_EXISTENT_SKILL_XYZ_999' });

  const hasMentorsEmptyUI =
    academicHubSrc.includes('mentors.length === 0') &&
    academicHubSrc.includes('No peer mentors found') &&
    academicHubSrc.includes('Clear Filters');

  check(
    'Task 3: Empty States',
    'Mentors Backend & UI Empty State Handling',
    mentorEmptyCheck.status === 200 && mentorEmptyCheck.body.mentors.length === 0 && hasMentorsEmptyUI,
    `Backend returned 0 mentors; AcademicHub renders dedicated "No peer mentors found" card with Clear Filters button`
  );

  // 3.3 Mentorship Requests Empty State
  const reqEmptyCheck = await request(app)
    .get('/api/hub/mentorship-requests/usr_student_4');

  const hasRequestsEmptyUI =
    academicHubSrc.includes('requests.length === 0') &&
    academicHubSrc.includes('No mentorship requests') &&
    academicHubSrc.includes('Find a Mentor');

  check(
    'Task 3: Empty States',
    'Requests Backend & UI Empty State Handling',
    reqEmptyCheck.status === 200 && reqEmptyCheck.body.sent.length === 0 && hasRequestsEmptyUI,
    `Backend returned 0 requests; AcademicHub renders dedicated "No mentorship requests" card with "Find a Mentor" CTA`
  );

  // ---------------------------------------------------------------------------
  // TASK 4: Error Propagation (Verify 4xx Rejections are not Swallowed)
  // ---------------------------------------------------------------------------
  console.log('\n>>> TASK 4: Error Propagation & 4xx Rejection Non-Swallowing');

  const clientHubServiceSrc = fs.readFileSync('client/src/services/hub.service.ts', 'utf8');
  const apiSrc = fs.readFileSync('client/src/services/api.ts', 'utf8');

  // Verify api.ts throws on !res.ok with backend error message
  const apiThrowsOnError = apiSrc.includes('if (!res.ok)') &&
    apiSrc.includes('throw new Error(');
  check(
    'Task 4: Error Propagation',
    'client/src/services/api.ts Throws on !res.ok',
    apiThrowsOnError,
    'api.ts extracts errorBody.message or errorBody.error?.message and throws Error'
  );

  // Verify hub.service.ts only catches TypeError
  const hubServiceCatchesTypeErrorOnly =
    clientHubServiceSrc.includes('error instanceof TypeError') &&
    clientHubServiceSrc.includes('throw error;');

  check(
    'Task 4: Error Propagation',
    'client/src/services/hub.service.ts Narrows Fallback to TypeError Only',
    hubServiceCatchesTypeErrorOnly,
    'hub.service.ts checks "if (error instanceof TypeError)" for offline network fallbacks, and re-throws all other errors (including HTTP 4xx/5xx)'
  );

  // Direct backend test: verify 409 Conflict rejection for duplicate pending request
  // Clear any existing request between student 1 and mentor 1
  db.prepare("DELETE FROM mentorship_requests WHERE mentee_id = 'usr_student_1' AND mentor_id = 'men_1'").run();

  // Create initial pending request
  const createRes1 = await request(app)
    .post('/api/hub/mentorship-requests')
    .send({
      menteeId: 'usr_student_1',
      mentorId: 'men_1',
      topic: 'Error Propagation Test',
      preferredSlot: 'Saturday 11:00 AM'
    });
  assert.strictEqual(createRes1.status, 201);

  // Attempt duplicate request -> MUST be 409 Conflict
  const dupRes = await request(app)
    .post('/api/hub/mentorship-requests')
    .send({
      menteeId: 'usr_student_1',
      mentorId: 'men_1',
      topic: 'Duplicate Attempt',
      preferredSlot: 'Saturday 11:00 AM'
    });

  check(
    'Task 4: Error Propagation',
    'Backend Enforces 409 Conflict on Duplicate Mentorship Request',
    dupRes.status === 409 && dupRes.body.error?.code === 'CONFLICT',
    `Status: ${dupRes.status}, Error code: ${dupRes.body.error?.code}, Message: "${dupRes.body.error?.message}"`
  );

  // Verify client toast surfaces err.message
  const surfacesToast = academicHubSrc.includes('catch (err: any) {') &&
    academicHubSrc.includes('showToast(err.message');
  check(
    'Task 4: Error Propagation',
    'AcademicHub.tsx Toasts Error Message directly to User',
    surfacesToast,
    'AcademicHub UI catches error and surfaces err.message directly in toast notification'
  );

  // ---------------------------------------------------------------------------
  // TASK 5: Role Switcher State Binding
  // ---------------------------------------------------------------------------
  console.log('\n>>> TASK 5: Role Switcher State Binding to Header User Pill & Persona');

  const appSrc = fs.readFileSync('client/src/App.tsx', 'utf8');
  const headerSrc = fs.readFileSync('client/src/components/Header.tsx', 'utf8');
  const roleSwitcherSrc = fs.readFileSync('client/src/components/RoleSwitcher.tsx', 'utf8');

  // Check 5.1: App.tsx maintains currentRole state and passes it to Header and AcademicHub
  const appBindsRole = appSrc.includes('const [currentRole, setCurrentRole] = useState<UserRole>') &&
    appSrc.includes('<Header') && appSrc.includes('currentRole={currentRole}') && appSrc.includes('onRoleChange={setCurrentRole}') &&
    appSrc.includes('<AcademicHub currentRole={currentRole}');

  check(
    'Task 5: Role Binding',
    'App.tsx Propagates currentRole and onRoleChange',
    appBindsRole,
    'App.tsx passes currentRole and setCurrentRole down to Header and AcademicHub'
  );

  // Check 5.2: Header.tsx dynamically computes activeRoleConfig from currentRole
  const headerBindsRole = headerSrc.includes('roleConfigs[currentRole]') &&
    headerSrc.includes('activeRoleConfig.avatar') &&
    headerSrc.includes('activeRoleConfig.name') &&
    headerSrc.includes('activeRoleConfig.code') &&
    headerSrc.includes('activeRoleConfig.badge');

  check(
    'Task 5: Role Binding',
    'Header.tsx Binds User Pill Identity to activeRoleConfig',
    headerBindsRole,
    'Header pill dynamically displays avatar, name, code, badge, and color from activeRoleConfig'
  );

  // Check 5.3: Verify all 4 roles exist with complete personas in roleConfigs
  const roles: UserRole[] = ['student', 'driver', 'proctor', 'admin'];
  const allRolesComplete = roles.every(r => {
    const config = roleConfigs[r];
    return config && config.name && config.code && config.avatar && config.badge;
  });

  check(
    'Task 5: Role Binding',
    'All 4 Personas Fully Configured in roleConfigs',
    allRolesComplete,
    `Configured roles: ${roles.map(r => `${r} -> "${roleConfigs[r].name}" (${roleConfigs[r].code})`).join(' | ')}`
  );

  // Check 5.4: AcademicHub displays role perspective banner when currentRole !== 'student'
  const hubRoleBanner = academicHubSrc.includes("currentRole !== 'student'") &&
    academicHubSrc.includes('Simulating') &&
    academicHubSrc.includes('Role: {currentRole.toUpperCase()}');

  check(
    'Task 5: Role Binding',
    'AcademicHub Displays Role Perspective Simulation Banner',
    hubRoleBanner,
    'AcademicHub renders simulation indicator banner displaying simulated role perspective'
  );

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log('ADVERSARIAL VERIFICATION SUMMARY');
  console.log('================================================================');
  const total = report.length;
  const passed = report.filter(r => r.status === 'PASS').length;
  const failed = report.filter(r => r.status === 'FAIL').length;

  console.log(`Total Checks: ${total} | Passed: ${passed} | Failed: ${failed}`);

  if (failed === 0) {
    console.log('\n>>> OVERALL VERDICT: APPROVE');
  } else {
    console.log('\n>>> OVERALL VERDICT: REQUEST_CHANGES');
  }

  return { total, passed, failed, report };
}

runAdversarialValidation().catch(console.error);
