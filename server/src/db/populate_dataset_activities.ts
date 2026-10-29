import Database from 'better-sqlite3';
import { getDb, initDb } from './connection.js';
import { PrivacyWellbeingOracle } from '../algorithms/privacy_oracle.js';

export function populateDatasetActivities(customDb?: Database.Database): {
  sessionsCreated: number;
  browsingEventsCreated: number;
  activitiesCreated: number;
  milestonesCreated: number;
  cohortsCreated: number;
  mentorshipsCreated: number;
} {
  const db = customDb || getDb();
  initDb();

  console.log('[Dataset Activity Seeder] Starting activity & browsing data population for placement students...');

  // 1. Fetch dummy placement users
  const placementUsers = db.prepare(`
    SELECT u.id, u.name, u.email, u.department, pr.branch, pr.status, pr.ctc_lpa, pr.cgpa, pr.placement_category, pr.company_profile
    FROM users u
    JOIN placement_records pr ON u.email = pr.email
  `).all() as any[];

  console.log(`[Dataset Activity Seeder] Found ${placementUsers.length} placement users in database.`);

  const productiveDomains = [
    'github.com',
    'leetcode.com',
    'stackoverflow.com',
    'arxiv.org',
    'kaggle.com',
    'geeksforgeeks.org',
    'coursera.org',
    'docs.python.org',
    'developer.mozilla.org',
    'campus-lms.edu',
    'chatgpt.com',
    'fastapi.tiangolo.com',
    'react.dev',
    'huggingface.co'
  ];

  const distractingDomains = [
    'youtube.com',
    'reddit.com',
    'instagram.com',
    'twitter.com',
    'netflix.com',
    'twitch.tv',
    'discord.com',
    'tiktok.com'
  ];

  const neutralDomains = [
    'google.com',
    'gmail.com',
    'notion.so',
    'wikipedia.org',
    'slack.com',
    'drive.google.com'
  ];

  // Prepared statements
  const insertFocusSession = db.prepare(`
    INSERT INTO focus_sessions (
      id, user_id, start_time, end_time, target_duration_mins, actual_duration_mins,
      status, goal, deep_work_index, active_focus_ratio, context_switch_rate,
      productive_time_secs, distracting_time_secs, neutral_time_secs, total_switches
    ) VALUES (?, ?, ?, ?, ?, ?, 'completed', ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertBrowsingEvent = db.prepare(`
    INSERT INTO browsing_events (
      id, session_id, sanitized_domain, category, duration_seconds, context_switch, timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertActivity = db.prepare(`
    INSERT INTO activity_log (
      id, user_id, module, action, details, timestamp
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertMilestone = db.prepare(`
    INSERT INTO placement_milestones (
      id, student_id, title, category, status, target_date, completed_at, weight
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMentorshipRequest = db.prepare(`
    INSERT INTO mentorship_requests (
      id, mentee_id, mentor_id, topic, preferred_slot, status, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertCohortAggregate = db.prepare(`
    INSERT INTO cohort_aggregates (
      id, department, date, participant_count, is_suppressed,
      raw_avg_focus_mins, dp_noisy_avg_focus_mins, raw_avg_dwi, dp_noisy_avg_dwi, epsilon_used
    ) VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, 0.80)
  `);

  // Mentors available for requests
  const mentors = db.prepare('SELECT id, company_offer, domain FROM mentors').all() as any[];

  let sessionsCreated = 0;
  let browsingEventsCreated = 0;
  let activitiesCreated = 0;
  let milestonesCreated = 0;
  let mentorshipsCreated = 0;
  let cohortsCreated = 0;

  const runSeeding = db.transaction(() => {
    const now = Date.now();
    const departmentStats: Record<string, { totalMins: number; totalDwi: number; count: number }> = {};

    // Generate activity & browsing sessions for all placement students (cycling days across past 30 days)
    placementUsers.forEach((student, idx) => {
      const isPlaced = student.status.toLowerCase() === 'placed';
      const numSessions = isPlaced ? (idx % 3 === 0 ? 3 : 2) : (idx % 2 === 0 ? 2 : 1);

      // Track department metrics for cohort aggregate
      if (!departmentStats[student.department]) {
        departmentStats[student.department] = { totalMins: 0, totalDwi: 0, count: 0 };
      }

      for (let s = 0; s < numSessions; s++) {
        const daysAgo = (idx + s * 7) % 28;
        const sessionDate = new Date(now - daysAgo * 86400000 - (s * 3600000)).toISOString();
        const durationMins = 30 + ((idx * 17 + s * 13) % 45); // 30-75 mins
        const sessionId = `wb_sess_${student.id.replace('usr_spit_', '')}_${s + 1}`;

        // Generate 6 to 12 browsing events per session
        const eventCount = 6 + ((idx + s) % 7);
        let productiveSecs = 0;
        let distractingSecs = 0;
        let neutralSecs = 0;
        let switches = 0;

        const sessionEvents: Array<{
          id: string;
          domain: string;
          category: 'Productive' | 'Distracting' | 'Neutral';
          duration: number;
          isSwitch: number;
          eventTime: string;
        }> = [];

        for (let e = 0; e < eventCount; e++) {
          const eventId = `brw_${sessionId}_${e + 1}`;
          const isProd = (e % 3 !== 2) || isPlaced;
          const isDist = !isProd && (e % 5 === 0);

          let domain: string;
          let category: 'Productive' | 'Distracting' | 'Neutral';
          let duration = 120 + ((idx * 19 + e * 37) % 360);

          if (isProd) {
            domain = productiveDomains[(idx + e) % productiveDomains.length];
            category = 'Productive';
            productiveSecs += duration;
          } else if (isDist) {
            domain = distractingDomains[(idx + e) % distractingDomains.length];
            category = 'Distracting';
            distractingSecs += duration;
          } else {
            domain = neutralDomains[(idx + e) % neutralDomains.length];
            category = 'Neutral';
            neutralSecs += duration;
          }

          const isSwitch = e > 0 ? 1 : 0;
          if (isSwitch) switches++;

          const eventTime = new Date(new Date(sessionDate).getTime() + (e * 300000)).toISOString();

          sessionEvents.push({
            id: eventId,
            domain,
            category,
            duration,
            isSwitch,
            eventTime
          });
        }

        const totalSecs = productiveSecs + distractingSecs + neutralSecs;
        const actualMins = Math.max(20, Math.round(totalSecs / 60));
        const deepWorkIndex = Math.min(99, Math.max(50, Math.round((productiveSecs / totalSecs) * 100)));
        const activeFocusRatio = Math.round((productiveSecs / totalSecs) * 100) / 100;
        const contextSwitchRate = Math.round((switches / (actualMins / 60)) * 10) / 10;

        const goals = [
          'Master Dynamic Programming & Graph Detour Algorithms',
          'System Design Mock Interview & Cache Architecture Review',
          'Placement Aptitude Speed Drills & Coding Challenge',
          'Syllabus Exploration: Operating System Kernel Primitives',
          'Distributed Consensus & High-Throughput Stream Processing'
        ];
        const goal = goals[(idx + s) % goals.length];
        const endTime = new Date(new Date(sessionDate).getTime() + (actualMins * 60000)).toISOString();

        // 1. Insert parent focus_sessions FIRST to satisfy Foreign Key
        insertFocusSession.run(
          sessionId,
          student.id,
          sessionDate,
          endTime,
          durationMins,
          actualMins,
          goal,
          deepWorkIndex,
          activeFocusRatio,
          contextSwitchRate,
          productiveSecs,
          distractingSecs,
          neutralSecs,
          switches
        );
        sessionsCreated++;

        // 2. Insert child browsing_events
        for (const ev of sessionEvents) {
          insertBrowsingEvent.run(
            ev.id,
            sessionId,
            ev.domain,
            ev.category,
            ev.duration,
            ev.isSwitch,
            ev.eventTime
          );
          browsingEventsCreated++;
        }

        departmentStats[student.department].totalMins += actualMins;
        departmentStats[student.department].totalDwi += deepWorkIndex;
        departmentStats[student.department].count += 1;

        // Log to activity log
        if (s === 0) {
          const actId = `act_wb_${student.id.replace('usr_spit_', '')}`;
          insertActivity.run(
            actId,
            student.id,
            'wellbeing',
            'FOCUS_COMPLETED',
            JSON.stringify({
              goal,
              actualDurationMins: actualMins,
              deepWorkIndex,
              productiveMinutes: Math.round(productiveSecs / 60)
            }),
            endTime
          );
          activitiesCreated++;
        }
      }

      // 2. Placement Milestones (for every student)
      const milestoneTemplates = [
        { title: 'DSA Mastery: Dynamic Programming & Graphs', category: 'DSA', weight: 25 },
        { title: 'System Design: Low-Latency Caching & Microservices', category: 'SystemDesign', weight: 25 },
        { title: 'Campus Placement Mock Interview with Peer Mentor', category: 'MockInterview', weight: 20 },
        { title: 'Core CS Foundations: OS Concurrency & DBMS Indexing', category: 'Core CS', weight: 15 },
        { title: 'Clean Architecture Portfolio & Resume Verification', category: 'Resume', weight: 15 },
      ];

      milestoneTemplates.forEach((template, mIdx) => {
        const mId = `ms_${student.id.replace('usr_spit_', '')}_${mIdx + 1}`;
        const isDone = isPlaced ? true : (student.cgpa >= 8.0 ? mIdx < 3 : mIdx < 2);
        const status = isDone ? 'completed' : (mIdx === 2 ? 'in_progress' : 'pending');
        const targetDate = new Date(now + ((mIdx + 1) * 7 * 86400000)).toISOString().split('T')[0];
        const completedAt = isDone ? new Date(now - ((5 - mIdx) * 3 * 86400000)).toISOString() : null;

        insertMilestone.run(
          mId,
          student.id,
          template.title,
          template.category,
          status,
          targetDate,
          completedAt,
          template.weight
        );
        milestonesCreated++;
      });

      // 3. Activity Log entries for placement milestone
      if (idx % 2 === 0) {
        const actId = `act_hub_${student.id.replace('usr_spit_', '')}`;
        const actDetails = isPlaced
          ? `Verified placement offer with ${student.company_profile || 'Tier-1 Recruiter'} at ${student.ctc_lpa || '12.0'} LPA in ${student.branch}`
          : `Advanced placement readiness index to ${Math.round(student.cgpa * 10)}% in ${student.branch}`;

        insertActivity.run(
          actId,
          student.id,
          'hub',
          isPlaced ? 'PLACEMENT_OFFER_VERIFIED' : 'MILESTONE_COMPLETED',
          actDetails,
          new Date(now - ((idx % 14) * 86400000)).toISOString()
        );
        activitiesCreated++;
      }

      // 4. Mentorship Requests (every 4th student requests mentorship from a mentor)
      if (idx % 4 === 0 && mentors.length > 0) {
        const mentor = mentors[idx % mentors.length];
        const mReqId = `mreq_spit_${student.id.replace('usr_spit_', '')}`;
        const topics = [
          'Tier-1 Technical Architecture Mock Interview',
          'Competitive Programming & Graph Algorithm Optimization',
          'Resume Critique for Product Engineering Roles',
          'Distributed Systems & Cloud Kubernetes Deep-Dive'
        ];
        const reqTopic = topics[idx % topics.length];
        const reqStatus = isPlaced ? 'completed' : (idx % 8 === 0 ? 'accepted' : 'pending');

        insertMentorshipRequest.run(
          mReqId,
          student.id,
          mentor.id,
          reqTopic,
          'Wed 17:00 IST',
          reqStatus,
          `Applicant from ${student.department} (${student.branch}) with CGPA ${student.cgpa}`,
          new Date(now - 7 * 86400000).toISOString(),
          new Date(now - 2 * 86400000).toISOString()
        );
        mentorshipsCreated++;
      }

      // 5. Ride Pooling Activity Log entries (every 5th student)
      if (idx % 5 === 0) {
        const rideActId = `act_ride_${student.id.replace('usr_spit_', '')}`;
        insertActivity.run(
          rideActId,
          student.id,
          'rides',
          'RIDE_BOOKED',
          `Booked pooled electric shuttle from DORM_NORTH to ACAD_QUAD avoiding 0.85kg CO2e [ESTIMATED METRIC]`,
          new Date(now - ((idx % 10) * 86400000)).toISOString()
        );
        activitiesCreated++;
      }
    });

    // 6. Compute real Differential-Privacy Cohort Aggregates for each department
    Object.entries(departmentStats).forEach(([dept, stats], dIdx) => {
      const rawAvgFocus = stats.count > 0 ? Math.round((stats.totalMins / stats.count) * 10) / 10 : 45.0;
      const rawAvgDwi = stats.count > 0 ? Math.round((stats.totalDwi / stats.count) * 10) / 10 : 75.0;

      // Laplace noise with scale = 1.0 / 0.80 = 1.25
      const focusNoise = PrivacyWellbeingOracle.generateLaplaceNoise(1.25);
      const dwiNoise = PrivacyWellbeingOracle.generateLaplaceNoise(1.25);

      const dpAvgFocus = Math.round((rawAvgFocus + focusNoise) * 10) / 10;
      const dpAvgDwi = Math.min(100, Math.max(30, Math.round((rawAvgDwi + dwiNoise) * 10) / 10));

      const todayStr = new Date().toISOString().split('T')[0];
      const cohortId = `cohort_${dept.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${todayStr}`;

      insertCohortAggregate.run(
        cohortId,
        dept,
        todayStr,
        stats.count,
        rawAvgFocus,
        dpAvgFocus,
        rawAvgDwi,
        dpAvgDwi
      );
      cohortsCreated++;
    });
  });

  runSeeding();

  console.log(`✅ [Dataset Activity Seeder] Finished:
    - ${sessionsCreated} focus sessions created
    - ${browsingEventsCreated} browsing events created
    - ${activitiesCreated} cross-module activity log records created
    - ${milestonesCreated} placement milestones created
    - ${mentorshipsCreated} mentorship requests created
    - ${cohortsCreated} differential-privacy cohort aggregates created
  `);

  return {
    sessionsCreated,
    browsingEventsCreated,
    activitiesCreated,
    milestonesCreated,
    cohortsCreated,
    mentorshipsCreated,
  };
}

// CLI execution support
if (process.argv[1]?.endsWith('populate_dataset_activities.ts') || process.argv[1]?.endsWith('populate_dataset_activities.js')) {
  try {
    populateDatasetActivities();
    process.exit(0);
  } catch (err) {
    console.error('Population failed:', err);
    process.exit(1);
  }
}
