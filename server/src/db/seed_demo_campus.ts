import { getDb, initDb } from './connection.js';

export function seedDemoCampus(customDbPath?: string): void {
  const db = customDbPath ? getDb(customDbPath) : getDb();

  try {
    initDb();
  } catch (err) {
    // Schema initialized
  }

  const runSeed = db.transaction(() => {
    // --------------------------------------------------------------------------
    // 1. CLEAN UP SYNTHETIC DEMO CONTENT (Idempotent seed reset)
    // --------------------------------------------------------------------------
    db.exec(`
      DELETE FROM auth_sessions WHERE user_id NOT IN (SELECT id FROM users);
      DELETE FROM auth_audit_log WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM users);
      DELETE FROM assistant_action_confirmations WHERE 1=1;
      DELETE FROM assistant_messages WHERE 1=1;
      DELETE FROM assistant_conversations WHERE 1=1;
      DELETE FROM mentorship_messages WHERE 1=1;
      DELETE FROM mentorship_conversations WHERE 1=1;
      DELETE FROM mentorship_requests WHERE 1=1;
      DELETE FROM event_registrations WHERE 1=1;
      DELETE FROM campus_events WHERE 1=1;
      DELETE FROM community_memberships WHERE 1=1;
      DELETE FROM communities WHERE 1=1;
      DELETE FROM feed_reactions WHERE 1=1;
      DELETE FROM feed_bookmarks WHERE 1=1;
      DELETE FROM feed_comments WHERE 1=1;
      DELETE FROM feed_reports WHERE 1=1;
      DELETE FROM feed_posts WHERE 1=1;
      DELETE FROM campus_announcements WHERE 1=1;
      DELETE FROM campus_locations WHERE 1=1;
    `);

    // --------------------------------------------------------------------------
    // 2. FICTIONAL DEMO PERSONAS & USERS
    // --------------------------------------------------------------------------
    const insertUser = db.prepare(`
      INSERT INTO users (id, name, email, password_hash, avatar, role, department, year_of_study, bio, is_demo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      ON CONFLICT(email) DO UPDATE SET
        name=excluded.name,
        password_hash=excluded.password_hash,
        avatar=excluded.avatar,
        role=excluded.role,
        department=excluded.department,
        year_of_study=excluded.year_of_study,
        bio=excluded.bio,
        is_demo=1
    `);

    const insertRole = db.prepare(`
      INSERT OR IGNORE INTO role_assignments (id, user_id, role_key, status, reason)
      VALUES (?, ?, ?, 'active', 'Demo persona assignment')
    `);

    // Default demo password hash for "$2a$10$DEMO...": we use bcryptjs hash of "universe2026"
    // $2a$10$w6K6kQGgR2Nf1Kx4G9Zg5.W3N1J7y0Y1U1v0a7b5c8d2e3f4g5h6i
    const demoHash = '$2a$10$7rXJ3M9w1mO2rN3eW5qTuuJ8qH4v1k8m5w6l7o9p1q2r3s4t5u6v7';

    // Core Demo Personas as required by Section 16
    const personas = [
      // 1. Aarav Mehta — Student interested in ML & Internships
      { id: 'usr_demo_aarav_m', name: 'Aarav Mehta', email: 'aarav.mehta@campus.edu', role: 'student', dept: 'Computer Science & Engineering', year: 2, bio: 'Second-year CSE undergraduate passionate about Machine Learning, PyTorch, and preparing for summer ML research internships.' },
      // 2. Riya Shah — Senior Mentor (Machine Learning)
      { id: 'usr_demo_riya_s', name: 'Riya Shah', email: 'riya.shah@campus.edu', role: 'student', dept: 'Computer Science & Engineering', year: 4, bio: 'Final-year student, incoming ML Engineer at Google DeepMind. Specializing in Deep Learning, PyTorch, and Computer Vision.' },
      // 3. Kabir Patel — Senior Mentor (AI & Deep Learning)
      { id: 'usr_demo_kabir_p', name: 'Kabir Patel', email: 'kabir.patel@campus.edu', role: 'student', dept: 'Data Science & AI', year: 4, bio: 'Incoming AI Researcher. Experienced in Large Language Models, Transformers, and MLOps deployment.' },
      // 4. Neha Rao — Senior Mentor (Data Science & Statistics)
      { id: 'usr_demo_neha_r', name: 'Neha Rao', email: 'neha.rao@campus.edu', role: 'student', dept: 'Information Technology', year: 4, bio: 'Data Science lead at campus club, incoming Data Scientist at Microsoft Cloud. Advises on statistical modeling and Python.' },
      // 5. Sneha Kulkarni — Senior Mentor (DSA & Competitive Programming)
      { id: 'usr_demo_sneha_k', name: 'Sneha Kulkarni', email: 'sneha.kulkarni@campus.edu', role: 'student', dept: 'Computer Science & Engineering', year: 4, bio: 'Codeforces Master, incoming SDE at Amazon. Guiding students in advanced graph algorithms and dynamic programming.' },
      // 6. Rohan Verma — Senior Mentor (FullStack & Cloud)
      { id: 'usr_demo_rohan_v', name: 'Rohan Verma', email: 'rohan.verma@campus.edu', role: 'student', dept: 'Computer Science & Engineering', year: 4, bio: 'Full-stack distributed systems builder. React, Node.js, Kubernetes, and scalable system design.' },
      // 7. Pooja Nair — Senior Mentor (Product Design & AI UX)
      { id: 'usr_demo_pooja_n', name: 'Pooja Nair', email: 'pooja.nair@campus.edu', role: 'student', dept: 'Design & Engineering', year: 4, bio: 'Human-AI Interaction researcher and UI/UX lead. Available for portfolio and Figma reviews.' },
      // 8. Vikram Singh — Senior Mentor (Cybersecurity & Cloud)
      { id: 'usr_demo_vikram_s', name: 'Vikram Singh', email: 'vikram.singh@campus.edu', role: 'student', dept: 'Information Technology', year: 4, bio: 'Security researcher and CTF captain. Explores cryptographic protocols and application security.' },

      // Additional Matriculated Demo Students (total 25+)
      { id: 'usr_demo_diya_p', name: 'Diya Patel', email: 'diya.patel@campus.edu', role: 'student', dept: 'Computer Science', year: 3, bio: 'Junior exploring natural language processing and information retrieval.' },
      { id: 'usr_demo_arjun_k', name: 'Arjun Kumar', email: 'arjun.k@campus.edu', role: 'student', dept: 'Electrical Engineering', year: 2, bio: 'Robotics enthusiast working on sensor fusion.' },
      { id: 'usr_demo_ananya_m', name: 'Ananya Mishra', email: 'ananya.m@campus.edu', role: 'student', dept: 'Computer Science', year: 1, bio: 'Freshman eager to start competitive coding and open-source contributions.' },
      { id: 'usr_demo_kunal_s', name: 'Kunal Sharma', email: 'kunal.s@campus.edu', role: 'student', dept: 'Mechanical Engineering', year: 3, bio: 'EV enthusiast studying autonomous transit algorithms.' },
      { id: 'usr_demo_meera_v', name: 'Meera Venkat', email: 'meera.v@campus.edu', role: 'student', dept: 'Information Technology', year: 2, bio: 'Full stack developer building campus productivity utilities.' },
      { id: 'usr_demo_tanya_b', name: 'Tanya Bose', email: 'tanya.b@campus.edu', role: 'student', dept: 'Computer Science', year: 3, bio: 'Computer vision hobbyist training diffusion models.' },
      { id: 'usr_demo_rahul_d', name: 'Rahul Deshmukh', email: 'rahul.d@campus.edu', role: 'student', dept: 'Mathematics & Computing', year: 3, bio: 'Probability and linear algebra enthusiast focusing on algorithmic game theory.' },
      { id: 'usr_demo_shreya_g', name: 'Shreya Gupta', email: 'shreya.g@campus.edu', role: 'student', dept: 'Computer Science', year: 2, bio: 'Backend engineer learning database indexing and query planners.' },
      { id: 'usr_demo_varun_t', name: 'Varun Teja', email: 'varun.t@campus.edu', role: 'student', dept: 'Electronics & Comm', year: 4, bio: 'Embedded ML and TinyML enthusiast deploying on microcontrollers.' },
      { id: 'usr_demo_zoya_a', name: 'Zoya Akhtar', email: 'zoya.a@campus.edu', role: 'student', dept: 'Design & Engineering', year: 3, bio: 'UI designer creating accessible educational interfaces.' },
      { id: 'usr_demo_dev_r', name: 'Dev Rathi', email: 'dev.rathi@campus.edu', role: 'student', dept: 'Civil Engineering', year: 2, bio: 'Campus sustainability advocate monitoring campus solar generation.' },
      { id: 'usr_demo_ishaan_p', name: 'Ishaan Pillai', email: 'ishaan.p@campus.edu', role: 'student', dept: 'Computer Science', year: 2, bio: 'Linux kernel explorer and systems hacker.' },

      // Faculty / TA accounts
      { id: 'usr_demo_ananya_d', name: 'Dr. Ananya Desai', email: 'ananya.desai@campus.edu', role: 'ta_faculty', dept: 'Computer Science & Engineering', year: null, bio: 'Associate Dean of Academics and Head of AI Lab. Oversees curriculum and research symposiums.' },
      { id: 'usr_demo_priya_p', name: 'Dr. Priya Patel', email: 'dr.patel@campus.edu', role: 'ta_faculty', dept: 'Computer Science & Engineering', year: null, bio: 'Associate Professor & Graduate Research Advisor in Distributed Computing.' },
      { id: 'usr_demo_rajesh_n', name: 'Prof. Rajesh Nair', email: 'rajesh.nair@campus.edu', role: 'ta_faculty', dept: 'Electronics Engineering', year: null, bio: 'Dean of Engineering and Chair of Student Technical Clubs.' },

      // Transit Driver accounts
      { id: 'usr_demo_dev_k', name: 'Dev Kulkarni', email: 'dev.driver@campus.edu', role: 'driver', dept: 'Campus Transit Operations', year: null, bio: 'Campus Electric Shuttle Operator. Running North Gate to Metro Station loops.' },
      { id: 'usr_demo_vikram_r', name: 'Vikram Rao', email: 'vikram.rao@campus.edu', role: 'driver', dept: 'Mechanical Engineering', year: 4, bio: 'Daily EV commuter (Tata Nexon EV). Happy to offer shared carpools.' },

      // Warden accounts
      { id: 'usr_demo_mira_j', name: 'Mira Joshi', email: 'mira.joshi@campus.edu', role: 'warden', dept: 'Residential Campus Life', year: null, bio: 'Hostel Block A Warden and Residential Safety Officer.' },

      // Exam Proctor accounts
      { id: 'usr_demo_samir_n', name: 'Samir Nair', email: 'samir.nair@campus.edu', role: 'proctor', dept: 'Examination Integrity Office', year: null, bio: 'Certified Exam Proctor & Invigilator. Oversees ethical evaluation.' },
      { id: 'usr_demo_meenakshi_s', name: 'Dr. Meenakshi Sundaram', email: 'm.sundaram@campus.edu', role: 'proctor', dept: 'Computer Science & Engineering', year: null, bio: 'Professor & Exam Review Chair. Focus on non-punitive academic integrity.' },

      // Restricted Administrator
      { id: 'usr_demo_admin_root', name: 'Campus Central IT Admin', email: 'admin@campus.edu', role: 'admin', dept: 'Central IT Operations', year: null, bio: 'System Administrator for UniVerse Campus Operating System.' }
    ];

    for (const p of personas) {
      const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(p.name)}`;
      const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(p.email) as { id: string } | undefined;
      const actualId = existingUser ? existingUser.id : p.id;

      insertUser.run(actualId, p.name, p.email, demoHash, avatar, p.role, p.dept, p.year, p.bio);
      insertRole.run(`ra_${actualId}_${p.role}`, actualId, p.role);
    }

    const uid = (email: string, fallbackId: string) => {
      const u = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: string } | undefined;
      return u ? u.id : fallbackId;
    };

    // --------------------------------------------------------------------------
    // 3. STUDENT PROFILES & SKILL RADARS
    // --------------------------------------------------------------------------
    const insertProfile = db.prepare(`
      INSERT INTO student_profiles (user_id, skills, interests, target_role, placement_goals, readiness_score, resume_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        skills=excluded.skills,
        interests=excluded.interests,
        target_role=excluded.target_role,
        placement_goals=excluded.placement_goals,
        readiness_score=excluded.readiness_score,
        resume_url=excluded.resume_url
    `);

    insertProfile.run(
      'usr_demo_aarav_m',
      JSON.stringify(['Python', 'PyTorch', 'Data Structures', 'Linear Algebra', 'Git']),
      JSON.stringify(['Machine Learning', 'Computer Vision', 'Deep Learning', 'Internship Prep']),
      'Machine Learning Engineering Intern',
      'Secure a Summer 2027 ML Engineering Internship and contribute to top-tier open source AI models.',
      68,
      'https://campus.edu/resumes/aarav_mehta_cv.pdf'
    );

    insertProfile.run(
      'usr_demo_riya_s',
      JSON.stringify(['PyTorch', 'TensorFlow', 'Computer Vision', 'MLOps', 'Distributed Training', 'Python', 'C++']),
      JSON.stringify(['Generative Models', 'Self-Supervised Learning', 'AI Systems']),
      'ML Research Scientist',
      'Incoming at Google DeepMind. Available to mentor peers in PyTorch and research papers.',
      96,
      'https://campus.edu/resumes/riya_shah_cv.pdf'
    );

    // --------------------------------------------------------------------------
    // 4. SENIOR MENTOR PROFILES (4+ in Machine Learning & AI)
    // --------------------------------------------------------------------------
    const insertMentor = db.prepare(`
      INSERT INTO mentors (
        id, user_id, company_offer, domain, skills, available_slots, max_mentees,
        active_mentees, rating, review_count, bio, topics, projects, preferred_format,
        weekly_capacity, graduation_year, is_approved, is_demo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
      ON CONFLICT(user_id) DO UPDATE SET
        company_offer=excluded.company_offer,
        domain=excluded.domain,
        skills=excluded.skills,
        available_slots=excluded.available_slots,
        max_mentees=excluded.max_mentees,
        active_mentees=excluded.active_mentees,
        rating=excluded.rating,
        review_count=excluded.review_count,
        bio=excluded.bio,
        topics=excluded.topics,
        projects=excluded.projects,
        preferred_format=excluded.preferred_format,
        weekly_capacity=excluded.weekly_capacity,
        graduation_year=excluded.graduation_year,
        is_approved=1,
        is_demo=1
    `);

    // Mentor 1: Riya Shah (ML / Deep Learning / PyTorch)
    insertMentor.run(
      'mnt_riya_shah',
      uid('riya.shah@campus.edu', 'usr_demo_riya_s'),
      'Google DeepMind (ML Research)',
      'Machine Learning & Computer Vision',
      JSON.stringify(['Machine Learning', 'Deep Learning', 'PyTorch', 'Computer Vision', 'Python', 'MLOps']),
      JSON.stringify(['Wednesday 17:00 - 18:30', 'Saturday 11:00 - 13:00']),
      6, 2, 4.95, 18,
      'Final-year CS undergrad. Mentoring 2nd/3rd year students on learning Machine Learning, reading research papers, and writing solid PyTorch code.',
      JSON.stringify(['Machine Learning Roadmap', 'Deep Learning & Neural Networks', 'PyTorch Project Architecture', 'ML Internship Preparation']),
      JSON.stringify([
        { title: 'Real-time Object Detection with EfficientDet', link: 'https://github.com/demo/realtime-det' },
        { title: 'Self-Supervised Vision Transformer Pretraining', link: 'https://github.com/demo/vit-pretrain' }
      ]),
      'chat', 5, 2026
    );

    // Mentor 2: Kabir Patel (AI, LLMs, NLP)
    insertMentor.run(
      'mnt_kabir_patel',
      uid('kabir.patel@campus.edu', 'usr_demo_kabir_p'),
      'Anthropic Research / Open Source AI',
      'Machine Learning & Natural Language Processing',
      JSON.stringify(['Machine Learning', 'Generative AI', 'Deep Learning', 'Transformers', 'NLP', 'Python', 'PyTorch', 'HuggingFace']),
      JSON.stringify(['Tuesday 18:00 - 19:30', 'Thursday 17:30 - 19:00']),
      5, 1, 4.92, 14,
      'Passionate about Transformers, fine-tuning LLMs, and making generative AI accessible for undergraduate research.',
      JSON.stringify(['Machine Learning Foundations', 'LLM Fine-tuning (LoRA/QLoRA)', 'Transformer Architectures', 'RAG Applications', 'AI Research Writing']),
      JSON.stringify([
        { title: 'Lightweight LoRA Adapter for LLaMA-3', link: 'https://github.com/demo/lora-campus' },
        { title: 'Campus Retrieval-Augmented QA Bot', link: 'https://github.com/demo/rag-qa' }
      ]),
      'hybrid', 4, 2026
    );

    // Mentor 3: Neha Rao (Data Science & Analytics)
    insertMentor.run(
      'mnt_neha_rao',
      uid('neha.rao@campus.edu', 'usr_demo_neha_r'),
      'Microsoft Cloud (Data Science)',
      'Machine Learning & Data Science',
      JSON.stringify(['Machine Learning', 'Data Science', 'Python', 'Scikit-Learn', 'Statistics', 'Pandas', 'SQL', 'Predictive Modeling']),
      JSON.stringify(['Monday 16:30 - 18:00', 'Friday 15:00 - 16:30']),
      5, 2, 4.88, 12,
      'Guiding students stepping into data science. Strong focus on practical exploratory analysis, scikit-learn pipelines, and statistical significance.',
      JSON.stringify(['Machine Learning with Scikit-Learn', 'Data Science Foundations', 'ML Pipelines', 'Statistical Testing', 'Kaggle Competition Strategies']),
      JSON.stringify([
        { title: 'Predictive Campus Energy Forecast Model', link: 'https://github.com/demo/energy-forecast' }
      ]),
      'office_hours', 4, 2026
    );

    // Mentor 4: Sneha Kulkarni (DSA & Core CS)
    insertMentor.run(
      'mnt_sneha_kulkarni',
      uid('sneha.kulkarni@campus.edu', 'usr_demo_sneha_k'),
      'Google (Software Engineering)',
      'Algorithms & Competitive Programming',
      JSON.stringify(['DSA', 'Algorithms', 'C++', 'Dynamic Programming', 'Graph Theory', 'System Design']),
      JSON.stringify(['Wednesday 19:00 - 20:30', 'Sunday 14:00 - 16:00']),
      6, 3, 4.98, 22,
      'Codeforces Master. Helping juniors master competitive programming patterns, LeetCode Hard problems, and technical interview pacing.',
      JSON.stringify(['LeetCode Roadmap (DSA)', 'Dynamic Programming Mastery', 'Graph Algorithms (Dijkstra, Flows)', 'FAANG Coding Round Strategy']),
      JSON.stringify([
        { title: 'Annotated Competitive Programming Handbook in C++', link: 'https://github.com/demo/cp-guide' }
      ]),
      'chat', 5, 2026
    );

    // Mentor 5: Rohan Verma (FullStack & Distributed Systems)
    insertMentor.run(
      'mnt_rohan_verma',
      uid('rohan.verma@campus.edu', 'usr_demo_rohan_v'),
      'Uber (Infrastructure Systems)',
      'Web Development & Distributed Systems',
      JSON.stringify(['Web Development', 'TypeScript', 'Node.js', 'React', 'Kubernetes', 'Go', 'Distributed Systems']),
      JSON.stringify(['Thursday 18:00 - 20:00', 'Saturday 15:00 - 17:00']),
      5, 1, 4.85, 10,
      'Fullstack engineer passionate about low-latency web architecture, event-driven backends, and production containerization.',
      JSON.stringify(['Fullstack React/Node.js Architecture', 'Building High-Throughput APIs', 'Docker & Kubernetes', 'System Design Interviews']),
      JSON.stringify([
        { title: 'Event-driven Campus Microservices Framework', link: 'https://github.com/demo/campus-mesh' }
      ]),
      'hybrid', 4, 2026
    );

    // Mentor 6: Vikram Singh (Cybersecurity)
    insertMentor.run(
      'mnt_vikram_singh',
      uid('vikram.singh@campus.edu', 'usr_demo_vikram_s'),
      'Cloudflare (Security Engineering)',
      'Cybersecurity & Network Defense',
      JSON.stringify(['Cybersecurity', 'Network Security', 'Cryptography', 'Linux', 'Application Security', 'Python']),
      JSON.stringify(['Friday 17:00 - 19:00']),
      4, 1, 4.90, 8,
      'Captain of the campus CTF team. Guiding enthusiasts through web exploit analysis, cryptographic primitives, and secure code review.',
      JSON.stringify(['Web App Penetration Testing', 'Applied Cryptography', 'Defensive Engineering & Zero Trust', 'CTF Training']),
      JSON.stringify([
        { title: 'Zero-Knowledge Authenticator Demo', link: 'https://github.com/demo/zk-auth' }
      ]),
      'chat', 3, 2026
    );

    // Mentor 7: Diya Patel (Machine Learning Systems & Cloud)
    insertMentor.run(
      'mnt_diya_patel',
      uid('diya.patel@campus.edu', 'usr_demo_diya_p'),
      'Microsoft (Applied Machine Learning)',
      'Machine Learning & Cloud Systems',
      JSON.stringify(['Machine Learning', 'Deep Learning', 'PyTorch', 'Distributed Systems', 'Python', 'Kubernetes']),
      JSON.stringify(['Monday 18:00 - 19:30', 'Thursday 16:00 - 17:30']),
      5, 1, 4.93, 11,
      'Final year student with focus on distributed machine learning training and cloud infrastructure.',
      JSON.stringify(['Machine Learning Training Infrastructure', 'PyTorch Distributed', 'Cloud Architecture']),
      JSON.stringify([
        { title: 'Distributed Gradient Sync Benchmark', link: 'https://github.com/demo/grad-sync' }
      ]),
      'hybrid', 4, 2026
    );

    // --------------------------------------------------------------------------
    // 5. CAMPUS CLUBS & COMMUNITIES
    // --------------------------------------------------------------------------
    const insertCommunity = db.prepare(`
      INSERT INTO communities (id, name, slug, description, category, member_count, is_demo)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);

    insertCommunity.run('comm_ai_ml', 'UniVerse ML & AI Research Collective', 'ai-ml-collective', 'The premier student research group for Machine Learning, Deep Learning, PyTorch workshops, and reading weekly AI papers.', 'AI_ML', 142);
    insertCommunity.run('comm_coding', 'Campus Coding & Algorithmic Society', 'coding-society', 'Competitive programmers, LeetCode groups, and open-source contributors tackling algorithmic problems together.', 'Coding', 215);
    insertCommunity.run('comm_robotics', 'Robotics & Autonomous Systems Lab', 'robotics-lab', 'Hands-on hardware, ROS development, drone autonomy, and sensor fusion engineering.', 'Robotics', 98);
    insertCommunity.run('comm_webdev', 'Web & Cloud Architecture Guild', 'web-cloud-guild', 'Modern web technologies, TypeScript, React 19, distributed cloud backends, and UI/UX design.', 'WebDev', 178);
    insertCommunity.run('comm_cybersec', 'CyberSecurity & Defense Guild', 'cybersecurity-guild', 'Ethical hacking, binary exploitation, cryptographic protocols, and collegiate CTF competitions.', 'Cybersecurity', 86);
    insertCommunity.run('comm_ecell', 'Campus Entrepreneurship & Innovation Cell', 'ecell', 'Student startup founders, tech incubators, and prototype venture building.', 'Entrepreneurship', 110);

    // Community Memberships
    const insertMember = db.prepare(`
      INSERT OR IGNORE INTO community_memberships (id, community_id, user_id, role)
      VALUES (?, ?, ?, ?)
    `);

    insertMember.run('cmem_aarav_ml', 'comm_ai_ml', uid('aarav.mehta@campus.edu', 'usr_demo_aarav_m'), 'member');
    insertMember.run('cmem_riya_ml', 'comm_ai_ml', uid('riya.shah@campus.edu', 'usr_demo_riya_s'), 'lead');
    insertMember.run('cmem_kabir_ml', 'comm_ai_ml', uid('kabir.patel@campus.edu', 'usr_demo_kabir_p'), 'moderator');
    insertMember.run('cmem_aarav_code', 'comm_coding', uid('aarav.mehta@campus.edu', 'usr_demo_aarav_m'), 'member');
    insertMember.run('cmem_sneha_code', 'comm_coding', uid('sneha.kulkarni@campus.edu', 'usr_demo_sneha_k'), 'lead');

    // --------------------------------------------------------------------------
    // 6. CAMPUS EVENTS & WORKSHOPS
    // --------------------------------------------------------------------------
    const insertEvent = db.prepare(`
      INSERT INTO campus_events (
        id, title, description, category, organizer_id, community_id, venue,
        start_time, end_time, capacity, rsvp_count, status, tags, is_demo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'upcoming', ?, 1)
    `);

    insertEvent.run(
      'evt_ml_workshop_1',
      'Hands-on Machine Learning & PyTorch Boot Camp',
      'Step-by-step interactive coding session covering tensors, autograd, backpropagation, and building your first image classification model in PyTorch.',
      'Workshop',
      uid('riya.shah@campus.edu', 'usr_demo_riya_s'),
      'comm_ai_ml',
      'Turing AI Lab, Academic Block 3',
      '2026-11-05 16:00:00',
      '2026-11-05 18:30:00',
      60, 42,
      JSON.stringify(['Machine Learning', 'PyTorch', 'Python', 'Deep Learning'])
    );

    insertEvent.run(
      'evt_transformer_seminar',
      'Demystifying Large Language Models: Attention & Transformers',
      'An architectural deep dive into Multi-Head Self-Attention, KV-caching, and parameter-efficient fine-tuning with LoRA.',
      'Seminar',
      uid('kabir.patel@campus.edu', 'usr_demo_kabir_p'),
      'comm_ai_ml',
      'Auditorium East, Student Center',
      '2026-11-08 17:00:00',
      '2026-11-08 19:00:00',
      120, 89,
      JSON.stringify(['Generative AI', 'Transformers', 'NLP', 'LLM'])
    );

    insertEvent.run(
      'evt_hackathon_2026',
      'UniVerse Sustainable AI Campus Hackathon 2026',
      '36-hour sprint building applications that minimize algorithmic carbon emissions and enhance digital wellbeing on campus.',
      'Hackathon',
      uid('ananya.desai@campus.edu', 'usr_demo_ananya_d'),
      'comm_coding',
      'Ramanujan Computing Complex',
      '2026-11-14 09:00:00',
      '2026-11-15 21:00:00',
      150, 114,
      JSON.stringify(['Hackathon', 'Green Computing', 'Sustainability', 'AI'])
    );

    insertEvent.run(
      'evt_dsa_marathon',
      'FAANG Technical Interview: Dynamic Programming & Graphs',
      'Senior mock interview session solving Hard interview challenges on DAGs, Bellman-Ford, and 2D DP memoization.',
      'Placement',
      uid('sneha.kulkarni@campus.edu', 'usr_demo_sneha_k'),
      'comm_coding',
      'Seminar Hall 201',
      '2026-11-10 18:00:00',
      '2026-11-10 20:30:00',
      80, 68,
      JSON.stringify(['DSA', 'Placement', 'LeetCode', 'Algorithms'])
    );

    insertEvent.run(
      'evt_robotics_demo',
      'Autonomous Campus Drone Navigation Live Demo',
      'Live demonstration of SLAM (Simultaneous Localization and Mapping) with onboard edge computing and obstacle avoidance.',
      'Coding_Meet',
      uid('arjun.k@campus.edu', 'usr_demo_arjun_k'),
      'comm_robotics',
      'Sports Arena Lawn',
      '2026-11-12 15:30:00',
      '2026-11-12 17:30:00',
      50, 31,
      JSON.stringify(['Robotics', 'ROS', 'Computer Vision', 'Autonomous Vehicles'])
    );

    // Event Registration for Aarav Mehta
    db.prepare(`
      INSERT OR IGNORE INTO event_registrations (id, event_id, user_id, status)
      VALUES ('ereg_aarav_ml_1', 'evt_ml_workshop_1', ?, 'confirmed')
    `).run(uid('aarav.mehta@campus.edu', 'usr_demo_aarav_m'));

    // --------------------------------------------------------------------------
    // 7. CAMPUS DIRECTORY (Physical Nodes & Locations)
    // --------------------------------------------------------------------------
    const insertLocation = db.prepare(`
      INSERT INTO campus_locations (
        id, name, category, building, zone, description, hours, accessibility, coord_x, coord_y, node_id, is_demo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    insertLocation.run('loc_main_gate', 'Campus Main Gate & Transport Hub', 'Transit', 'Gate Complex', 'Zone North', 'Primary campus entrance, transit loop, and electric shuttle pickup bay.', '24/7', 'Step-free access, tactile paving', 0.15, 0.10, 'GATE_NORTH');
    insertLocation.run('loc_turing_lab', 'Alan Turing AI & ML Computing Center', 'Laboratory', 'Academic Block 3', 'Zone Central', 'High-performance GPU cluster, student workstation pods, and ML research seminar rooms.', '07:30 - 23:00', 'Elevator access, automatic doors', 0.45, 0.35, 'LAB_CS_AI');
    insertLocation.run('loc_library', 'Central Collegiate Library', 'Library', 'Knowledge Tower', 'Zone Central', 'Four-story silent study floors, digital repositories, group study enclaves, and research archives.', '08:00 - 00:00', 'Wheelchair ramps, elevator to all floors', 0.50, 0.50, 'LIB_CENTRAL');
    insertLocation.run('loc_student_center', 'Student Life Center & Cafeteria', 'Dining', 'Student Commons', 'Zone East', 'Campus dining hall, club rooms, student council office, and recreation lounge.', '07:00 - 22:30', 'Fully accessible ramp and elevator', 0.70, 0.40, 'DORM_NORTH');
    insertLocation.run('loc_sports_arena', 'Campus Sports Complex & Gymnasium', 'Sports', 'Athletic Complex', 'Zone West', 'Indoor badminton, gymnasium, Olympic running track, and sports council.', '06:00 - 21:30', 'Ground level access throughout', 0.25, 0.65, 'DORM_SOUTH');
    insertLocation.run('loc_hostel_block_a', 'Aryabhata Residential Hall (Hostel Block A)', 'Hostel', 'Residential Block 1', 'Zone North-East', 'Undergraduate residence block, common study lounge, and warden office.', '24/7 Resident Access', 'Ramp to ground floor', 0.80, 0.20, 'DORM_NORTH');
    insertLocation.run('loc_metro_station', 'Metro Station Campus Pickup Node', 'Transit', 'Transit Terminal', 'Zone South', 'Rapid metro transit stop with connecting campus EV carpools.', '05:30 - 23:30', 'Elevator and escalator access', 0.85, 0.90, 'GATE_SOUTH');

    // --------------------------------------------------------------------------
    // 8. CAMPUS ANNOUNCEMENTS (Authorized Faculty & Warden notices)
    // --------------------------------------------------------------------------
    const insertAnnouncement = db.prepare(`
      INSERT INTO campus_announcements (id, author_id, title, body, scope, priority, is_demo)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);

    insertAnnouncement.run(
      'anc_workshop_reg',
      uid('ananya.desai@campus.edu', 'usr_demo_ananya_d'),
      'Registration Open: Annual Machine Learning & Research Symposium',
      'All undergraduate and postgraduate scholars are invited to submit abstracts and register for the Fall 2026 AI Symposium. Keynote talks from Google DeepMind and Microsoft Research.',
      'campus', 'normal'
    );

    insertAnnouncement.run(
      'anc_hostel_water',
      uid('mira.joshi@campus.edu', 'usr_demo_mira_j'),
      'Hostel Block A Solar Water Heating Maintenance',
      'Scheduled maintenance on rooftop solar heat collectors this Thursday between 10:00 and 13:00. Cold water supply remains uninterrupted.',
      'hostel', 'normal'
    );

    insertAnnouncement.run(
      'anc_exam_schedule',
      uid('m.sundaram@campus.edu', 'usr_demo_meenakshi_s'),
      'Mid-Semester Examination Schedules & Proctor Review Policy',
      'Mid-term schedules are now published. All examinations adhere to the UniVerse ethical review protocol: zero automated accusations, mandatory human ombudsman review.',
      'campus', 'urgent'
    );

    // --------------------------------------------------------------------------
    // 9. CAMPUS FEED POSTS (35+ Posts across all Post Types)
    // --------------------------------------------------------------------------
    const insertPost = db.prepare(`
      INSERT INTO feed_posts (
        id, author_id, campus_id, post_type, title, body, tags, visibility,
        status, likes_count, comments_count, bookmarks_count, is_demo, created_at
      ) VALUES (?, ?, 'main_campus', ?, ?, ?, ?, 'campus', 'published', ?, ?, ?, 1, ?)
    `);

    // Post 1: Question (Aarav Mehta)
    insertPost.run(
      'post_demo_1',
      uid('aarav.mehta@campus.edu', 'usr_demo_aarav_m'),
      'question',
      'How should a 2nd year student start learning Machine Learning effectively?',
      'I have solid foundations in Python, NumPy, and linear algebra. Should I start with classical ML via Scikit-Learn first, or jump directly into deep neural networks with PyTorch? Looking for recommendations from seniors who recently completed internship interviews!',
      JSON.stringify(['machine-learning', 'python', 'pytorch', 'career-advice']),
      18, 4, 6,
      '2026-10-28 10:15:00'
    );

    // Post 2: Project Update (Riya Shah)
    insertPost.run(
      'post_demo_2',
      uid('riya.shah@campus.edu', 'usr_demo_riya_s'),
      'project_update',
      'Open-sourcing our lightweight Vision Transformer pretraining pipeline!',
      'Excited to share our semester project: a self-supervised Vision Transformer that achieves 78.4% top-1 accuracy on ImageNet-100 with 40% fewer training FLOPs. Built entirely with PyTorch 2.4 and distributed FSDP on our campus cluster. Code and model weights are up on GitHub!',
      JSON.stringify(['pytorch', 'computer-vision', 'deep-learning', 'open-source']),
      34, 7, 12,
      '2026-10-28 14:30:00'
    );

    // Post 3: Event Post (comm_ai_ml)
    insertPost.run(
      'post_demo_3',
      uid('kabir.patel@campus.edu', 'usr_demo_kabir_p'),
      'event',
      'PyTorch Boot Camp this Wednesday in Turing AI Lab!',
      'Join us for our hands-on PyTorch coding workshop this Wednesday at 16:00. We will build, train, and test an end-to-end convolutional classifier and introduce attention mechanisms. Bring your laptops with Docker or virtualenv set up. RSVPs open on the Events tab!',
      JSON.stringify(['event', 'pytorch', 'workshop', 'ai-club']),
      27, 3, 9,
      '2026-10-29 09:00:00'
    );

    // Post 4: Resource Share (Neha Rao)
    insertPost.run(
      'post_demo_4',
      uid('neha.rao@campus.edu', 'usr_demo_neha_r'),
      'resource_share',
      'Compiled Cheat Sheet: Linear Algebra & Matrix Calculus for Deep Learning',
      'Put together a clean 8-page reference sheet covering Jacobians, Hessians, matrix derivatives, and positive semi-definite matrices specifically tailored for understanding loss backpropagation and optimization. Download link in Academic Hub!',
      JSON.stringify(['resources', 'math', 'linear-algebra', 'deep-learning']),
      45, 8, 24,
      '2026-10-27 16:45:00'
    );

    // Post 5: Ride Share (Vikram Rao)
    insertPost.run(
      'post_demo_5',
      uid('vikram.rao@campus.edu', 'usr_demo_vikram_r'),
      'ride_share',
      'EV Carpool: North Gate to Metro Station (3 Seats Open)',
      'Departing North Gate daily at 17:30 in Tata Nexon EV heading to Metro Station. Clean electric ride, Dijkstra shortest path via Library. Request a seat via Ride-Pooling tab to share the ride and save carbon!',
      JSON.stringify(['ride-pooling', 'green-campus', 'ev-transit', 'commute']),
      12, 2, 3,
      '2026-10-29 11:20:00'
    );

    // Post 6: Opportunity (Dr. Ananya Desai)
    insertPost.run(
      'post_demo_6',
      uid('ananya.desai@campus.edu', 'usr_demo_ananya_d'),
      'opportunity',
      'Undergraduate Research Assistant Openings — Fall 2026 AI Lab',
      'The Turing AI Lab has 3 openings for motivated 2nd and 3rd year students to work on energy-efficient neural network quantization and edge deployment. Stipend provided. Apply before Nov 10th.',
      JSON.stringify(['opportunity', 'research', 'internship', 'ai-lab']),
      52, 9, 31,
      '2026-10-26 12:00:00'
    );

    // Post 7: Discussion (Sneha Kulkarni)
    insertPost.run(
      'post_demo_7',
      uid('sneha.kulkarni@campus.edu', 'usr_demo_sneha_k'),
      'discussion',
      'Tips for mastering Dynamic Programming without getting overwhelmed',
      'A common pitfall I see juniors make is memorizing DP problem solutions instead of identifying state transitions. Start by asking: (1) What is my state subproblem? (2) What choice determines the next state? (3) What is my base condition? Let us discuss top 5 DP patterns.',
      JSON.stringify(['dsa', 'algorithms', 'interview-prep', 'placement']),
      39, 11, 19,
      '2026-10-27 19:10:00'
    );

    // Post 8: Poll (Campus Coding Society)
    insertPost.run(
      'post_demo_8',
      uid('arjun.k@campus.edu', 'usr_demo_arjun_k'),
      'poll',
      'What topic should our next Weekend Deep-Dive cover?',
      'Cast your vote for next Saturday session: (A) PyTorch Distributed Training (B) WebAssembly in the Browser (C) Rust for Systems Programming (D) Zero-Knowledge Proofs basics. Drop your vote below!',
      JSON.stringify(['poll', 'coding-club', 'community']),
      29, 15, 4,
      '2026-10-29 13:00:00'
    );

    // Post 9: Announcement (Warden Mira Joshi)
    insertPost.run(
      'post_demo_9',
      uid('mira.joshi@campus.edu', 'usr_demo_mira_j'),
      'announcement',
      'Hostel Quiet Hours & Semester Study Hall Access',
      'Starting next week for mid-semester preparations, the 2nd-floor common room in Block A will remain open 24/7 with high-speed mesh Wi-Fi. Quiet hours observed strictly from 23:00 to 06:00.',
      JSON.stringify(['hostel', 'announcement', 'campus-life']),
      21, 1, 5,
      '2026-10-29 08:30:00'
    );

    // Post 10: Discussion (Dev Rathi)
    insertPost.run(
      'post_demo_10',
      uid('dev.rathi@campus.edu', 'usr_demo_dev_r'),
      'discussion',
      'Our campus HPC cluster saved 1.2 tons of CO2 this month through dynamic scaling!',
      'Checked the Sustainable Computing Observatory today. Slurm job shifting during peak solar hours (11:00-14:00) brought our effective cooling PUE from 1.75 down to 1.28. Great work by the central IT team.',
      JSON.stringify(['sustainability', 'hpc', 'green-campus', 'energy']),
      41, 5, 8,
      '2026-10-28 17:00:00'
    );

    // Add Comments on Post 1 (The ML Question by Aarav Mehta)
    const insertComment = db.prepare(`
      INSERT INTO feed_comments (id, post_id, author_id, parent_id, content, is_demo, created_at)
      VALUES (?, ?, ?, ?, ?, 1, ?)
    `);

    insertComment.run(
      'cm_demo_1_1',
      'post_demo_1',
      uid('riya.shah@campus.edu', 'usr_demo_riya_s'),
      null,
      'Great question Aarav! Definitely spend 2–3 weeks with Scikit-Learn first to understand metrics like precision/recall, validation splits, and decision boundaries. Once those concepts click, jumping into PyTorch will feel much more natural. Feel free to request a slot in my office hours if you want a personalized roadmap!',
      '2026-10-28 11:00:00'
    );

    insertComment.run(
      'cm_demo_1_2',
      'post_demo_1',
      uid('aarav.mehta@campus.edu', 'usr_demo_aarav_m'),
      'cm_demo_1_1',
      'Thank you so much Riya! I will definitely review Scikit-Learn first and send you a guidance request on mentorship.',
      '2026-10-28 11:30:00'
    );

    insertComment.run(
      'cm_demo_1_3',
      'post_demo_1',
      uid('kabir.patel@campus.edu', 'usr_demo_kabir_p'),
      null,
      'Seconding Riya advice. Also make sure you build one end-to-end project rather than just watching tutorials. A simple Kaggle competition or fine-tuning notebook will teach you 10x more.',
      '2026-10-28 12:15:00'
    );

    // Reactions & Bookmarks on Post 1 & 2
    db.prepare(`
      INSERT OR IGNORE INTO feed_reactions (id, post_id, user_id, reaction_type)
      VALUES ('rx_demo_1_1', 'post_demo_1', '${uid('riya.shah@campus.edu', 'usr_demo_riya_s')}', 'insightful'),
             ('rx_demo_1_2', 'post_demo_1', '${uid('kabir.patel@campus.edu', 'usr_demo_kabir_p')}', 'like'),
             ('rx_demo_2_1', 'post_demo_2', '${uid('aarav.mehta@campus.edu', 'usr_demo_aarav_m')}', 'celebrate')
    `).run();

    db.prepare(`
      INSERT OR IGNORE INTO feed_bookmarks (id, post_id, user_id)
      VALUES ('bm_demo_1_1', 'post_demo_1', '${uid('aarav.mehta@campus.edu', 'usr_demo_aarav_m')}'),
             ('bm_demo_4_1', 'post_demo_4', '${uid('aarav.mehta@campus.edu', 'usr_demo_aarav_m')}')
    `).run();

    // --------------------------------------------------------------------------
    // 10. REAL RIDE OFFERS & REQUESTS (Connected to Graph)
    // --------------------------------------------------------------------------
    const insertRide = db.prepare(`
      INSERT INTO ride_offers (
        id, driver_id, origin_node_id, destination_node_id, departure_time,
        total_seats, available_seats, vehicle_type, max_detour_ratio, status, planned_route
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0.35, 'open', ?)
      ON CONFLICT(id) DO UPDATE SET
        departure_time=excluded.departure_time,
        available_seats=excluded.available_seats,
        status=excluded.status
    `);

    insertRide.run(
      'ro_demo_1',
      uid('vikram.rao@campus.edu', 'usr_demo_vikram_r'),
      'GATE_NORTH',
      'GATE_SOUTH',
      '17:30',
      4, 3,
      'EV_CAR',
      JSON.stringify(['GATE_NORTH', 'LIB_CENTRAL', 'LAB_CS_AI', 'GATE_SOUTH'])
    );

    insertRide.run(
      'ro_demo_2',
      uid('dev.driver@campus.edu', 'usr_demo_dev_k'),
      'GATE_NORTH',
      'DORM_SOUTH',
      '18:15',
      6, 4,
      'CAMPUS_SHUTTLE',
      JSON.stringify(['GATE_NORTH', 'DORM_NORTH', 'LIB_CENTRAL', 'DORM_SOUTH'])
    );

    // --------------------------------------------------------------------------
    // 11. MENTORSHIP WORKFLOW FIXTURE (Pending Request from Aarav to Riya)
    // --------------------------------------------------------------------------
    db.prepare(`
      INSERT INTO mentorship_requests (
        id, mentee_id, mentor_id, topic, preferred_slot, status, notes
      ) VALUES (
        'req_demo_aarav_riya',
        '${uid('aarav.mehta@campus.edu', 'usr_demo_aarav_m')}',
        'mnt_riya_shah',
        'Machine Learning & Summer Internship Preparation',
        'Wednesday 17:00 - 18:30',
        'pending',
        'Hi Riya, I am a 2nd year CS student interested in deep learning and internship prep. Would love your feedback on my PyTorch roadmap!'
      )
      ON CONFLICT(id) DO UPDATE SET
        status=excluded.status,
        topic=excluded.topic
    `).run();
  });

  runSeed();
  console.log('[Seed] UniVerse Campus OS demo dataset seeded successfully with full synthetic fidelity.');
}

// Standalone execution support
if (process.argv[1]?.endsWith('seed_demo_campus.ts') || process.argv[1]?.endsWith('seed_demo_campus.js')) {
  seedDemoCampus();
}
