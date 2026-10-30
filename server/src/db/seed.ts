import bcrypt from 'bcryptjs';
import { getDb, initDb } from './connection.js';

export const DEMO_PASSWORD_HASH = bcrypt.hashSync('CampusPass123!', 8);

export function seedDatabase(customDbPath?: string): void {
  const db = customDbPath ? getDb(customDbPath) : getDb();

  // Ensure schema is applied
  try {
    initDb();
  } catch (err) {
    // If running in standalone test mode, ignore if already created
  }

  const runSeed = db.transaction(() => {
    // --------------------------------------------------------------------------
    // 1. CLEAN SLATE: CLEAR EXISTING DATA IN FOREIGN KEY COMPLIANT SEQUENCE
    // --------------------------------------------------------------------------
    db.exec(`
      DELETE FROM facility_issues;
      DELETE FROM assistant_action_confirmations;
      DELETE FROM assistant_messages;
      DELETE FROM assistant_conversations;
      DELETE FROM mentorship_messages;
      DELETE FROM mentorship_conversations;
      DELETE FROM event_registrations;
      DELETE FROM campus_events;
      DELETE FROM community_memberships;
      DELETE FROM communities;
      DELETE FROM campus_announcements;
      DELETE FROM campus_locations;
      DELETE FROM feed_reports;
      DELETE FROM feed_follows;
      DELETE FROM feed_bookmarks;
      DELETE FROM feed_reactions;
      DELETE FROM feed_comments;
      DELETE FROM feed_posts;
      DELETE FROM exam_session_assignments;
      DELETE FROM role_invitations;
      DELETE FROM role_assignments;
      DELETE FROM notifications;
      DELETE FROM activity_log;
      DELETE FROM exam_audit_log;
      DELETE FROM observation_events;
      DELETE FROM exam_sessions;
      DELETE FROM cohort_aggregates;
      DELETE FROM browsing_events;
      DELETE FROM domain_rules;
      DELETE FROM focus_sessions;
      DELETE FROM telemetry_snapshots;
      DELETE FROM scenario_configurations;
      DELETE FROM service_workloads;
      DELETE FROM ride_bookings;
      DELETE FROM ride_matches;
      DELETE FROM ride_requests;
      DELETE FROM ride_offers;
      DELETE FROM campus_edges;
      DELETE FROM campus_nodes;
      DELETE FROM resource_downloads;
      DELETE FROM resource_ratings;
      DELETE FROM academic_resources;
      DELETE FROM mentorship_requests;
      DELETE FROM mentors;
      DELETE FROM placement_milestones;
      DELETE FROM student_profiles;
      DELETE FROM users;
    `);

    // --------------------------------------------------------------------------
    // 2. USERS (Demographic: 30 Students, 10 Mentors, 5 Faculty/TA, 2 Wardens, 3 Drivers, 2 Proctors, 2 Admins)
    // --------------------------------------------------------------------------
    const insertUser = db.prepare(`
      INSERT INTO users (id, name, email, password_hash, avatar, role, department, year_of_study, bio, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    const insertRoleAssignment = db.prepare(`
      INSERT INTO role_assignments (id, user_id, role_key, status, granted_by_user_id, reason)
      VALUES (?, ?, ?, 'active', ?, ?)
    `);

    // --- 1. System Administrators (2 total) ---
    const adminsData = [
      { id: 'usr_admin_1', name: 'Campus IT Operations', email: 'admin@campus.edu', dept: 'Campus Central IT', bio: 'UniVerse Campus Operating System Root Administrator.' },
      { id: 'usr_admin_2', name: 'SecOps Enclave Admin', email: 'sysops@campus.edu', dept: 'Information Security Office', bio: 'System security operations, audit trail, and PKI enclaves.' }
    ];

    for (const a of adminsData) {
      insertUser.run(
        a.id,
        a.name,
        a.email,
        DEMO_PASSWORD_HASH,
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${a.name.replace(/\s+/g, '')}`,
        'admin',
        a.dept,
        null,
        a.bio
      );
      insertRoleAssignment.run(`ra_${a.id}`, a.id, 'admin', null, 'Root enclave administrator');
    }

    // --- 2. Students (30 total) ---
    const studentsData = [
      { id: 'usr_student_1', name: 'Aarav Sharma', email: 'aarav.sharma@campus.edu', dept: 'Computer Science & Engineering', year: 4, bio: 'Junior CS undergrad focusing on distributed systems and high-throughput backend architecture.' },
      { id: 'usr_student_2', name: 'Diya Patel', email: 'diya.patel@campus.edu', dept: 'Computer Science & Engineering', year: 4, bio: 'Final-year student, incoming SDE at Microsoft Cloud. Peer mentor in systems and Kubernetes.' },
      { id: 'usr_student_3', name: 'Rohan Verma', email: 'rohan.verma@campus.edu', dept: 'Information Technology', year: 2, bio: 'Sophomore learning data structures and operating systems.' },
      { id: 'usr_student_4', name: 'Sneha Kulkarni', email: 'sneha.kulkarni@campus.edu', dept: 'Computer Science & Engineering', year: 4, bio: 'Incoming SDE at Google. Competitive programmer (Codeforces Candidate Master).' },
      { id: 'usr_student_5', name: 'Ananya Sharma', email: 'ananya.sharma@campus.edu', dept: 'Computer Science & Engineering', year: 4, bio: 'AI Fellow specializing in Large Language Models and efficient fine-tuning.' },
      { id: 'usr_student_6', name: 'Kabir Mehra', email: 'kabir.mehra@campus.edu', dept: 'Electronics & Comm. Engg', year: 4, bio: 'Computer Vision researcher and NVIDIA robotics intern.' },
      { id: 'usr_student_7', name: 'Priya Ramachandran', email: 'priya.ramachandran@campus.edu', dept: 'Data Science & AI', year: 4, bio: 'NLP and Retrieval-Augmented Generation specialist.' },
      { id: 'usr_student_8', name: 'Tanvi Deshmukh', email: 'tanvi.deshmukh@campus.edu', dept: 'Robotics & Automation', year: 4, bio: 'Reinforcement Learning and autonomous quadrotor control.' },
      { id: 'usr_student_9', name: 'Arjun Nair', email: 'arjun.nair@campus.edu', dept: 'Information Security', year: 4, bio: 'Applied cryptography and zero-knowledge verification.' },
      { id: 'usr_student_10', name: 'Rahul Sen', email: 'rahul.sen@campus.edu', dept: 'Computer Science & Engineering', year: 4, bio: 'Database internals, storage engines, and WAL replication.' },
      { id: 'usr_student_11', name: 'Ishaan Joshi', email: 'ishaan.joshi@campus.edu', dept: 'Computer Science & Engineering', year: 4, bio: 'Local-first architecture and CRDT synchronization.' },
      { id: 'usr_student_12', name: 'Meera Iyer', email: 'meera.iyer@campus.edu', dept: 'Electrical Engineering', year: 3, bio: 'Embedded firmware and smart grid power electronics.' },
      { id: 'usr_student_13', name: 'Varun Chopra', email: 'varun.chopra@campus.edu', dept: 'Mechanical Engineering', year: 3, bio: 'CAD/FEA simulations and autonomous vehicle chassis.' },
      { id: 'usr_student_14', name: 'Aditi Rao', email: 'aditi.rao@campus.edu', dept: 'Biotechnology', year: 3, bio: 'Computational genomics and protein folding algorithms.' },
      { id: 'usr_student_15', name: 'Karthik Pillai', email: 'karthik.pillai@campus.edu', dept: 'Mathematics & Computing', year: 3, bio: 'Stochastic processes and spectral graph theory.' },
      { id: 'usr_student_16', name: 'Sanya Mirza', email: 'sanya.mirza@campus.edu', dept: 'Computer Science & Engineering', year: 2, bio: 'Web platform architecture and accessible UI systems.' },
      { id: 'usr_student_17', name: 'Nikhil Bhat', email: 'nikhil.bhat@campus.edu', dept: 'Information Technology', year: 2, bio: 'Cloud native tooling and Linux systems administration.' },
      { id: 'usr_student_18', name: 'Pooja Hegde', email: 'pooja.hegde@campus.edu', dept: 'Electronics & Comm. Engg', year: 2, bio: 'Signal processing and FPGA hardware accelerators.' },
      { id: 'usr_student_19', name: 'Devendra Pandey', email: 'devendra.p@campus.edu', dept: 'Civil & Environmental Engg', year: 3, bio: 'Green campus urban planning and smart water sensors.' },
      { id: 'usr_student_20', name: 'Ritika Saxena', email: 'ritika.s@campus.edu', dept: 'Chemical Engineering', year: 3, bio: 'Battery chemistry and clean hydrogen storage.' },
      { id: 'usr_student_21', name: 'Abhishek Mukherjee', email: 'abhishek.m@campus.edu', dept: 'Computer Science & Engineering', year: 1, bio: 'Freshman exploring C++, algorithms, and open source.' },
      { id: 'usr_student_22', name: 'Bhavna Chawla', email: 'bhavna.c@campus.edu', dept: 'Computer Science & Engineering', year: 1, bio: 'Freshman passionate about web development and UI.' },
      { id: 'usr_student_23', name: 'Chetan Gokhale', email: 'chetan.g@campus.edu', dept: 'Data Science & AI', year: 1, bio: 'Freshman studying linear algebra and Python data stacks.' },
      { id: 'usr_student_24', name: 'Divya Nambiar', email: 'divya.n@campus.edu', dept: 'Electrical Engineering', year: 1, bio: 'Freshman enthusiastic about IoT microcontrollers.' },
      { id: 'usr_student_25', name: 'Eshwar Das', email: 'eshwar.d@campus.edu', dept: 'Mechanical Engineering', year: 2, bio: 'Robotics team fabricator and 3D printing enthusiast.' },
      { id: 'usr_student_26', name: 'Farhan Zaidi', email: 'farhan.z@campus.edu', dept: 'Computer Science & Engineering', year: 3, bio: 'Full stack developer and hackathon organizer.' },
      { id: 'usr_student_27', name: 'Gauri Shinde', email: 'gauri.s@campus.edu', dept: 'Mathematics & Computing', year: 2, bio: 'Combinatorics and mathematical cryptography.' },
      { id: 'usr_student_28', name: 'Harsh Vardhan', email: 'harsh.v@campus.edu', dept: 'Information Technology', year: 3, bio: 'DevOps, CI/CD pipelines, and cloud security.' },
      { id: 'usr_student_29', name: 'Ishita Roy', email: 'ishita.r@campus.edu', dept: 'Biotechnology', year: 2, bio: 'Bioinformatics and molecular modeling.' },
      { id: 'usr_student_30', name: 'Jayant Solanki', email: 'jayant.s@campus.edu', dept: 'Electronics & Comm. Engg', year: 3, bio: 'Wireless sensor networks and edge compute nodes.' }
    ];

    for (const s of studentsData) {
      insertUser.run(
        s.id,
        s.name,
        s.email,
        DEMO_PASSWORD_HASH,
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.name.replace(/\s+/g, '')}`,
        'student',
        s.dept,
        s.year,
        s.bio
      );
      insertRoleAssignment.run(`ra_${s.id}`, s.id, 'student', 'usr_admin_1', 'Matriculated undergraduate scholar');
    }

    // --- Faculty & Teaching Assistants (5 total) ---
    const facultyData = [
      { id: 'usr_faculty_1', name: 'Dr. Priya Patel', email: 'dr.patel@campus.edu', dept: 'Computer Science & Engineering', bio: 'Associate Professor & Systems Advisor.' },
      { id: 'usr_faculty_2', name: 'Prof. Arvind Swaminathan', email: 'arvind.s@campus.edu', dept: 'Computer Science & Engineering', bio: 'Dean of Computing and Chair of Systems Architecture.' },
      { id: 'usr_faculty_3', name: 'Dr. Nalini Seshadri', email: 'nalini.s@campus.edu', dept: 'Data Science & AI', bio: 'Associate Professor specializing in Deep Learning & Ethical AI.' },
      { id: 'usr_ta_1', name: 'Siddharth Bannerjee', email: 'siddharth.b@campus.edu', dept: 'Computer Science & Engineering', bio: 'Lead Graduate Teaching Assistant for CS301 Algorithms.' },
      { id: 'usr_ta_2', name: 'Kavya Menon', email: 'kavya.m@campus.edu', dept: 'Data Science & AI', bio: 'Teaching Assistant for CS304 Artificial Intelligence.' }
    ];

    for (const f of facultyData) {
      insertUser.run(
        f.id,
        f.name,
        f.email,
        DEMO_PASSWORD_HASH,
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${f.name.replace(/\s+/g, '')}`,
        'ta_faculty',
        f.dept,
        null,
        f.bio
      );
      insertRoleAssignment.run(`ra_${f.id}`, f.id, 'ta_faculty', 'usr_admin_1', 'Academic faculty / TA appointment');
    }

    // --- Wardens / Residential Staff (2 total) ---
    const wardensData = [
      { id: 'usr_warden_1', name: 'Campus Residential Warden', email: 'warden@campus.edu', dept: 'Residential & Campus Life', bio: 'Head of Campus Life, Dormitories and Transit Safety.' },
      { id: 'usr_warden_2', name: 'South Hostels Warden', email: 'warden.south@campus.edu', dept: 'Residential Operations', bio: 'Warden for South Campus dormitories and student facilities.' }
    ];

    for (const w of wardensData) {
      insertUser.run(
        w.id,
        w.name,
        w.email,
        DEMO_PASSWORD_HASH,
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${w.name.replace(/\s+/g, '')}`,
        'warden',
        w.dept,
        null,
        w.bio
      );
      insertRoleAssignment.run(`ra_${w.id}`, w.id, 'warden', 'usr_admin_1', 'Residential campus operations appointment');
    }

    // --- Transit Drivers (3 total) ---
    const driversData = [
      { id: 'usr_driver_1', name: 'Vikram Rao', email: 'vikram.rao@campus.edu', dept: 'Mechanical Engineering', year: 4, bio: 'Daily campus EV commuter (Tata Nexon EV). Shared routes from North Gate.' },
      { id: 'usr_driver_2', name: 'Ananya Iyer', email: 'ananya.iyer@campus.edu', dept: 'Campus Transit Operations', year: null, bio: 'Campus Electric Shuttle Operator on Academic-Hostel circular loops.' },
      { id: 'usr_driver_3', name: 'Gurpreet Singh', email: 'gurpreet.s@campus.edu', dept: 'Campus Transit Operations', year: null, bio: 'Campus Electric Shuttle Operator on South Express corridor.' }
    ];

    for (const d of driversData) {
      insertUser.run(
        d.id,
        d.name,
        d.email,
        DEMO_PASSWORD_HASH,
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${d.name.replace(/\s+/g, '')}`,
        'driver',
        d.dept,
        d.year,
        d.bio
      );
      insertRoleAssignment.run(`ra_${d.id}`, d.id, 'driver', 'usr_admin_1', 'Authorized campus EV driver / transit operator');
    }

    // --- Exam Proctors (2 total) ---
    const proctorsData = [
      { id: 'usr_proctor_1', name: 'Dr. Meenakshi Sundaram', email: 'm.sundaram@campus.edu', dept: 'Computer Science & Engineering', bio: 'Professor & Exam Review Chair. Focus on academic integrity and non-punitive proctoring.' },
      { id: 'usr_proctor_2', name: 'Prof. Rajesh Nair', email: 'rajesh.nair@campus.edu', dept: 'Electronics & Comm. Engg', bio: 'Associate Dean of Examinations and Chief Invigilator.' }
    ];

    for (const p of proctorsData) {
      insertUser.run(
        p.id,
        p.name,
        p.email,
        DEMO_PASSWORD_HASH,
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name.replace(/\s+/g, '')}`,
        'proctor',
        p.dept,
        null,
        p.bio
      );
      insertRoleAssignment.run(`ra_${p.id}`, p.id, 'proctor', 'usr_admin_1', 'Appointed exam ombudsman and review chair');
    }

    // --------------------------------------------------------------------------
    // 3. STUDENT PROFILES & PLACEMENT MILESTONES (30 Profiles)
    // --------------------------------------------------------------------------
    const insertProfile = db.prepare(`
      INSERT INTO student_profiles (user_id, skills, interests, target_role, target_company, placement_goals, readiness_score, resume_url, gpa)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const s of studentsData) {
      insertProfile.run(
        s.id,
        JSON.stringify(['Data Structures', 'Algorithms', 'TypeScript', 'Python', 'System Design']),
        JSON.stringify(['Distributed Systems', 'Cloud Computing', 'AI']),
        'Software Development Engineer',
        'Tier-1 Technology Leader',
        'Excel in campus placement interviews and build robust open-source systems.',
        75 + Math.floor(Math.random() * 20),
        `https://campus.edu/resumes/${s.id}.pdf`,
        8.2 + Math.round(Math.random() * 15) / 10
      );
    }

    // Placement Milestones for Aarav Sharma (Required by test suite)
    const insertMilestone = db.prepare(`
      INSERT INTO placement_milestones (id, student_id, title, category, status, target_date, completed_at, weight)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertMilestone.run('ms_1', 'usr_student_1', 'Master Graph Algorithms (Dijkstra, BFS/DFS, TopoSort)', 'DSA', 'completed', '2026-09-15', '2026-09-14', 15);
    insertMilestone.run('ms_2', 'usr_student_1', 'Solve 150 LeetCode Medium/Hard Questions', 'DSA', 'completed', '2026-10-01', '2026-09-28', 15);
    insertMilestone.run('ms_3', 'usr_student_1', 'Design Scalable Rate Limiter & URL Shortener', 'SystemDesign', 'in_progress', '2026-11-15', null, 15);
    insertMilestone.run('ms_4', 'usr_student_1', 'Study Microservices & Event-Driven Architecture (Kafka/RabbitMQ)', 'SystemDesign', 'pending', '2026-12-01', null, 15);
    insertMilestone.run('ms_5', 'usr_student_1', 'Resume Review & ATS Optimization with Senior Mentor', 'Resume', 'completed', '2026-09-20', '2026-09-19', 10);
    insertMilestone.run('ms_6', 'usr_student_1', 'Complete 3 Mock Technical Interviews', 'MockInterview', 'in_progress', '2026-11-10', null, 15);
    insertMilestone.run('ms_7', 'usr_student_1', 'STAR Method Behavioral Question Presentation', 'SoftSkills', 'completed', '2026-10-05', '2026-10-04', 10);
    insertMilestone.run('ms_8', 'usr_student_1', 'Campus Placement Aptitude & Speed Math Drills', 'SoftSkills', 'completed', '2026-10-15', '2026-10-12', 10);

    // --------------------------------------------------------------------------
    // 4. SENIOR MENTORS (10 Approved Mentors with >= 4 ML/AI Mentors)
    // --------------------------------------------------------------------------
    const insertMentor = db.prepare(`
      INSERT INTO mentors (id, user_id, company_offer, domain, skills, available_slots, max_mentees, active_mentees, rating, review_count, bio, topics, projects, preferred_format, is_approved, is_demo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
    `);

    const mentorsData = [
      {
        id: 'men_1',
        userId: 'usr_student_2', // Diya Patel
        company: 'Microsoft Cloud',
        domain: 'Cloud Infrastructure & Distributed Systems',
        skills: ['Distributed Systems', 'Go', 'Docker', 'Kubernetes', 'gRPC', 'System Design'],
        topics: ['Microservice Architecture', 'Kubernetes Orchestration', 'Distributed Caching', 'Cloud SDE Interviews'],
        slots: ['Tue 4:00 PM', 'Thu 6:00 PM', 'Sat 11:00 AM'],
        rating: 4.92,
        reviews: 24,
        bio: 'Incoming SDE at Microsoft Azure. Helped 20+ juniors master scalable distributed architectures.'
      },
      {
        id: 'men_2',
        userId: 'usr_student_4', // Sneha Kulkarni
        company: 'Google SWE',
        domain: 'Competitive Programming & Advanced DSA',
        skills: ['C++', 'Competitive Programming', 'Graph Theory', 'Dynamic Programming', 'LeetCode Hard'],
        topics: ['Tree & Graph DP', 'Segment Trees & Fenwick', 'Google Online Assessment Prep', 'Speed Math'],
        slots: ['Mon 5:00 PM', 'Wed 5:00 PM', 'Sun 10:00 AM'],
        rating: 4.95,
        reviews: 38,
        bio: 'Codeforces Candidate Master. Incoming SDE at Google. Specialized in conquering hard algorithmic rounds.'
      },
      {
        id: 'men_3',
        userId: 'usr_driver_1', // Vikram Rao
        company: 'Amazon Web Services',
        domain: 'Full Stack & Enterprise Cloud Architecture',
        skills: ['React', 'Node.js', 'Express', 'PostgreSQL', 'AWS DynamoDB', 'Docker'],
        topics: ['Full Stack Capstone Review', 'API Design Best Practices', 'AWS Serverless Deployments', 'STAR Behavioral'],
        slots: ['Fri 3:00 PM', 'Sat 2:00 PM'],
        rating: 4.85,
        reviews: 14,
        bio: 'Incoming AWS SDE. Enthusiastic about fullstack clean code and cloud operational readiness.'
      },
      {
        id: 'men_4',
        userId: 'usr_student_5', // Ananya Sharma [ML/AI 1]
        company: 'Meta AI Research Fellow',
        domain: 'Generative AI & LLM Fine-Tuning',
        skills: ['Python', 'PyTorch', 'Transformers', 'LoRA / QLoRA', 'PEFT', 'LangChain', 'vLLM'],
        topics: ['LLM Fine-Tuning Pipelines', 'Quantization (AWQ/GPTQ)', 'Synthetic Dataset Generation', 'AI Engineering Roadmaps'],
        slots: ['Mon 3:00 PM', 'Wed 4:00 PM', 'Sat 10:00 AM'],
        rating: 4.97,
        reviews: 31,
        bio: 'Research fellow working on efficient inference for open-weights 70B parameter models. Passionate about AI democratization.'
      },
      {
        id: 'men_5',
        userId: 'usr_student_6', // Kabir Mehra [ML/AI 2]
        company: 'NVIDIA Autonomous Systems',
        domain: 'Computer Vision & Edge Perception',
        skills: ['PyTorch', 'OpenCV', 'TensorRT', 'YOLOv10', 'Neural Radiance Fields', 'C++ Inference'],
        topics: ['Edge AI Deployment', 'Object Detection & Tracking', 'Real-time Camera Pipelines', 'Hardware-Aware Pruning'],
        slots: ['Tue 2:00 PM', 'Thu 4:00 PM', 'Sun 4:00 PM'],
        rating: 4.90,
        reviews: 19,
        bio: 'NVIDIA robotics intern. Mentoring students on real-time computer vision and embedded Jetson pipelines.'
      },
      {
        id: 'men_6',
        userId: 'usr_student_7', // Priya Ramachandran [ML/AI 3]
        company: 'Databricks AI',
        domain: 'Retrieval-Augmented Generation & Vector DBs',
        skills: ['Python', 'Milvus', 'ChromaDB', 'Sentence Transformers', 'FastAPI', 'RAG Evaluation'],
        topics: ['RAG Pipeline Architecture', 'Hybrid Dense-Sparse Search', 'Hallucination Mitigation', 'Vector Index Tuning'],
        slots: ['Wed 6:00 PM', 'Fri 5:00 PM', 'Sat 4:00 PM'],
        rating: 4.88,
        reviews: 16,
        bio: 'Specialist in enterprise RAG systems, grounding metrics, and contextual retrieval for unstructured corpora.'
      },
      {
        id: 'men_7',
        userId: 'usr_student_8', // Tanvi Deshmukh [ML/AI 4]
        company: 'Tesla Autopilot Lab',
        domain: 'Reinforcement Learning & Motion Planning',
        skills: ['Reinforcement Learning', 'Gymnasium', 'PPO / SAC', 'ROS 2', 'MuJoCo', 'Python'],
        topics: ['Actor-Critic Architectures', 'Sim-to-Real Transfer', 'Trajectory Optimization', 'Robot Control Policies'],
        slots: ['Mon 6:00 PM', 'Thu 7:00 PM'],
        rating: 4.91,
        reviews: 12,
        bio: 'Robotics and RL practitioner. Guides students from toy MDPs to high-dimensional continuous physics simulations.'
      },
      {
        id: 'men_8',
        userId: 'usr_student_9', // Arjun Nair
        company: 'Chainlink Labs',
        domain: 'Applied Cryptography & Privacy',
        skills: ['Rust', 'ZK-SNARKs', 'Elliptic Curves', 'Differential Privacy', 'Solidity', 'Network Security'],
        topics: ['Zero Knowledge Proofs', 'Differential Privacy Mechanisms', 'Smart Contract Auditing', 'Cryptographic Primitives'],
        slots: ['Tue 5:00 PM', 'Sat 1:00 PM'],
        rating: 4.86,
        reviews: 15,
        bio: 'Focused on zero-knowledge systems and privacy-enhancing technologies without commercial backdoors.'
      },
      {
        id: 'men_9',
        userId: 'usr_student_10', // Rahul Sen
        company: 'Snowflake Database Core',
        domain: 'Database Engines & Low-Level Storage',
        skills: ['C++', 'B-Trees', 'LSM Trees', 'WAL Protocols', 'Columnar Storage', 'Query Planners'],
        topics: ['Database Engine Architecture', 'ACID Concurrency & MVCC', 'Storage File Formats (Parquet/Arrow)', 'Systems Performance'],
        slots: ['Wed 3:00 PM', 'Fri 4:00 PM'],
        rating: 4.89,
        reviews: 11,
        bio: 'Incoming database systems engineer. Dedicated to dissecting SQLite, DuckDB, and RocksDB internals.'
      },
      {
        id: 'men_10',
        userId: 'usr_student_11', // Ishaan Joshi
        company: 'Vercel Edge Team',
        domain: 'Local-First Systems & Web Architecture',
        skills: ['TypeScript', 'React 19', 'Next.js', 'CRDTs (Yjs)', 'IndexedDB', 'PWA / Offline First'],
        topics: ['Local-First State Sync', 'Conflict-Free Replicated Data Types', 'Edge Rendering', 'PWA Optimization'],
        slots: ['Thu 3:00 PM', 'Sun 11:00 AM'],
        rating: 4.93,
        reviews: 20,
        bio: 'Building offline-first web apps that treat network partitions as normal conditions rather than fatal errors.'
      }
    ];

    for (const m of mentorsData) {
      insertMentor.run(
        m.id,
        m.userId,
        m.company,
        m.domain,
        JSON.stringify(m.skills),
        JSON.stringify(m.slots),
        5,
        2,
        m.rating,
        m.reviews,
        m.bio,
        JSON.stringify(m.topics),
        JSON.stringify(['Production System Portfolio', 'Open Source Compiler Tooling']),
        'chat_and_video'
      );
    }

    // --------------------------------------------------------------------------
    // 5. MENTORSHIP REQUESTS & MESSAGES
    // --------------------------------------------------------------------------
    const insertMentorshipRequest = db.prepare(`
      INSERT INTO mentorship_requests (id, mentee_id, mentor_id, topic, notes, preferred_slot, status, mentor_notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertMentorshipRequest.run(
      'mr_1',
      'usr_student_1',
      'men_1',
      'System Design Mock - Scalable News Feed & Ride Matching',
      'I have prepared the HLD diagram. Would appreciate feedback on caching and DB partitioning.',
      'Sat 11:00 AM',
      'accepted',
      'Looking forward to it! Make sure to write out latency and read/write QPS calculations before the session.'
    );

    insertMentorshipRequest.run(
      'mr_2',
      'usr_student_3',
      'men_2',
      'DP on Trees and Graphs practice',
      'Struggling with post-order traversal DP transitions on directed acyclic graphs.',
      'Mon 5:00 PM',
      'pending',
      null
    );

    insertMentorshipRequest.run(
      'mr_3',
      'usr_student_1',
      'men_4',
      'Fine-Tuning Llama 3 with QLoRA on Campus HPC',
      'Need guidance on gradient accumulation and memory profiling on single A100 GPU.',
      'Wed 4:00 PM',
      'accepted',
      'Happy to help! Ensure you have BitsAndBytes and HuggingFace PEFT installed.'
    );

    insertMentorshipRequest.run(
      'mr_4',
      'usr_student_16',
      'men_5',
      'Edge Object Detection with TensorRT',
      'Converting PyTorch model to ONNX and compiling engine for Jetson Orin.',
      'Tue 2:00 PM',
      'completed',
      'Great work! The pipeline achieved 62 FPS at FP16 precision.'
    );

    // Active Mentorship Conversations & Messages
    const insertConv = db.prepare(`
      INSERT INTO mentorship_conversations (id, request_id, mentee_id, mentor_id, status)
      VALUES (?, ?, ?, ?, 'active')
    `);

    insertConv.run('conv_1', 'mr_1', 'usr_student_1', 'usr_student_2');
    insertConv.run('conv_2', 'mr_3', 'usr_student_1', 'usr_student_5');

    const insertMsg = db.prepare(`
      INSERT INTO mentorship_messages (id, conversation_id, sender_id, content)
      VALUES (?, ?, ?, ?)
    `);

    insertMsg.run('msg_1', 'conv_1', 'usr_student_1', 'Hi Diya! Thanks for accepting my request on System Design.');
    insertMsg.run('msg_2', 'conv_1', 'usr_student_2', 'Hey Aarav! Looking forward to reviewing your HLD. Have your caching schema ready.');
    insertMsg.run('msg_3', 'conv_1', 'usr_student_1', 'Will do! I mapped Redis clusters and database sharding keys.');

    insertMsg.run('msg_4', 'conv_2', 'usr_student_1', 'Hi Ananya! Super excited to discuss LoRA fine-tuning on Slurm.');
    insertMsg.run('msg_5', 'conv_2', 'usr_student_5', 'Hello Aarav! Send over your training script and YAML configs before Wednesday.');

    // --------------------------------------------------------------------------
    // 6A. CAMPUS TOPOLOGY GRAPH NODES (Canonical 10 Nodes)
    // --------------------------------------------------------------------------
    const insertNode = db.prepare(`
      INSERT INTO campus_nodes (id, name, zone, coord_x, coord_y, lat, lng, is_hub)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertNode.run('GATE_NORTH', 'North Campus Gate & Transit Terminal', 'Transit', 200, 100, 12.9716, 77.5946, 1);
    insertNode.run('DORM_NORTH', 'North Dormitory Complex (Hostels 1–4)', 'Residential', 350, 200, 12.9725, 77.5960, 0);
    insertNode.run('LIB_CENTRAL', 'Vikram Sarabhai Central Library', 'Academic', 650, 250, 12.9730, 77.5985, 1);
    insertNode.run('LAB_CS_AI', 'Turing Hall (Computer Science & AI Labs)', 'Academic', 750, 450, 12.9715, 77.6010, 0);
    insertNode.run('ACAD_QUAD', 'Main Academic & Engineering Quadrangle', 'Academic', 500, 500, 12.9700, 77.5975, 1);
    insertNode.run('INNOVATION_PARK', 'Incubation Center & Tech Accelerator', 'Academic', 250, 550, 12.9690, 77.5940, 0);
    insertNode.run('SPORTS_CMPLX', 'University Stadium & Aquatic Center', 'Recreation', 200, 850, 12.9660, 77.5930, 0);
    insertNode.run('STUDENT_CTR', 'Student Union & Central Dining Commons', 'Recreation', 450, 700, 12.9675, 77.5965, 1);
    insertNode.run('DORM_SOUTH', 'South Hostels & Graduate Towers (H5–H8)', 'Residential', 700, 750, 12.9680, 77.6000, 0);
    insertNode.run('GATE_SOUTH', 'South Gate & Metro Feeder Station', 'Transit', 800, 900, 12.9650, 77.6020, 1);

    // --------------------------------------------------------------------------
    // 6B. CAMPUS ROAD EDGES (Canonical 22 Edges)
    // --------------------------------------------------------------------------
    const insertEdge = db.prepare(`
      INSERT INTO campus_edges (id, source_node_id, target_node_id, distance_km, base_time_mins, road_type, speed_limit_kmh, current_congestion, is_bidirectional)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const edges = [
      ['edge_1', 'GATE_NORTH', 'DORM_NORTH', 0.8, 2.4, 'CAMPUS_ROAD', 25.0, 1.2],
      ['edge_2', 'DORM_NORTH', 'LIB_CENTRAL', 0.6, 1.8, 'CAMPUS_ROAD', 25.0, 1.0],
      ['edge_3', 'GATE_NORTH', 'INNOVATION_PARK', 1.1, 3.2, 'CAMPUS_ROAD', 25.0, 1.1],
      ['edge_4', 'DORM_NORTH', 'ACAD_QUAD', 0.7, 2.1, 'EV_SHUTTLE_LANE', 20.0, 1.0],
      ['edge_5', 'LIB_CENTRAL', 'LAB_CS_AI', 0.5, 1.5, 'CAMPUS_ROAD', 25.0, 1.0],
      ['edge_6', 'LIB_CENTRAL', 'ACAD_QUAD', 0.6, 1.8, 'EV_SHUTTLE_LANE', 20.0, 1.0],
      ['edge_7', 'INNOVATION_PARK', 'ACAD_QUAD', 0.9, 2.7, 'CAMPUS_ROAD', 25.0, 1.15],
      ['edge_8', 'ACAD_QUAD', 'LAB_CS_AI', 0.4, 1.2, 'PEDESTRIAN_ACCESS', 5.0, 1.0],
      ['edge_9', 'INNOVATION_PARK', 'SPORTS_CMPLX', 0.8, 2.4, 'CAMPUS_ROAD', 25.0, 1.0],
      ['edge_10', 'ACAD_QUAD', 'STUDENT_CTR', 0.6, 1.8, 'EV_SHUTTLE_LANE', 20.0, 1.3],
      ['edge_11', 'LAB_CS_AI', 'DORM_SOUTH', 0.9, 2.7, 'CAMPUS_ROAD', 25.0, 1.05],
      ['edge_12', 'LAB_CS_AI', 'STUDENT_CTR', 0.8, 2.4, 'CAMPUS_ROAD', 25.0, 1.1],
      ['edge_13', 'SPORTS_CMPLX', 'STUDENT_CTR', 1.0, 3.0, 'CAMPUS_ROAD', 25.0, 1.0],
      ['edge_14', 'STUDENT_CTR', 'DORM_SOUTH', 0.7, 2.1, 'EV_SHUTTLE_LANE', 20.0, 1.0],
      ['edge_15', 'SPORTS_CMPLX', 'GATE_SOUTH', 1.2, 3.6, 'CAMPUS_ROAD', 25.0, 1.0],
      ['edge_16', 'STUDENT_CTR', 'GATE_SOUTH', 0.9, 2.7, 'CAMPUS_ROAD', 25.0, 1.4],
      ['edge_17', 'DORM_SOUTH', 'GATE_SOUTH', 0.5, 1.5, 'CAMPUS_ROAD', 25.0, 1.25],
      ['edge_18', 'GATE_NORTH', 'LIB_CENTRAL', 1.3, 3.8, 'CAMPUS_ROAD', 25.0, 1.1],
      ['edge_19', 'DORM_NORTH', 'INNOVATION_PARK', 0.9, 2.6, 'CAMPUS_ROAD', 25.0, 1.0],
      ['edge_20', 'ACAD_QUAD', 'DORM_SOUTH', 1.1, 3.3, 'CAMPUS_ROAD', 25.0, 1.2],
      ['edge_21', 'LIB_CENTRAL', 'DORM_SOUTH', 1.4, 4.0, 'CAMPUS_ROAD', 25.0, 1.0],
      ['edge_22', 'INNOVATION_PARK', 'STUDENT_CTR', 1.0, 3.0, 'EV_SHUTTLE_LANE', 20.0, 1.0]
    ];

    for (const [id, src, dst, dist, time, type, speed, cong] of edges) {
      insertEdge.run(id, src, dst, dist, time, type, speed, cong, 1);
    }

    // --------------------------------------------------------------------------
    // 6C. CAMPUS LOCATIONS (12 Connected Landmark Locations)
    // --------------------------------------------------------------------------
    const insertLocation = db.prepare(`
      INSERT INTO campus_locations (id, name, category, building, zone, description, hours, accessibility, coord_x, coord_y, node_id, is_demo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    insertLocation.run('loc_1', 'Turing Hall (Computer Science & AI Labs)', 'Laboratory', 'Turing Complex', 'Academic Core', 'High performance compute labs, GPU workstations, and faculty offices.', '08:00 - 22:00', 'Elevator & wheelchair ramp available', 750, 450, 'LAB_CS_AI');
    insertLocation.run('loc_2', 'Vikram Sarabhai Central Library', 'Library', 'Sarabhai Building', 'Academic Core', 'Three-story central library with silent study pods, journal stacks, and collaborative commons.', '08:00 - 00:00', 'Full accessibility, tactile pavers', 650, 250, 'LIB_CENTRAL');
    insertLocation.run('loc_3', 'Main Academic & Engineering Quadrangle', 'Academic', 'Quad Complex', 'Academic North', 'Lecture theaters 1 through 8, mathematics seminar halls, and physics laboratories.', '08:00 - 20:00', 'Ramps on East and West entries', 500, 500, 'ACAD_QUAD');
    insertLocation.run('loc_4', 'North Campus Gate & Transit Terminal', 'Transit', 'Gate North', 'North Perimeter', 'Primary campus entrance, EV shuttle terminal, taxi pickup, and city bus interchange.', '24/7', 'Ground level accessible', 200, 100, 'GATE_NORTH');
    insertLocation.run('loc_5', 'South Gate & Metro Feeder Station', 'Transit', 'Gate South', 'South Perimeter', 'Secondary campus entrance leading to sports grounds and technology incubator.', '06:00 - 23:00', 'Ground level accessible', 800, 900, 'GATE_SOUTH');
    insertLocation.run('loc_6', 'North Dormitory Complex (Hostels 1–4)', 'Hostel', 'Hostel North', 'Residential North', 'Undergraduate student dormitories, common reading rooms, and indoor sports area.', '24/7 (ID access)', 'Ground floor ramp and lift', 350, 200, 'DORM_NORTH');
    insertLocation.run('loc_7', 'South Hostels & Graduate Towers (H5–H8)', 'Hostel', 'Hostel South', 'Residential South', 'Senior student and graduate scholar residences with high-speed fiber connectivity.', '24/7 (ID access)', 'Elevator and wide door frames', 700, 750, 'DORM_SOUTH');
    insertLocation.run('loc_8', 'Student Union & Central Dining Commons', 'Dining', 'Student Center', 'Central Hub', 'Multi-cuisine student mess, cafeteria, book exchange, and student council lounge.', '07:30 - 22:30', 'Double-door automatic ramp entry', 450, 700, 'STUDENT_CTR');
    insertLocation.run('loc_9', 'University Stadium & Aquatic Center', 'Sports', 'Pavilion', 'South East', 'Gymnasium, Olympic-standard swimming pool, basketball courts, and jogging track.', '06:00 - 21:00', 'Accessible locker rooms and ramps', 200, 850, 'SPORTS_CMPLX');
    insertLocation.run('loc_10', 'Incubation Center & Tech Accelerator', 'Laboratory', 'Tech Park', 'East Enclave', 'Student startup incubators, rapid prototyping maker space, and 3D printing labs.', '09:00 - 21:00', 'Universal design certified', 250, 550, 'INNOVATION_PARK');
    insertLocation.run('loc_11', 'Health & Wellness Enclave', 'Administration', 'Medical Block', 'West Corridor', '24/7 campus clinic, emergency dispensary, counseling and mental health services.', '24/7', 'Ambulance bay & full stretcher lift', 450, 700, 'STUDENT_CTR');
    insertLocation.run('loc_12', 'Campus Solar Park & Sustainable Energy Grid', 'Administration', 'Green Enclave', 'North West', '1.2 MW rooftop photovoltaic arrays, battery storage banks, and grid monitoring station.', 'Authorized personnel only', 'Restricted access', 500, 500, 'ACAD_QUAD');

    // --------------------------------------------------------------------------
    // 7. FACILITY ISSUES (Warden & Campus Maintenance Workflow)
    // --------------------------------------------------------------------------
    const insertIssue = db.prepare(`
      INSERT INTO facility_issues (id, reporter_id, location_id, facility_name, category, title, description, urgency, status, assigned_to, resolution_notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertIssue.run(
      'issue_1',
      'usr_student_1',
      'loc_6',
      'Hostel Block A - Floor 3',
      'internet_wifi',
      'Wi-Fi Access Point 3B Intermittent Drops',
      'Mesh node loses connection during peak evening study hours (20:00 to 22:00). High packet loss.',
      'high',
      'in_progress',
      'usr_warden_1',
      'Campus network engineers scheduled to replace PoE switch on Friday morning.'
    );

    insertIssue.run(
      'issue_2',
      'usr_student_3',
      'loc_1',
      'Turing Hall - Room 204 Lab',
      'electrical',
      'Bench 4 Surge Strip Not Delivering Power',
      'Two student workstations unable to power monitor displays. Breaker may need reset.',
      'medium',
      'open',
      null,
      null
    );

    insertIssue.run(
      'issue_3',
      'usr_student_7',
      'loc_2',
      'Sarabhai Library - Reading Hall West',
      'furniture',
      'Ergonomic Study Desk 14 Loose Bracket',
      'Left hinge loose, creating unstable surface for laptop typing.',
      'low',
      'resolved',
      'usr_warden_1',
      'Carpentry staff tightened brackets and replaced locking washers on Oct 28.'
    );

    insertIssue.run(
      'issue_4',
      'usr_student_12',
      'loc_8',
      'Central Dining Hall',
      'cleanliness',
      'Drinking Water Dispenser Filter Due for Inspection',
      'Filter indicator light turned amber this morning. Flow rate slightly restricted.',
      'medium',
      'assigned',
      'usr_warden_1',
      'Assigned to campus plumbing contractor for filter element change.'
    );

    insertIssue.run(
      'issue_5',
      'usr_student_16',
      'loc_6',
      'Hostel Block A - Wing B Washroom',
      'plumbing',
      'Main Cold Water Line Low Pressure',
      'Shower faucets on second floor experiencing low delivery pressure since 07:00 AM.',
      'emergency',
      'in_progress',
      'usr_warden_1',
      'Maintenance team actively inspecting rooftop header tank pump pressure switch.'
    );

    insertIssue.run(
      'issue_6',
      'usr_student_4',
      'loc_9',
      'Sports Pavilion - Outdoor Track',
      'safety',
      'Pathway Solar Floodlight Bulb Out',
      'South bend of jogging track is poorly lit after 19:30. Safety concern.',
      'medium',
      'resolved',
      'usr_warden_1',
      'Replaced with 45W high-efficiency LED fixture and verified dusk-to-dawn sensor.'
    );

    // --------------------------------------------------------------------------
    // 8. CAMPUS COMMUNITIES (6 Distinct Societies & Clubs)
    // --------------------------------------------------------------------------
    const insertComm = db.prepare(`
      INSERT INTO communities (id, name, slug, description, category, avatar, member_count, is_demo)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `);

    insertComm.run('comm_1', 'ACM Student Chapter', 'acm-student-chapter', 'Official collegiate chapter of the Association for Computing Machinery. Algorithms, systems, and hackathons.', 'Coding', 'https://api.dicebear.com/7.x/identicon/svg?seed=acm', 142);
    insertComm.run('comm_2', 'Open Source & Systems Guild', 'open-source-guild', 'Linux kernel discussions, Rust tools, distributed databases, and open source collaboration.', 'Coding', 'https://api.dicebear.com/7.x/identicon/svg?seed=oss', 98);
    insertComm.run('comm_3', 'Deep Learning & Robotics Lab', 'deep-learning-robotics', 'Pioneering work in autonomous systems, generative AI, perception, and reinforcement learning.', 'AI_ML', 'https://api.dicebear.com/7.x/identicon/svg?seed=dlrobotics', 115);
    insertComm.run('comm_4', 'Competitive Programming League', 'cp-league', 'Weekly LeetCode, Codeforces, and ICPC practice sprints. Peer editorial walkthroughs.', 'Coding', 'https://api.dicebear.com/7.x/identicon/svg?seed=cpleague', 86);
    insertComm.run('comm_5', 'Campus Sustainability & EV Initiative', 'campus-sustainability', 'Student and faculty coalition dedicated to net-zero carbon campus computing, carpooling, and renewables.', 'General', 'https://api.dicebear.com/7.x/identicon/svg?seed=sustainability', 73);
    insertComm.run('comm_6', 'Women in Technology Collegiate', 'women-in-tech', 'Empowering women engineers through peer mentorship, career workshops, and technical leadership.', 'General', 'https://api.dicebear.com/7.x/identicon/svg?seed=wit', 91);

    const insertCommMem = db.prepare(`
      INSERT INTO community_memberships (id, community_id, user_id, role)
      VALUES (?, ?, ?, ?)
    `);

    insertCommMem.run('cm_1', 'comm_1', 'usr_student_1', 'member');
    insertCommMem.run('cm_2', 'comm_2', 'usr_student_1', 'moderator');
    insertCommMem.run('cm_3', 'comm_3', 'usr_student_5', 'moderator');
    insertCommMem.run('cm_4', 'comm_4', 'usr_student_4', 'moderator');
    insertCommMem.run('cm_5', 'comm_5', 'usr_driver_1', 'member');

    // --------------------------------------------------------------------------
    // 9. CAMPUS EVENTS (12 Fictional Collegiate Events)
    // --------------------------------------------------------------------------
    const insertEvent = db.prepare(`
      INSERT INTO campus_events (id, title, description, category, organizer_id, community_id, venue, start_time, end_time, capacity, rsvp_count, status, tags, is_demo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'upcoming', ?, 1)
    `);

    insertEvent.run(
      'evt_1',
      'Campus Hackathon: Sustainable Systems & Zero-Knowledge Enclaves',
      '36-hour collegiate hackathon focused on building privacy-preserving, energy-efficient campus tools.',
      'Hackathon',
      'usr_student_1',
      'comm_1',
      'Turing Hall - 3rd Floor Collaborative Commons',
      '2026-11-08 09:00:00',
      '2026-11-09 21:00:00',
      120,
      84,
      JSON.stringify(['Hackathon', 'Rust', 'TypeScript', 'Sustainability'])
    );

    insertEvent.run(
      'evt_2',
      'Generative AI Masterclass: Efficient Fine-Tuning with QLoRA & vLLM',
      'Hands-on workshop demonstrating quantization, LoRA parameter-efficient tuning, and high-throughput vLLM serving.',
      'Workshop',
      'usr_student_5',
      'comm_3',
      'Turing Hall - Auditorium A',
      '2026-11-04 16:00:00',
      '2026-11-04 18:30:00',
      90,
      76,
      JSON.stringify(['AI', 'LLM', 'PyTorch', 'vLLM', 'HandsOn'])
    );

    insertEvent.run(
      'evt_3',
      'ICPC Mock Contest & Hard Graph DP Editorial Board',
      'Timed 3-hour team contest followed by step-by-step whiteboard explanations of difficult problems.',
      'Coding_Meet',
      'usr_student_4',
      'comm_4',
      'Sarabhai Library - 2nd Floor Seminar Hall',
      '2026-11-06 14:00:00',
      '2026-11-06 18:00:00',
      60,
      45,
      JSON.stringify(['Algorithms', 'ICPC', 'CompetitiveProgramming', 'C++'])
    );

    insertEvent.run(
      'evt_4',
      'Systems Architecture Salon: SQLite WAL Mode & Storage Engine Internals',
      'An in-depth code reading of SQLite b-tree paging, transaction journals, and ACID semantics under concurrent readers.',
      'Seminar',
      'usr_student_2',
      'comm_2',
      'Turing Hall - Room 108',
      '2026-11-05 17:00:00',
      '2026-11-05 18:30:00',
      50,
      38,
      JSON.stringify(['Databases', 'SQLite', 'C++', 'Systems', 'WAL'])
    );

    insertEvent.run(
      'evt_5',
      'Annual Collegiate Placement & Internship Fair',
      'Meet engineering directors and talent leaders from 40+ premier tech organizations.',
      'Placement',
      'usr_faculty_1',
      null,
      'Central Student Commons & Exhibition Arena',
      '2026-11-12 10:00:00',
      '2026-11-12 17:00:00',
      500,
      310,
      JSON.stringify(['Career', 'Placements', 'Internships', 'Networking'])
    );

    insertEvent.run(
      'evt_6',
      'Campus Carbon Neutrality: Electric Transit & Energy Telemetry Briefing',
      'Presentation of avoided campus emissions, smart EV charging schedule, and computational energy optimization.',
      'Seminar',
      'usr_driver_1',
      'comm_5',
      'Main Quadrangle - LT 2',
      '2026-11-07 15:00:00',
      '2026-11-07 16:30:00',
      80,
      42,
      JSON.stringify(['Sustainability', 'ElectricVehicles', 'CleanEnergy'])
    );

    insertEvent.run(
      'evt_7',
      'Computer Vision at the Edge: Real-Time Inference on NVIDIA Jetson',
      'Deploying TensorRT engines, optimizing CUDA memory allocations, and interfacing MIPI cameras.',
      'Workshop',
      'usr_student_6',
      'comm_3',
      'Turing Hall - Robotics Laboratory',
      '2026-11-11 15:30:00',
      '2026-11-11 18:00:00',
      40,
      39,
      JSON.stringify(['ComputerVision', 'NVIDIA', 'EdgeAI', 'Embedded'])
    );

    insertEvent.run(
      'evt_8',
      'Zero-Knowledge Proofs from Scratch: Interactive Mathematical Walkthrough',
      'Demystifying quadratic arithmetic programs, zk-SNARKs, and cryptographic commitments.',
      'Seminar',
      'usr_student_9',
      'comm_2',
      'Quad Complex - Seminar Room 4',
      '2026-11-14 16:00:00',
      '2026-11-14 17:30:00',
      45,
      28,
      JSON.stringify(['Cryptography', 'ZeroKnowledge', 'Math', 'Privacy'])
    );

    insertEvent.run(
      'evt_9',
      'Women in Engineering: Industry Panel & Leadership Breakfast',
      'Fireside chat with senior alumnae in AI research, venture capital, and engineering management.',
      'Social',
      'usr_student_5',
      'comm_6',
      'Central Student Commons - Private Dining Room',
      '2026-11-10 09:30:00',
      '2026-11-10 11:30:00',
      60,
      52,
      JSON.stringify(['Leadership', 'Panel', 'Diversity', 'Networking'])
    );

    insertEvent.run(
      'evt_10',
      'Distributed Consensus Socratic Circle: Paxos vs Raft in Production',
      'Rigorous peer critique analyzing edge cases in leader election, log compaction, and network split-brain.',
      'Seminar',
      'usr_student_2',
      'comm_1',
      'Sarabhai Library - Pod 4',
      '2026-11-13 18:00:00',
      '2026-11-13 19:30:00',
      35,
      30,
      JSON.stringify(['DistributedSystems', 'Raft', 'Consensus', 'Architecture'])
    );

    insertEvent.run(
      'evt_11',
      'Local-First Web Architecture: CRDTs and State Synchronization',
      'Building collaborative apps that work completely offline using Yjs and browser IndexedDB.',
      'Workshop',
      'usr_student_11',
      'comm_2',
      'Turing Hall - Room 202',
      '2026-11-15 14:00:00',
      '2026-11-15 16:00:00',
      45,
      34,
      JSON.stringify(['Web', 'CRDT', 'LocalFirst', 'TypeScript'])
    );

    insertEvent.run(
      'evt_12',
      'Campus Cyclothon & Clean Air Mobility Rally',
      '5km campus tour promoting non-motorized cycling, EV shuttle usage, and collegiate wellbeing.',
      'Social',
      'usr_warden_1',
      'comm_5',
      'North Campus Gate Promenade',
      '2026-11-16 07:00:00',
      '2026-11-16 09:30:00',
      150,
      98,
      JSON.stringify(['Wellness', 'Cycling', 'CleanAir', 'Community'])
    );

    // --------------------------------------------------------------------------
    // 10. CAMPUS ANNOUNCEMENTS (5 Official University Notices)
    // --------------------------------------------------------------------------
    const insertAnnounce = db.prepare(`
      INSERT INTO campus_announcements (id, author_id, title, body, scope, priority, is_demo)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);

    insertAnnounce.run(
      'ann_1',
      'usr_admin_1',
      'UniVerse Campus Operating System V1.0 Deployed to Campus Nodes',
      'The unified collegiate platform is now active across all academic halls, libraries, and transit nodes with zero commercial data tracking.',
      'campus',
      'urgent'
    );

    insertAnnounce.run(
      'ann_2',
      'usr_faculty_1',
      'Fall End-Semester Examination Schedule & Code of Integrity Published',
      'Official examination timetable for Computer Science and Engineering is accessible in the Academic Hub. Mode 2 ethical vision review will be utilized.',
      'department',
      'urgent'
    );

    insertAnnounce.run(
      'ann_3',
      'usr_warden_1',
      'Campus Solar Bus Loop Timings Enhanced for Winter Schedule',
      'Electric transit shuttles will operate every 10 minutes between North Gate, Central Library, and South Hostels between 07:30 and 22:30 daily.',
      'campus',
      'normal'
    );

    insertAnnounce.run(
      'ann_4',
      'usr_faculty_2',
      'Campus Slurm Compute Cluster Upgraded with 8x NVIDIA H100 Accelerators',
      'Graduate researchers may submit Slurm job allocations for large-scale training jobs. Avoided carbon telemetry scheduler will optimize batch queues.',
      'faculty',
      'normal'
    );

    insertAnnounce.run(
      'ann_5',
      'usr_warden_1',
      'Hostel Maintenance Hotline & Facility Ticket Triage Enclave Active',
      'Residents can report water, electrical, or Wi-Fi connectivity defects directly through the Warden Operations portal for same-day inspection.',
      'campus',
      'normal'
    );

    // --------------------------------------------------------------------------
    // 11. CAMPUS FEED POSTS (40 Structured Realistic Posts Across All Categories)
    // --------------------------------------------------------------------------
    const insertPost = db.prepare(`
      INSERT INTO feed_posts (id, author_id, campus_id, post_type, title, body, tags, visibility, status, likes_count, comments_count, bookmarks_count, is_demo)
      VALUES (?, ?, 'campus_main', ?, ?, ?, ?, 'campus', 'published', ?, ?, ?, 1)
    `);

    const postsData = [
      { id: 'post_1', author: 'usr_student_1', type: 'project_update', title: 'Open-Sourcing our Dijkstra Multi-Hop Campus Carpooling Engine', body: 'We just open-sourced the topological graph routing engine that powers UniVerse ride-pooling! It features dynamic detour bounding (max 35%) and calculates avoided CO2 emissions in real-time. Check out the algorithm sandbox on the Architecture page!', tags: ['OpenSource', 'Algorithms', 'GraphTheory', 'TypeScript'], likes: 34, comments: 6, bookmarks: 12 },
      { id: 'post_2', author: 'usr_student_4', type: 'question', title: 'How do you structure post-order traversal DP transitions on DAGs?', body: 'When calculating the longest path with vertex weights where you also need to reconstruct the lexicographically smallest path, what is the cleanest way to memoize without hitting recursion stack limits in Python?', tags: ['DSA', 'DynamicProgramming', 'Python', 'InterviewPrep'], likes: 18, comments: 5, bookmarks: 7 },
      { id: 'post_3', author: 'usr_student_5', type: 'discussion', title: 'Quantization trade-offs: Why 4-bit AWQ outperforms standard RTN on code generation', body: 'We ran comparative benchmarks on HumanEval using 4-bit AWQ versus standard Round-To-Nearest quantization. The activations for transformer attention projections exhibit pronounced outlier channels—preserving them yields a 6.2% higher pass@1 rate!', tags: ['AI', 'Quantization', 'MachineLearning', 'LLM'], likes: 42, comments: 8, bookmarks: 19 },
      { id: 'post_4', author: 'usr_driver_1', type: 'ride_share', title: 'Daily EV Commute: North Gate -> Central Library -> Turing Hall (3 seats open)', body: 'Leaving North Gate terminal daily at 08:35 AM in Tata Nexon EV. Trunk space available for backpacks. Clean mobility with 0.22 kg CO2 avoided per passenger! Request your seat via the Ride tab.', tags: ['RidePool', 'Carpool', 'GreenCampus', 'EV'], likes: 25, comments: 3, bookmarks: 4 },
      { id: 'post_5', author: 'usr_faculty_1', type: 'announcement', title: 'CS301 Comprehensive End-Sem Practice Material Published to Academic Hub', body: 'Past exam solutions for 2022-2024 and quick reference sheets for asymptotic master theorems and red-black tree rebalancing are now available under Academic Hub -> Syllabus Materials.', tags: ['CS301', 'Academics', 'Notes', 'Exams'], likes: 58, comments: 4, bookmarks: 32 },
      { id: 'post_6', author: 'usr_student_6', type: 'project_update', title: 'Running YOLOv10 at 85 FPS on a 15W Jetson Orin Nano with TensorRT', body: 'Successfully compiled custom TensorRT FP16 engine with INT8 calibration for static obstacle and pedestrian detection on campus sidewalks. Memory footprint stayed strictly under 820 MB!', tags: ['ComputerVision', 'EdgeAI', 'NVIDIA', 'Robotics'], likes: 39, comments: 7, bookmarks: 14 },
      { id: 'post_7', author: 'usr_student_2', type: 'opportunity', title: 'Microsoft Cloud SDE Peer Mock Interview Slots Open for Seniors', body: 'Conducting two 45-minute mock system design rounds this Saturday for final-year students preparing for Tier-1 cloud infrastructure rounds. Submit a mentorship request with your target topics!', tags: ['Mentorship', 'MockInterview', 'SystemDesign', 'Placements'], likes: 47, comments: 9, bookmarks: 22 },
      { id: 'post_8', author: 'usr_student_9', type: 'discussion', title: 'Understanding Differential Privacy: Why Laplace Noise with epsilon=0.8 protects study logs', body: 'Why does UniVerse use epsilon=0.8 for focus session aggregation? With a sensitivity of delta_f = 60 minutes, the noise scale b = 75 minutes guarantees mathematically bounded privacy against differential linkage attacks!', tags: ['Privacy', 'DifferentialPrivacy', 'Math', 'Cryptography'], likes: 31, comments: 4, bookmarks: 11 },
      { id: 'post_9', author: 'usr_student_11', type: 'resource_share', title: 'Interactive CRDT Visualizer for Collaborative Text Editing', body: 'Built a lightweight playground demonstrating Yjs character insertion, fractional indexing, and delete bitsets. Helpful for anyone taking CS302 Distributed Systems.', tags: ['WebDev', 'CRDT', 'LocalFirst', 'TypeScript'], likes: 22, comments: 2, bookmarks: 8 },
      { id: 'post_10', author: 'usr_student_12', type: 'question', title: 'Best low-power BLE microcontroller for solar weather station project?', body: 'Comparing ESP32-S3 versus nRF52840 for an outdoor weather sensor pod powered by a 2W solar panel and 18650 cell. Which has cleaner deep-sleep current draw?', tags: ['Embedded', 'IoT', 'Hardware', 'HardwareDesign'], likes: 15, comments: 6, bookmarks: 3 },
      { id: 'post_11', author: 'usr_student_3', type: 'discussion', title: 'Operating Systems memory models: Strong vs Weak ordering illustrated', body: 'Spent the weekend studying x86 TSO (Total Store Order) versus ARM relaxed consistency. Store-buffer forwarding makes concurrency so fascinating without explicit memory barriers!', tags: ['OperatingSystems', 'Concurrency', 'x86', 'ARM'], likes: 27, comments: 3, bookmarks: 9 },
      { id: 'post_12', author: 'usr_student_7', type: 'project_update', title: 'Evaluating Context Precision in Campus Q&A using RAGAS metrics', body: 'Tested synthetic campus query retrieval against our SQLite vector store. Using Reciprocal Rank Fusion (RRF) between BM25 and dense bi-encoders boosted top-3 retrieval hit rate from 74% to 91%!', tags: ['RAG', 'Search', 'MachineLearning', 'Python'], likes: 36, comments: 5, bookmarks: 15 },
      { id: 'post_13', author: 'usr_warden_1', type: 'announcement', title: 'Rooftop Solar Maintenance at North Hostels Completed', body: 'All 240 panels on Hostel Blocks A & B have been cleaned and tested. Generation capacity has returned to nominal 120 kW peak output.', tags: ['CampusOperations', 'Sustainability', 'SolarEnergy'], likes: 29, comments: 1, bookmarks: 2 },
      { id: 'post_14', author: 'usr_student_8', type: 'opportunity', title: 'Robotics Lab seeking 2 undergrad research assistants for drone simulation', body: 'We are simulating autonomous collision avoidance in Gazebo/ROS2 for campus delivery quadrotors. Looking for students with strong Python skills and basic kinematics knowledge.', tags: ['Research', 'Robotics', 'ROS2', 'Internship'], likes: 41, comments: 11, bookmarks: 18 },
      { id: 'post_15', author: 'usr_student_10', type: 'discussion', title: 'Why SQLite WAL mode is extraordinary for local-first desktop apps', body: 'Writing to the write-ahead log allows readers to continue without blocking writers. Combined with memory-mapped I/O (PRAGMA mmap_size), query throughput on local NVMe is breathtaking.', tags: ['Databases', 'SQLite', 'Performance', 'Storage'], likes: 48, comments: 6, bookmarks: 21 },
      { id: 'post_16', author: 'usr_student_14', type: 'resource_share', title: 'Curated Genomics Pipeline Notes: Nextflow & Bioconda Cheatsheet', body: 'Assembled a practical cheatsheet for running variant calling workflows with Nextflow and Docker containers on the campus Slurm cluster.', tags: ['Biotechnology', 'Bioinformatics', 'Slurm', 'Nextflow'], likes: 16, comments: 2, bookmarks: 6 },
      { id: 'post_17', author: 'usr_student_16', type: 'question', title: 'How to reliably mock localStorage and ResizeObserver in Vitest with happy-dom?', body: 'Encountering ResizeObserver not defined when testing responsive SVG charts in React. What is the canonical mock setup in modern Vite test setups?', tags: ['React', 'Testing', 'Vitest', 'WebDev'], likes: 19, comments: 4, bookmarks: 5 },
      { id: 'post_18', author: 'usr_student_17', type: 'project_update', title: 'Self-hosted Slurm Prometheus Exporter for Campus Green Computing', body: 'Built a lightweight exporter that reads job energy metrics from cgroups and exports them to our Prometheus dashboard for instant carbon estimation.', tags: ['DevOps', 'Prometheus', 'Slurm', 'Monitoring'], likes: 24, comments: 3, bookmarks: 8 },
      { id: 'post_19', author: 'usr_student_19', type: 'discussion', title: 'Smart Campus Water Grid: Detecting subterranean pipe leaks using acoustic sensors', body: 'Field testing vibration sensors along the main supply conduit from North Reservoir. Frequency analysis shows distinct 40 Hz spikes near pipe junctions with pinhole pressure loss.', tags: ['CivilEng', 'SmartCampus', 'Sensors', 'Sustainability'], likes: 20, comments: 4, bookmarks: 4 },
      { id: 'post_20', author: 'usr_driver_2', type: 'ride_share', title: 'Academic Circular Loop Shuttle Departing Every 12 Minutes', body: 'Campus EV Shuttle 1 is on active circular service: North Gate -> Dorms -> Library -> Turing Hall -> Sports Complex. Wheelchair accessible with zero tailpipe emissions.', tags: ['Transit', 'Shuttle', 'EV', 'CampusMobility'], likes: 33, comments: 1, bookmarks: 2 },
      { id: 'post_21', author: 'usr_student_21', type: 'question', title: 'First-year CS: Recommend best resources to master recursion and trees?', body: 'Just started learning binary search trees and recursion feels a bit unintuitive when backtracking. Any visual simulators or problem sequences you recommend?', tags: ['CS101', 'Beginner', 'Algorithms', 'DSA'], likes: 26, comments: 8, bookmarks: 9 },
      { id: 'post_22', author: 'usr_student_22', type: 'resource_share', title: 'Tailwind CSS Material 3 Color Tokens & Contrast Accessibility Matrix', body: 'Created a quick CSS token map aligning Material Design 3 surface containers, outlines, and on-surface text contrast ratios according to WCAG AAA standards.', tags: ['DesignSystem', 'CSS', 'Tailwind', 'Accessibility'], likes: 28, comments: 3, bookmarks: 13 },
      { id: 'post_23', author: 'usr_faculty_2', type: 'announcement', title: 'Graduate Colloquium Series: Distributed Storage & Consistent Hashing', body: 'Join us this Wednesday at 4 PM in Turing Hall for a lecture on consistent hashing with virtual nodes and Dynamo-style sloppy quorums.', tags: ['Academics', 'DistributedSystems', 'Colloquium'], likes: 35, comments: 2, bookmarks: 14 },
      { id: 'post_24', author: 'usr_student_25', type: 'project_update', title: 'Custom 3D-Printed Camera Mount for Exam Vision Accessibility Testing', body: 'Designed and printed a tilt-adjustable articulated webcam stand that positions the optical lens at the exact 15-degree pitch required for ergonomic eye gaze calibration.', tags: ['3DPrinting', 'Hardware', 'Accessibility'], likes: 21, comments: 3, bookmarks: 5 },
      { id: 'post_25', author: 'usr_student_27', type: 'discussion', title: 'Elliptic Curve Cryptography: Why secp256k1 uses Koblitz curve properties', body: 'The efficient endomorphism on secp256k1 enables GLV scalar multiplication decomposition, saving ~30% point doubling operations compared to generic curves!', tags: ['Cryptography', 'Math', 'ECC', 'Security'], likes: 25, comments: 3, bookmarks: 7 },
      { id: 'post_26', author: 'usr_student_4', type: 'opportunity', title: 'Weekly ICPC Contest Simulation this Saturday 2 PM at Library', body: 'We have curated 5 problems ranging from medium greedies to advanced flow algorithms. Teams of 3 welcome or come solo and we will match you with a team!', tags: ['ICPC', 'CompetitiveProgramming', 'Hackathon'], likes: 30, comments: 4, bookmarks: 8 },
      { id: 'post_27', author: 'usr_student_1', type: 'project_update', title: 'UniVerse Campus Copilot: Grounding AI Answers in Verified Relational Data', body: 'Our Campus Copilot queries live mentor profiles, available carpools, and study guides through an authorized retrieval service before generating answers. Zero hallucinations!', tags: ['AI', 'Gemini', 'Copilot', 'RAG', 'UniVerse'], likes: 53, comments: 7, bookmarks: 26 },
      { id: 'post_28', author: 'usr_student_15', type: 'discussion', title: 'Spectral Graph Theory: Why the second smallest eigenvalue bounds graph expansion', body: 'Cheeger’s inequality connects the spectral gap of the normalized graph Laplacian to the conductance of the bottleneck cut. Crucial for understanding network partition resistance!', tags: ['Mathematics', 'GraphTheory', 'Algorithms'], likes: 19, comments: 2, bookmarks: 6 },
      { id: 'post_29', author: 'usr_warden_2', type: 'announcement', title: 'Quiet Hours in Residential Hostels During Examination Fortnight', body: 'Residents are reminded that quiet study hours are in effect from 22:00 to 07:00 daily across all dormitory blocks. Reading rooms remain open 24/7 with high-speed Wi-Fi.', tags: ['HostelLife', 'Notice', 'ResidentialSafety'], likes: 38, comments: 2, bookmarks: 3 },
      { id: 'post_30', author: 'usr_student_28', type: 'project_update', title: 'Zero-Downtime Container Deployments with GitHub Actions & Docker Compose', body: 'Implemented blue-green socket swapping on our local campus staging server. Deployments now cut over seamlessly in 40ms without dropping inflight HTTP requests.', tags: ['DevOps', 'Docker', 'CI/CD', 'Linux'], likes: 27, comments: 4, bookmarks: 11 },
      { id: 'post_31', author: 'usr_student_30', type: 'question', title: 'LoRaWAN coverage across South Campus: Any packet drop spots observed?', body: 'Deploying environmental telemetry probes in the campus greenhouse. Are there known RF deadzones around the high-voltage substation transformer?', tags: ['IoT', 'LoRaWAN', 'Wireless', 'Sensors'], likes: 14, comments: 3, bookmarks: 2 },
      { id: 'post_32', author: 'usr_student_9', type: 'discussion', title: 'Zero-Knowledge rollups: STARKs vs SNARKs computational prover overhead', body: 'While STARKs eliminate the trusted setup through hash functions and FRI, the proof size is ~40x larger than Groth16. Trade-offs in bandwidth versus cryptographic assumption security.', tags: ['ZK', 'Cryptography', 'Privacy'], likes: 23, comments: 4, bookmarks: 8 },
      { id: 'post_33', author: 'usr_student_2', type: 'resource_share', title: 'Distributed Systems Reading List: 10 Seminal Papers Every Engineer Should Read', body: 'Curated PDFs with highlights for Dynamo, MapReduce, Spanner, Raft, Chubby, Kafka, and Aurora. Downloadable directly in Academic Hub.', tags: ['DistributedSystems', 'ReadingList', 'Academics'], likes: 62, comments: 8, bookmarks: 41 },
      { id: 'post_34', author: 'usr_student_6', type: 'project_update', title: 'Real-time Eye Gaze Calibration with MediaPipe Iris Mesh', body: 'Calibrated our Mode 2 computer vision proctoring engine with 3D facial landmark mesh. Pitch and yaw estimation maintains sub-3 degree accuracy under varied room lighting.', tags: ['ComputerVision', 'AI', 'ExamProctor', 'MediaPipe'], likes: 37, comments: 5, bookmarks: 13 },
      { id: 'post_35', author: 'usr_driver_3', type: 'ride_share', title: 'South Campus Express Loop Shuttle Active for Evening Commute', body: 'Operating route: South Gate -> Sports Complex -> Dining Hall -> Hostel Block B. EV bus departs every 15 minutes between 17:00 and 21:00.', tags: ['Transit', 'Carpool', 'GreenCampus'], likes: 21, comments: 1, bookmarks: 1 },
      { id: 'post_36', author: 'usr_student_18', type: 'question', title: 'Verilog vs VHDL for FPGA digital signal processing coursework?', body: 'Starting the advanced hardware description lab next term. Which language has better tooling support with open-source synthesis suites like Yosys and nextpnr?', tags: ['FPGA', 'Hardware', 'Verilog', 'VHDL'], likes: 17, comments: 5, bookmarks: 4 },
      { id: 'post_37', author: 'usr_student_5', type: 'discussion', title: 'Mixture of Experts (MoE) Routing Stability: Top-2 gating versus expert capacity factor', body: 'When expert capacity factor is too small, token overflow causes dropped embeddings. Auxiliary load balancing loss is essential to prevent router collapse to a single expert.', tags: ['AI', 'MoE', 'DeepLearning', 'Transformers'], likes: 34, comments: 6, bookmarks: 12 },
      { id: 'post_38', author: 'usr_student_1', type: 'discussion', title: 'Local-First Sovereign Wellbeing: Why focus telemetry must never leave your machine', body: 'Unlike commercial tracking tools that monetize student screen time, UniVerse focus logs stay strictly in your local database. Only noise-infused DP averages are shared with cohorts.', tags: ['Privacy', 'Wellbeing', 'Sovereignty', 'UniVerse'], likes: 45, comments: 5, bookmarks: 18 },
      { id: 'post_39', author: 'usr_student_26', type: 'opportunity', title: 'Open Call: UI Designers for Campus Hackathon Branding & Badges', body: 'ACM Chapter is looking for 2 visual designers to create digital badges and certificate illustrations for the upcoming Sustainable Systems Hackathon.', tags: ['Design', 'UI', 'Hackathon', 'Community'], likes: 20, comments: 3, bookmarks: 4 },
      { id: 'post_40', author: 'usr_admin_1', type: 'announcement', title: 'UniVerse Audit & Role Governance Log Transparently Inspectable', body: 'All administrative role assignments, elevation justifications, and system integrity actions are recorded in the tamper-evident audit log under Settings -> Security Enclave.', tags: ['Security', 'Audit', 'Transparency', 'Governance'], likes: 49, comments: 4, bookmarks: 17 }
    ];

    for (const p of postsData) {
      insertPost.run(
        p.id,
        p.author,
        p.type,
        p.title,
        p.body,
        JSON.stringify(p.tags),
        p.likes,
        p.comments,
        p.bookmarks
      );
    }

    // --------------------------------------------------------------------------
    // 12. FEED COMMENTS (20 Realistic Discussion Comments)
    // --------------------------------------------------------------------------
    const insertComment = db.prepare(`
      INSERT INTO feed_comments (id, post_id, author_id, parent_id, content, is_demo)
      VALUES (?, ?, ?, ?, ?, 1)
    `);

    const commentsData = [
      { id: 'comm_1', post: 'post_1', author: 'usr_student_2', parent: null, body: 'The Dijkstra detour ratio calculation is so clean! Does it handle dynamic traffic edge weights?', likes: 6 },
      { id: 'comm_2', post: 'post_1', author: 'usr_student_1', parent: 'comm_1', body: 'Yes! We apply a 1.25x congestion multiplier to the edge traversal times during peak hours (08:00-09:30 and 17:00-18:30).', likes: 4 },
      { id: 'comm_3', post: 'post_2', author: 'usr_student_4', parent: null, body: 'For tree DP, always run an iterative topological post-order sort (e.g. via Kahn algorithm or post-order traversal using two stacks) to avoid Python recursion limits.', likes: 9 },
      { id: 'comm_4', post: 'post_2', author: 'usr_student_3', parent: 'comm_3', body: 'That completely solved my Maximum Path Sum on DAG issue! Thank you Sneha!', likes: 3 },
      { id: 'comm_5', post: 'post_3', author: 'usr_student_7', parent: null, body: 'We observed the exact same phenomenon with Llama 3 8B. Outlier activations in down_proj layers degrade code generation if clipped.', likes: 5 },
      { id: 'comm_6', post: 'post_4', author: 'usr_student_16', parent: null, body: 'Just booked a seat for tomorrow morning! Super convenient pickup right outside North Gate.', likes: 2 },
      { id: 'comm_7', post: 'post_5', author: 'usr_student_3', parent: null, body: 'Thank you Dr. Patel! The 2024 solutions cheatsheet is incredibly thorough.', likes: 7 },
      { id: 'comm_8', post: 'post_6', author: 'usr_student_8', parent: null, body: 'Are you running NMS on the GPU directly or transferring bounding box coordinates back to host RAM?', likes: 3 },
      { id: 'comm_9', post: 'post_6', author: 'usr_student_6', parent: 'comm_8', body: 'Batched NMS is embedded directly inside the TensorRT execution graph, so only final candidate boxes are copied back!', likes: 5 },
      { id: 'comm_10', post: 'post_7', author: 'usr_student_1', parent: null, body: 'Diya conducted a mock interview for me last week and the caching trade-off feedback was top tier.', likes: 8 },
      { id: 'comm_11', post: 'post_8', author: 'usr_student_15', parent: null, body: 'The differential privacy proof is elegant. The ratio of probabilities for any two neighboring datasets is strictly bounded by exp(0.8) ~= 2.225.', likes: 4 },
      { id: 'comm_12', post: 'post_10', author: 'usr_student_18', parent: null, body: 'nRF52840 has significantly lower deep sleep current (~2 uA vs ~10 uA on ESP32-S3). Highly recommend for coin cell or solar harvesting.', likes: 5 },
      { id: 'comm_13', post: 'post_12', author: 'usr_student_5', parent: null, body: 'RRF with k=60 is practically magic for merging keyword BM25 results with semantic embeddings.', likes: 6 },
      { id: 'comm_14', post: 'post_15', author: 'usr_student_9', parent: null, body: 'SQLite in WAL mode on local SSD delivers over 50,000 writes/sec in immediate transactions. Incredible engineering.', likes: 7 },
      { id: 'comm_15', post: 'post_21', author: 'usr_student_4', parent: null, body: 'Start with LeetCode 104 (Maximum Depth) and 226 (Invert Binary Tree), then move to 236 (Lowest Common Ancestor). The recursive invariant clicks naturally after 10 problems.', likes: 11 },
      { id: 'comm_16', post: 'post_27', author: 'usr_student_2', parent: null, body: 'Love how Copilot displays explicit source citations linking directly to the underlying database records!', likes: 6 },
      { id: 'comm_17', post: 'post_27', author: 'usr_student_1', parent: 'comm_16', body: 'And any state mutation requires explicit confirmation before execution—AI never writes data unilaterally.', likes: 5 },
      { id: 'comm_18', post: 'post_34', author: 'usr_proctor_1', parent: null, body: 'This non-punitive approach is essential. Eye gaze flags are review signals for human proctors, never automated penalties.', likes: 12 },
      { id: 'comm_19', post: 'post_38', author: 'usr_student_17', parent: null, body: 'Having full ownership of our focus data without commercial telemetry trackers is the main reason I switched to UniVerse.', likes: 8 },
      { id: 'comm_20', post: 'post_40', author: 'usr_faculty_1', parent: null, body: 'Accountability and transparent audit logs build real trust between students, faculty, and administration.', likes: 9 }
    ];

    for (const c of commentsData) {
      insertComment.run(c.id, c.post, c.author, c.parent, c.body);
    }

    // --------------------------------------------------------------------------
    // 13. ACADEMIC RESOURCES (20 Rich Curriculum Materials)
    // --------------------------------------------------------------------------
    const insertResource = db.prepare(`
      INSERT INTO academic_resources (id, title, course_code, course_name, category, semester, department, file_url, file_type, file_size_kb, uploader_id, downloads_count, rating, rating_count, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const resourcesData = [
      { id: 'res_1', title: 'CS301: Graph Algorithms & Dynamic Programming Comprehensive Guide', code: 'CS301', name: 'Data Structures & Algorithms', cat: 'Notes', sem: 5, dept: 'Computer Science', url: 'https://campus.edu/resources/cs301_graph_dp.pdf', size: 2450, uploader: 'usr_student_2', dl: 184, rating: 4.90, count: 32, tags: ['Graphs', 'Dijkstra', 'DP', 'ShortestPath'] },
      { id: 'res_2', title: 'CS301: End-Semester Exam Paper 2024 (with Detailed Solutions)', code: 'CS301', name: 'Data Structures & Algorithms', cat: 'PYQ', sem: 5, dept: 'Computer Science', url: 'https://campus.edu/resources/cs301_pyq_2024.pdf', size: 1820, uploader: 'usr_student_1', dl: 342, rating: 4.85, count: 48, tags: ['PYQ', 'Solutions', 'EndSem', '2024'] },
      { id: 'res_3', title: 'CS301: Quick Reference Cheatsheet — Asymptotic Notations & Data Structures', code: 'CS301', name: 'Data Structures & Algorithms', cat: 'Cheatsheet', sem: 5, dept: 'Computer Science', url: 'https://campus.edu/resources/cs301_cheatsheet.pdf', size: 850, uploader: 'usr_student_4', dl: 115, rating: 4.70, count: 19, tags: ['Cheatsheet', 'Complexity', 'BigO', 'Heaps'] },
      { id: 'res_4', title: 'CS302: Virtual Memory, Paging & Page Replacement Illustrated', code: 'CS302', name: 'Operating Systems', cat: 'Guide', sem: 5, dept: 'Computer Science', url: 'https://campus.edu/resources/cs302_virtual_memory.pdf', size: 3120, uploader: 'usr_student_2', dl: 156, rating: 4.88, count: 25, tags: ['VirtualMemory', 'LRU', 'Paging', 'Deadlocks'] },
      { id: 'res_5', title: 'CS302: Operating Systems Mid-Sem & End-Sem PYQs (2022–2024)', code: 'CS302', name: 'Operating Systems', cat: 'PYQ', sem: 5, dept: 'Computer Science', url: 'https://campus.edu/resources/cs302_pyq_bundle.pdf', size: 2740, uploader: 'usr_student_3', dl: 290, rating: 4.65, count: 38, tags: ['PYQ', 'Semaphores', 'Synchronization', 'Processes'] },
      { id: 'res_6', title: 'CS303: TCP/IP vs OSI Protocol Stack & Flow Control Deep Dive', code: 'CS303', name: 'Computer Networks', cat: 'Notes', sem: 6, dept: 'Computer Science', url: 'https://campus.edu/resources/cs303_tcp_osi.pdf', size: 2210, uploader: 'usr_student_1', dl: 198, rating: 4.78, count: 29, tags: ['TCP', 'UDP', 'CongestionControl', 'OSI'] },
      { id: 'res_7', title: 'CS303: Linux Socket Programming in C & Python Lab Guide', code: 'CS303', name: 'Computer Networks', cat: 'Guide', sem: 6, dept: 'Computer Science', url: 'https://campus.edu/resources/cs303_socket_lab.pdf', size: 1640, uploader: 'usr_student_4', dl: 112, rating: 4.92, count: 16, tags: ['Sockets', 'ClientServer', 'LabManual'] },
      { id: 'res_8', title: 'CS304: Heuristic Search, A* & Adversarial Minimax with Alpha-Beta', code: 'CS304', name: 'Artificial Intelligence', cat: 'Notes', sem: 6, dept: 'Computer Science', url: 'https://campus.edu/resources/cs304_search_minimax.pdf', size: 2980, uploader: 'usr_student_5', dl: 210, rating: 4.82, count: 34, tags: ['A-Star', 'Heuristics', 'Minimax', 'Search'] },
      { id: 'res_9', title: 'CS304: Artificial Intelligence Final Exam Past Papers & Model Answers', code: 'CS304', name: 'Artificial Intelligence', cat: 'PYQ', sem: 6, dept: 'Computer Science', url: 'https://campus.edu/resources/cs304_pyq_solutions.pdf', size: 2310, uploader: 'usr_student_1', dl: 275, rating: 4.72, count: 41, tags: ['PYQ', 'BayesNet', 'Inference', 'AI'] },
      { id: 'res_10', title: 'CS401: Distributed Consensus & Fault Tolerance (Paxos, Raft, Byzantine)', code: 'CS401', name: 'Distributed Systems', cat: 'Notes', sem: 7, dept: 'Computer Science', url: 'https://campus.edu/resources/cs401_consensus.pdf', size: 3450, uploader: 'usr_student_2', dl: 168, rating: 4.94, count: 27, tags: ['DistributedSystems', 'Raft', 'Paxos', 'Consensus'] },
      { id: 'res_11', title: 'CS402: Database Storage Engine Internals & LSM Tree Implementations', code: 'CS402', name: 'Advanced Database Systems', cat: 'Guide', sem: 7, dept: 'Computer Science', url: 'https://campus.edu/resources/cs402_storage_engines.pdf', size: 2890, uploader: 'usr_student_10', dl: 142, rating: 4.86, count: 21, tags: ['Databases', 'LSM', 'B-Tree', 'WAL'] },
      { id: 'res_12', title: 'CS405: Large Language Models: Architecture, Tokenization & Fine-Tuning', code: 'CS405', name: 'Deep Learning & Natural Language', cat: 'Notes', sem: 7, dept: 'Data Science', url: 'https://campus.edu/resources/cs405_llm_deepdive.pdf', size: 4100, uploader: 'usr_student_5', dl: 320, rating: 4.96, count: 52, tags: ['DeepLearning', 'LLM', 'Attention', 'Transformers'] },
      { id: 'res_13', title: 'CS408: Applied Zero-Knowledge Proofs & Elliptic Curve Cryptography', code: 'CS408', name: 'Applied Cryptography', cat: 'Notes', sem: 7, dept: 'Computer Science', url: 'https://campus.edu/resources/cs408_zkp_crypto.pdf', size: 2650, uploader: 'usr_student_9', dl: 128, rating: 4.88, count: 18, tags: ['Cryptography', 'ZKP', 'SNARKs', 'Math'] },
      { id: 'res_14', title: 'EC301: Digital Signal Processing & FFT Algorithms Lab Workbook', code: 'EC301', name: 'Digital Signal Processing', cat: 'Guide', sem: 5, dept: 'Electronics', url: 'https://campus.edu/resources/ec301_dsp_workbook.pdf', size: 1980, uploader: 'usr_student_18', dl: 95, rating: 4.70, count: 14, tags: ['DSP', 'FFT', 'Filters', 'Electronics'] },
      { id: 'res_15', title: 'MA201: Linear Algebra & Matrix Decompositions for Machine Learning', code: 'MA201', name: 'Linear Algebra for Computing', cat: 'Notes', sem: 3, dept: 'Mathematics', url: 'https://campus.edu/resources/ma201_linear_algebra.pdf', size: 2420, uploader: 'usr_student_15', dl: 240, rating: 4.82, count: 35, tags: ['LinearAlgebra', 'SVD', 'Eigenvalues', 'Math'] },
      { id: 'res_16', title: 'MA301: Probability & Random Processes for Computer Scientists', code: 'MA301', name: 'Probability & Statistics', cat: 'Notes', sem: 5, dept: 'Mathematics', url: 'https://campus.edu/resources/ma301_probability.pdf', size: 2150, uploader: 'usr_student_27', dl: 180, rating: 4.76, count: 28, tags: ['Probability', 'Bayesian', 'MarkovChains'] },
      { id: 'res_17', title: 'ME302: Kinematics & Dynamics of Robotic Manipulators', code: 'ME302', name: 'Robotics & Automation', cat: 'Notes', sem: 6, dept: 'Mechanical', url: 'https://campus.edu/resources/me302_robotics.pdf', size: 3100, uploader: 'usr_student_8', dl: 88, rating: 4.80, count: 12, tags: ['Robotics', 'Kinematics', 'DH-Parameters'] },
      { id: 'res_18', title: 'BT202: Algorithms in Bioinformatics & Sequence Alignment (Needleman-Wunsch)', code: 'BT202', name: 'Computational Biology', cat: 'Notes', sem: 4, dept: 'Biotechnology', url: 'https://campus.edu/resources/bt202_bioinfo.pdf', size: 1750, uploader: 'usr_student_14', dl: 74, rating: 4.74, count: 11, tags: ['Bioinformatics', 'SequenceAlignment', 'DP'] },
      { id: 'res_19', title: 'CS201: Computer Organization & Assembly Language (RISC-V Edition)', code: 'CS201', name: 'Computer Organization', cat: 'Notes', sem: 3, dept: 'Computer Science', url: 'https://campus.edu/resources/cs201_riscv.pdf', size: 2850, uploader: 'usr_student_3', dl: 195, rating: 4.78, count: 24, tags: ['RISCV', 'Architecture', 'Assembly', 'CPU'] },
      { id: 'res_20', title: 'ENV101: Sustainable Campus Computing & Carbon Accounting Guidelines', code: 'ENV101', name: 'Environmental Science', cat: 'Guide', sem: 2, dept: 'Environmental', url: 'https://campus.edu/resources/env101_carbon_computing.pdf', size: 1450, uploader: 'usr_faculty_1', dl: 160, rating: 4.85, count: 22, tags: ['Sustainability', 'CarbonAccounting', 'PUE'] }
    ];

    for (const r of resourcesData) {
      insertResource.run(
        r.id,
        r.title,
        r.code,
        r.name,
        r.cat,
        r.sem,
        r.dept,
        r.url,
        'pdf',
        r.size,
        r.uploader,
        r.dl,
        r.rating,
        r.count,
        JSON.stringify(r.tags)
      );
    }

    // --------------------------------------------------------------------------
    // 14. RIDE OFFERS & BOOKINGS (10 Offers)
    // --------------------------------------------------------------------------
    const insertOffer = db.prepare(`
      INSERT INTO ride_offers (id, driver_id, origin_node_id, destination_node_id, departure_time, total_seats, available_seats, vehicle_type, max_detour_ratio, status, planned_route)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0.35, ?, ?)
    `);

    insertOffer.run('offer_1', 'usr_driver_1', 'GATE_NORTH', 'GATE_SOUTH', '2026-10-30 08:30:00', 4, 2, 'EV_CAR', 'matched', JSON.stringify(['GATE_NORTH', 'DORM_NORTH', 'ACAD_QUAD', 'STUDENT_CTR', 'GATE_SOUTH']));
    insertOffer.run('offer_2', 'usr_driver_2', 'DORM_NORTH', 'LAB_CS_AI', '2026-10-30 09:00:00', 6, 5, 'CAMPUS_SHUTTLE', 'open', JSON.stringify(['DORM_NORTH', 'LIB_CENTRAL', 'LAB_CS_AI']));
    insertOffer.run('offer_3', 'usr_driver_2', 'GATE_NORTH', 'GATE_SOUTH', '2026-10-30 09:30:00', 6, 6, 'CAMPUS_SHUTTLE', 'open', JSON.stringify(['GATE_NORTH', 'STUDENT_CTR', 'DORM_SOUTH', 'GATE_SOUTH']));
    insertOffer.run('offer_4', 'usr_driver_3', 'GATE_SOUTH', 'GATE_NORTH', '2026-10-30 10:00:00', 6, 6, 'CAMPUS_SHUTTLE', 'open', JSON.stringify(['GATE_SOUTH', 'STUDENT_CTR', 'GATE_NORTH']));
    insertOffer.run('offer_5', 'usr_driver_3', 'DORM_SOUTH', 'LIB_CENTRAL', '2026-10-30 11:15:00', 6, 5, 'CAMPUS_SHUTTLE', 'open', JSON.stringify(['DORM_SOUTH', 'STUDENT_CTR', 'LIB_CENTRAL']));
    insertOffer.run('offer_6', 'usr_driver_1', 'LIB_CENTRAL', 'DORM_SOUTH', '2026-10-30 13:00:00', 4, 4, 'EV_CAR', 'open', JSON.stringify(['LIB_CENTRAL', 'ACAD_QUAD', 'DORM_SOUTH']));
    insertOffer.run('offer_7', 'usr_driver_1', 'GATE_NORTH', 'STUDENT_CTR', '2026-10-30 14:30:00', 4, 3, 'EV_CAR', 'open', JSON.stringify(['GATE_NORTH', 'INNOVATION_PARK', 'STUDENT_CTR']));
    insertOffer.run('offer_8', 'usr_driver_1', 'STUDENT_CTR', 'GATE_NORTH', '2026-10-30 16:45:00', 4, 4, 'EV_CAR', 'open', JSON.stringify(['STUDENT_CTR', 'INNOVATION_PARK', 'GATE_NORTH']));
    insertOffer.run('offer_9', 'usr_driver_2', 'LIB_CENTRAL', 'SPORTS_CMPLX', '2026-10-30 17:30:00', 6, 6, 'CAMPUS_SHUTTLE', 'open', JSON.stringify(['LIB_CENTRAL', 'LAB_CS_AI', 'SPORTS_CMPLX']));
    insertOffer.run('offer_10', 'usr_driver_3', 'GATE_NORTH', 'INNOVATION_PARK', '2026-10-30 18:00:00', 6, 5, 'CAMPUS_SHUTTLE', 'open', JSON.stringify(['GATE_NORTH', 'INNOVATION_PARK']));

    // Requests and Matches for Baseline Compatibility
    const insertRequest = db.prepare(`
      INSERT INTO ride_requests (id, passenger_id, origin_node_id, destination_node_id, desired_departure_time, seats_needed, max_detour_ratio, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertRequest.run('req_1', 'usr_student_1', 'DORM_NORTH', 'STUDENT_CTR', '2026-10-30 08:35:00', 1, 0.35, 'matched');
    insertRequest.run('req_2', 'usr_student_3', 'GATE_NORTH', 'LAB_CS_AI', '2026-10-30 09:15:00', 1, 0.35, 'matched');

    const insertMatch = db.prepare(`
      INSERT INTO ride_matches (id, offer_id, request_id, matched_path, driver_solo_distance_km, passenger_solo_distance_km, pooled_distance_km, shared_distance_km, detour_distance_km, detour_ratio, carbon_saved_kg, driver_earnings, passenger_fare, passenger_savings, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertMatch.run(
      'match_1',
      'offer_1',
      'req_1',
      JSON.stringify(['GATE_NORTH', 'DORM_NORTH', 'ACAD_QUAD', 'STUDENT_CTR', 'GATE_SOUTH']),
      3.0,
      1.3,
      3.0,
      1.3,
      0.0,
      0.0,
      0.22,
      25.50,
      20.00,
      15.00,
      'confirmed'
    );

    const insertBooking = db.prepare(`
      INSERT INTO ride_bookings (id, match_id, passenger_id, seats_booked, fare_paid)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertBooking.run('bk_1', 'match_1', 'usr_student_1', 1, 20.00);

    // --------------------------------------------------------------------------
    // 15. SUSTAINABLE COMPUTING WORKLOADS, TELEMETRY & SCENARIOS
    // --------------------------------------------------------------------------
    const insertWorkload = db.prepare(`
      INSERT INTO service_workloads (id, service_name, service_type, description, baseline_replicas, current_replicas, target_rps, current_rps, is_eco_optimized)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertWorkload.run('WORKLOAD_LMS', 'Campus Academic Portal & LMS', 'Academic Portal & LMS', 'Database and I/O intensive query loads, exam downloads, assignment submissions.', 4, 3, 160.0, 142.5, 1);
    insertWorkload.run('WORKLOAD_AI_INFERENCE', 'Campus AI & Research GPU Cluster', 'Campus AI & Research GPU', 'Compute and tensor-core intensive model jobs, student ML inference, exam video processing.', 2, 2, 45.0, 38.0, 1);
    insertWorkload.run('WORKLOAD_IOT_STREAM', 'IoT Smart Grid & Facility Ingestion', 'IoT Smart Grid Ingestion', 'Time-series sensor ingestion, smart energy meters, hostel water sensors.', 3, 3, 450.0, 420.0, 0);

    const insertTelemetry = db.prepare(`
      INSERT INTO telemetry_snapshots (id, service_id, timestamp, request_count, rps, avg_latency_ms, p95_latency_ms, cpu_utilization_pct, gpu_utilization_pct, memory_mb, power_watts, pue, grid_carbon_intensity_g_per_kwh, carbon_emissions_g_per_hr, provenance)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertTelemetry.run('snap_1', 'WORKLOAD_LMS', '2026-10-29 12:00:00', 8550, 142.5, 45.2, 112.0, 48.5, 0.0, 14200, 185.2, 1.25, 210.0, 48.6, 'SIMULATED_WORKLOAD');
    insertTelemetry.run('snap_2', 'WORKLOAD_AI_INFERENCE', '2026-10-29 12:00:00', 2280, 38.0, 185.0, 420.0, 62.0, 78.5, 32400, 480.0, 1.25, 210.0, 126.0, 'SIMULATED_WORKLOAD');
    insertTelemetry.run('snap_3', 'WORKLOAD_IOT_STREAM', '2026-10-29 12:00:00', 25200, 420.0, 14.8, 28.5, 28.0, 0.0, 8100, 115.0, 1.35, 210.0, 32.7, 'SIMULATED_WORKLOAD');

    const insertScenario = db.prepare(`
      INSERT INTO scenario_configurations (id, name, description, dynamic_frequency_scaling, idle_server_shutdown, temporal_solar_shifting, query_caching, cooling_pue, estimated_daily_kwh, estimated_daily_carbon_kg, estimated_monthly_cost)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertScenario.run(
      'SCENARIO_BASELINE',
      'Legacy Unoptimized Baseline',
      'Static over-provisioned servers, legacy chillers (PUE 1.75), continuous night GPU batches without solar alignment.',
      0, 0, 0, 0, 1.75, 285.4, 135.5, 2711.30
    );

    insertScenario.run(
      'SCENARIO_ECO',
      'Eco-Optimized Observatory Configuration',
      'Autoscaling with idle server shutdown, solar peak temporal shifting, in-memory query caching, evaporative cooling (PUE 1.20).',
      1, 1, 1, 1, 1.20, 154.2, 62.8, 1464.90
    );

    // --------------------------------------------------------------------------
    // 16. SOVEREIGN DIGITAL WELLBEING (Domain Rules, Focus Sessions, DP Aggregates)
    // --------------------------------------------------------------------------
    const insertRule = db.prepare(`
      INSERT INTO domain_rules (id, user_id, domain_pattern, category, is_custom)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertRule.run('rule_1', null, 'github.com', 'Productive', 0);
    insertRule.run('rule_2', null, 'stackoverflow.com', 'Productive', 0);
    insertRule.run('rule_3', null, 'arxiv.org', 'Productive', 0);
    insertRule.run('rule_4', null, 'notion.so', 'Productive', 0);
    insertRule.run('rule_5', null, 'leetcode.com', 'Productive', 0);
    insertRule.run('rule_6', null, 'react.dev', 'Productive', 0);
    insertRule.run('rule_7', null, 'youtube.com', 'Distracting', 0);
    insertRule.run('rule_8', null, 'instagram.com', 'Distracting', 0);
    insertRule.run('rule_9', null, 'reddit.com', 'Distracting', 0);
    insertRule.run('rule_10', null, 'twitter.com', 'Distracting', 0);
    insertRule.run('rule_11', null, 'netflix.com', 'Distracting', 0);

    const insertFocus = db.prepare(`
      INSERT INTO focus_sessions (id, user_id, start_time, end_time, target_duration_mins, actual_duration_mins, status, goal, deep_work_index, active_focus_ratio, context_switch_rate, productive_time_secs, distracting_time_secs, neutral_time_secs, total_switches)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertFocus.run(
      'foc_1',
      'usr_student_1',
      '2026-10-29 09:00:00',
      '2026-10-29 09:45:00',
      45,
      45,
      'completed',
      'CS301 Graph Algorithms problem set & lecture review',
      84.5,
      0.88,
      4.0,
      2376,
      180,
      144,
      3
    );

    const insertCohort = db.prepare(`
      INSERT INTO cohort_aggregates (id, department, date, participant_count, is_suppressed, raw_avg_focus_mins, dp_noisy_avg_focus_mins, raw_avg_dwi, dp_noisy_avg_dwi, epsilon_used)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertCohort.run('coh_1', 'Computer Science & Engineering', '2026-10-29', 28, 0, 42.5, 43.1, 79.4, 78.8, 0.80);
    insertCohort.run('coh_2', 'Aerospace Engineering (Special Seminar)', '2026-10-29', 3, 1, null, null, null, null, 0.80); // Suppressed (k < 5)

    // --------------------------------------------------------------------------
    // 17. RESPONSIBLE EXAMINATION REVIEW & PROCTOR AUDIT (Marked Sample)
    // --------------------------------------------------------------------------
    const insertExam = db.prepare(`
      INSERT INTO exam_sessions (id, course_id, title, student_id, scheduled_start, scheduled_end, actual_start, status, candidate_station_zone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertExam.run(
      'exam_1',
      'CS301',
      'Data Structures & Algorithms Comprehensive Final Examination',
      'usr_student_1',
      '2026-10-29 10:00:00',
      '2026-10-29 12:00:00',
      '2026-10-29 10:02:00',
      'in_progress',
      JSON.stringify({ x: 100, y: 80, w: 440, h: 320 })
    );

    const insertExamAssignment = db.prepare(`
      INSERT INTO exam_session_assignments (id, session_id, proctor_id, status)
      VALUES (?, ?, ?, 'active')
    `);
    insertExamAssignment.run('esa_1', 'exam_1', 'usr_proctor_1');
    insertExamAssignment.run('esa_2', 'exam_1', 'usr_proctor_2');

    const insertObservation = db.prepare(`
      INSERT INTO observation_events (id, exam_session_id, timestamp, offset_seconds, event_type, confidence_score, frame_snapshot_url, provenance, metrics_payload, review_status, proctor_notes, reviewer_id, resolved_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertObservation.run(
      'obs_1',
      'exam_1',
      '2026-10-29 10:14:32',
      872.0,
      'HEAD_POSE_DEVIATION',
      0.88,
      'https://campus.edu/exam_frames/obs_1.jpg',
      'ACTUAL_INFERENCE',
      JSON.stringify({ yaw: 41.5, pitch: -6.2, roll: 2.1, sustainedSec: 3.4 }),
      'PENDING_REVIEW',
      null,
      null,
      null
    );

    insertObservation.run(
      'obs_2',
      'exam_1',
      '2026-10-29 10:28:15',
      1695.0,
      'UNAUTHORIZED_PERSON',
      0.94,
      'https://campus.edu/exam_frames/obs_2.jpg',
      'SIMULATED_EVENT',
      JSON.stringify({ personCount: 2, workstationEnvelopeViolation: true, durationSec: 1.8 }),
      'DISMISS_BENIGN_BEHAVIOR',
      'Candidate sibling entered room briefly to deliver water bottle. Candidate remained seated and focused on screen.',
      'usr_proctor_1',
      '2026-10-29 10:31:00'
    );

    const insertAudit = db.prepare(`
      INSERT INTO exam_audit_log (id, event_id, exam_session_id, proctor_id, previous_status, new_status, action, reason_code, proctor_notes, timestamp_utc)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertAudit.run(
      'aud_1',
      'obs_2',
      'exam_1',
      'usr_proctor_1',
      'PENDING_REVIEW',
      'DISMISS_BENIGN_BEHAVIOR',
      'DISMISS_BENIGN_BEHAVIOR',
      'WATER_DELIVERY_BENIGN',
      'Candidate sibling entered room briefly to deliver water bottle. Candidate remained seated and focused on screen.',
      '2026-10-29 10:31:00'
    );

    // --------------------------------------------------------------------------
    // 18. ROLE-APPROPRIATE NOTIFICATIONS & ACTIVITY LOG
    // --------------------------------------------------------------------------
    const insertNotif = db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, module, type, is_read, link_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertNotif.run('notif_1', 'usr_student_1', 'Mentorship Request Accepted', 'Diya Patel accepted your request for System Design Mock on Sat 11:00 AM.', 'hub', 'success', 0, '/academic');
    insertNotif.run('notif_2', 'usr_student_1', 'Ride Match Confirmed', 'You were matched with Vikram Rao for your ride to Central Dining. Departure at 08:35 AM.', 'rides', 'info', 0, '/rides');
    insertNotif.run('notif_3', 'usr_student_1', 'Focus Milestone Reached', 'Congratulations! You achieved a Deep Work Index of 84.5 during your 45-minute focus session.', 'wellbeing', 'success', 1, '/wellbeing');
    insertNotif.run('notif_4', 'usr_proctor_1', 'Exam Incident Pending Triage', '1 unreviewed head-pose deviation flag in CS301 Comprehensive Final.', 'exams', 'alert', 0, '/exams');
    insertNotif.run('notif_5', 'usr_warden_1', 'New Facility Issue Reported', 'Hostel Block A 3rd Floor Wi-Fi dropping defect reported by Aarav Sharma.', 'system', 'alert', 0, '/facilities');
    insertNotif.run('notif_6', 'usr_driver_1', 'New Passenger Booking Confirmed', 'Aarav Sharma reserved 1 seat on your 08:30 AM departure to Turing Hall.', 'rides', 'success', 0, '/driver/trips');

    const insertActivity = db.prepare(`
      INSERT INTO activity_log (id, user_id, module, action, details)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertActivity.run('act_1', 'usr_student_1', 'hub', 'MENTORSHIP_REQUEST_SENT', JSON.stringify({ mentor: 'Diya Patel', topic: 'System Design Mock' }));
    insertActivity.run('act_2', 'usr_student_1', 'rides', 'RIDE_MATCH_CONFIRMED', JSON.stringify({ matchId: 'match_1', savingsKg: 0.22 }));
    insertActivity.run('act_3', 'usr_student_1', 'wellbeing', 'FOCUS_SESSION_COMPLETED', JSON.stringify({ durationMins: 45, dwi: 84.5 }));
    insertActivity.run('act_4', 'usr_proctor_1', 'exams', 'PROCTOR_INCIDENT_RESOLVED', JSON.stringify({ eventId: 'obs_2', action: 'DISMISS_BENIGN_BEHAVIOR' }));
  });

  runSeed();
  console.log('✅ UniVerse database successfully seeded with all realistic campus fixtures!');
}

// Enable standalone CLI execution
seedDatabase();
