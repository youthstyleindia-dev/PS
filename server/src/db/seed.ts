import { getDb, initDb } from './connection.js';

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
    // 1. CLEAR EXISTING DATA (Clean Slate)
    // --------------------------------------------------------------------------
    db.exec(`
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
    // 2. USERS (Students, Drivers, Proctors, Admin)
    // --------------------------------------------------------------------------
    const insertUser = db.prepare(`
      INSERT INTO users (id, name, email, avatar, role, department, year_of_study, bio)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertUser.run('usr_student_1', 'Aarav Sharma', 'aarav.sharma@campus.edu', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aarav', 'student', 'Computer Science & Engineering', 4, 'Junior CS undergrad focusing on distributed systems and high-throughput backend architecture.');
    insertUser.run('usr_student_2', 'Diya Patel', 'diya.patel@campus.edu', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Diya', 'student', 'Computer Science & Engineering', 4, 'Final-year student, incoming SDE at Microsoft Cloud. Peer mentor in systems and Kubernetes.');
    insertUser.run('usr_student_3', 'Rohan Verma', 'rohan.verma@campus.edu', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rohan', 'student', 'Information Technology', 2, 'Sophomore learning data structures and operating systems.');
    insertUser.run('usr_student_4', 'Sneha Kulkarni', 'sneha.kulkarni@campus.edu', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sneha', 'student', 'Computer Science & Engineering', 4, 'Incoming SDE at Google. Competitive programmer (Codeforces Candidate Master).');
    
    insertUser.run('usr_driver_1', 'Vikram Rao', 'vikram.rao@campus.edu', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram', 'driver', 'Mechanical Engineering', 4, 'Daily campus EV commuter (Tata Nexon EV). Happy to offer shared rides from North Gate.');
    insertUser.run('usr_driver_2', 'Ananya Iyer', 'ananya.iyer@campus.edu', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ananya', 'driver', 'Campus Transit Operations', null, 'Campus Electric Shuttle Operator on Academic-Hostel circular loops.');

    insertUser.run('usr_proctor_1', 'Dr. Meenakshi Sundaram', 'm.sundaram@campus.edu', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Meenakshi', 'proctor', 'Computer Science & Engineering', null, 'Professor & Exam Review Chair. Focus on academic integrity and non-punitive proctoring.');
    insertUser.run('usr_proctor_2', 'Prof. Rajesh Nair', 'rajesh.nair@campus.edu', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rajesh', 'proctor', 'Electronics & Comm. Engg', null, 'Associate Dean of Examinations and Chief Invigilator.');

    insertUser.run('usr_admin_1', 'Campus IT Operations', 'admin@campus.edu', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin', 'admin', 'Campus Central IT', null, 'UniVerse Campus Operating System Administrator.');

    // --------------------------------------------------------------------------
    // 3. MODULE A: STUDENT PROFILES & PLACEMENT MILESTONES
    // --------------------------------------------------------------------------
    const insertProfile = db.prepare(`
      INSERT INTO student_profiles (user_id, skills, interests, target_role, target_company, placement_goals, readiness_score, resume_url, gpa)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertProfile.run(
      'usr_student_1',
      JSON.stringify(['React', 'TypeScript', 'Node.js', 'Express', 'SQLite', 'Python', 'Dijkstra', 'Docker']),
      JSON.stringify(['Distributed Systems', 'Cloud Infrastructure', 'Graph Algorithms', 'Sustainable Tech']),
      'Full Stack Software Engineer',
      'Google',
      'Crack Tier-1 Product Company campus placement. Master medium/hard graph & tree problems by Q3.',
      78,
      'https://campus.edu/resumes/aarav_sharma_2026.pdf',
      8.85
    );

    insertProfile.run(
      'usr_student_2',
      JSON.stringify(['Go', 'Distributed Systems', 'Kubernetes', 'Microservices', 'gRPC', 'System Design']),
      JSON.stringify(['Cloud Native Computing', 'Observability', 'Linux Kernels']),
      'Cloud Infrastructure Engineer',
      'Microsoft',
      'Completed all placement rounds. Preparing to onboard as Azure Core Engineer.',
      96,
      'https://campus.edu/resumes/diya_patel_2025.pdf',
      9.42
    );

    insertProfile.run(
      'usr_student_3',
      JSON.stringify(['C++', 'Java', 'Data Structures', 'Algorithms', 'SQL']),
      JSON.stringify(['Web Development', 'App Development']),
      'Software Development Engineer Intern',
      'Amazon',
      'Secure summer 2027 internship. Complete 200 LeetCode problems.',
      48,
      'https://campus.edu/resumes/rohan_verma_2027.pdf',
      8.15
    );

    insertProfile.run(
      'usr_student_4',
      JSON.stringify(['C++', 'Python', 'Competitive Programming', 'Graph Theory', 'Dynamic Programming', 'AI/ML']),
      JSON.stringify(['Algorithms Research', 'Large Language Models']),
      'Research & Systems Engineer',
      'Google',
      'Accepted SDE offer. Mentoring junior students in graph theory and dynamic programming.',
      98,
      'https://campus.edu/resumes/sneha_kulkarni_2025.pdf',
      9.78
    );

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
    // 4. MODULE A: PEER MENTORS & REQUESTS
    // --------------------------------------------------------------------------
    const insertMentor = db.prepare(`
      INSERT INTO mentors (id, user_id, company_offer, domain, skills, available_slots, max_mentees, active_mentees, rating, review_count, bio)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertMentor.run(
      'men_1',
      'usr_student_2',
      'Microsoft SDE',
      'Cloud & Distributed Systems',
      JSON.stringify(['Distributed Systems', 'Go', 'Docker', 'Kubernetes', 'System Design']),
      JSON.stringify(['Tue 4:00 PM', 'Thu 6:00 PM', 'Sat 11:00 AM']),
      5,
      2,
      4.92,
      18,
      'Helped 15+ students crack Tier-1 cloud infrastructure and systems engineering interviews.'
    );

    insertMentor.run(
      'men_2',
      'usr_student_4',
      'Google SDE',
      'Algorithms & Competitive Programming',
      JSON.stringify(['DSA', 'C++', 'Dynamic Programming', 'Graph Theory', 'Segment Trees']),
      JSON.stringify(['Mon 5:00 PM', 'Wed 5:00 PM', 'Sun 10:00 AM']),
      6,
      3,
      4.96,
      27,
      'Specializing in rigorous LeetCode Hard and Google OA problem walkthroughs.'
    );

    insertMentor.run(
      'men_3',
      'usr_driver_1',
      'Amazon SDE',
      'Full Stack & Microservices',
      JSON.stringify(['React', 'Node.js', 'AWS', 'System Design', 'TypeScript']),
      JSON.stringify(['Fri 3:00 PM', 'Sat 2:00 PM']),
      4,
      1,
      4.85,
      14,
      'Focusing on portfolio architecture, fullstack project reviews, and AWS deployments.'
    );

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
      'men_3',
      'Full Stack Project Architecture & Production Readiness',
      'Need advice on optimizing Express API response times and SQLite index layout.',
      'Fri 3:00 PM',
      'completed',
      'Solid architecture demonstrated! Advised adding WAL mode and query response caching.'
    );

    // --------------------------------------------------------------------------
    // 5. MODULE A: ACADEMIC RESOURCES & RATINGS
    // --------------------------------------------------------------------------
    const insertResource = db.prepare(`
      INSERT INTO academic_resources (id, title, course_code, course_name, category, semester, department, file_url, file_type, file_size_kb, uploader_id, downloads_count, rating, rating_count, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // CS301 DSA
    insertResource.run('res_1', 'CS301: Graph Algorithms & Dynamic Programming Comprehensive Guide', 'CS301', 'Data Structures & Algorithms', 'Notes', 5, 'Computer Science', 'https://campus.edu/resources/cs301_graph_dp.pdf', 'pdf', 2450, 'usr_student_2', 184, 4.90, 32, JSON.stringify(['Graphs', 'Dijkstra', 'DP', 'ShortestPath', 'LeetCode']));
    insertResource.run('res_2', 'CS301: End-Semester Exam Paper 2024 (with Detailed Solutions)', 'CS301', 'Data Structures & Algorithms', 'PYQ', 5, 'Computer Science', 'https://campus.edu/resources/cs301_pyq_2024.pdf', 'pdf', 1820, 'usr_student_1', 342, 4.85, 48, JSON.stringify(['PYQ', 'Solutions', 'EndSem', '2024']));
    insertResource.run('res_3', 'CS301: Quick Reference Cheatsheet — Asymptotic Notations & Data Structures', 'CS301', 'Data Structures & Algorithms', 'Cheatsheet', 5, 'Computer Science', 'https://campus.edu/resources/cs301_cheatsheet.pdf', 'pdf', 850, 'usr_student_4', 115, 4.70, 19, JSON.stringify(['Cheatsheet', 'Complexity', 'BigO', 'Heaps']));

    // CS302 OS
    insertResource.run('res_4', 'CS302: Virtual Memory, Paging & Page Replacement Illustrated', 'CS302', 'Operating Systems', 'Guide', 5, 'Computer Science', 'https://campus.edu/resources/cs302_virtual_memory.pdf', 'pdf', 3120, 'usr_student_2', 156, 4.88, 25, JSON.stringify(['VirtualMemory', 'LRU', 'Paging', 'Deadlocks']));
    insertResource.run('res_5', 'CS302: Operating Systems Mid-Sem & End-Sem PYQs (2022–2024)', 'CS302', 'Operating Systems', 'PYQ', 5, 'Computer Science', 'https://campus.edu/resources/cs302_pyq_bundle.pdf', 'pdf', 2740, 'usr_student_3', 290, 4.65, 38, JSON.stringify(['PYQ', 'Semaphores', 'Synchronization', 'Processes']));

    // CS303 Networks
    insertResource.run('res_6', 'CS303: TCP/IP vs OSI Protocol Stack & Flow Control Deep Dive', 'CS303', 'Computer Networks', 'Notes', 6, 'Computer Science', 'https://campus.edu/resources/cs303_tcp_osi.pdf', 'pdf', 2210, 'usr_student_1', 198, 4.78, 29, JSON.stringify(['TCP', 'UDP', 'CongestionControl', 'OSI', 'Routing']));
    insertResource.run('res_7', 'CS303: Linux Socket Programming in C & Python Lab Guide', 'CS303', 'Computer Networks', 'Guide', 6, 'Computer Science', 'https://campus.edu/resources/cs303_socket_lab.pdf', 'pdf', 1640, 'usr_student_4', 112, 4.92, 16, JSON.stringify(['Sockets', 'Hands-on', 'ClientServer', 'LabManual']));

    // CS304 AI
    insertResource.run('res_8', 'CS304: Heuristic Search, A* & Adversarial Minimax with Alpha-Beta', 'CS304', 'Artificial Intelligence', 'Notes', 6, 'Computer Science', 'https://campus.edu/resources/cs304_search_minimax.pdf', 'pdf', 2980, 'usr_student_2', 210, 4.82, 34, JSON.stringify(['A-Star', 'Heuristics', 'Minimax', 'AlphaBeta', 'Search']));
    insertResource.run('res_9', 'CS304: Artificial Intelligence Final Exam Past Papers & Model Answers', 'CS304', 'Artificial Intelligence', 'PYQ', 6, 'Computer Science', 'https://campus.edu/resources/cs304_pyq_solutions.pdf', 'pdf', 2310, 'usr_student_1', 275, 4.72, 41, JSON.stringify(['PYQ', 'BayesNet', 'Inference', 'MachineLearning']));

    // Resource ratings fixtures
    const insertRating = db.prepare(`
      INSERT INTO resource_ratings (id, resource_id, user_id, rating)
      VALUES (?, ?, ?, ?)
    `);
    insertRating.run('rat_1', 'res_1', 'usr_student_1', 5);
    insertRating.run('rat_2', 'res_2', 'usr_student_2', 5);
    insertRating.run('rat_3', 'res_3', 'usr_student_1', 4);

    // --------------------------------------------------------------------------
    // 6. MODULE B: CAMPUS TOPOLOGY GRAPH (10 Nodes & 22 Road Edges)
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
    // 7. MODULE B: RIDE OFFERS, REQUESTS & MATCHES
    // --------------------------------------------------------------------------
    const insertOffer = db.prepare(`
      INSERT INTO ride_offers (id, driver_id, origin_node_id, destination_node_id, departure_time, total_seats, available_seats, vehicle_type, max_detour_ratio, status, planned_route)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertOffer.run(
      'offer_1',
      'usr_driver_1',
      'GATE_NORTH',
      'GATE_SOUTH',
      '2026-10-30 08:30:00',
      4,
      2,
      'EV_CAR',
      0.35,
      'matched',
      JSON.stringify(['GATE_NORTH', 'DORM_NORTH', 'ACAD_QUAD', 'STUDENT_CTR', 'GATE_SOUTH'])
    );

    insertOffer.run(
      'offer_2',
      'usr_driver_2',
      'DORM_NORTH',
      'LAB_CS_AI',
      '2026-10-30 09:00:00',
      6,
      5,
      'CAMPUS_SHUTTLE',
      0.25,
      'open',
      JSON.stringify(['DORM_NORTH', 'LIB_CENTRAL', 'LAB_CS_AI'])
    );

    const insertRequest = db.prepare(`
      INSERT INTO ride_requests (id, passenger_id, origin_node_id, destination_node_id, desired_departure_time, seats_needed, max_detour_ratio, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertRequest.run(
      'req_1',
      'usr_student_1',
      'DORM_NORTH',
      'STUDENT_CTR',
      '2026-10-30 08:35:00',
      1,
      0.35,
      'matched'
    );

    insertRequest.run(
      'req_2',
      'usr_student_3',
      'GATE_NORTH',
      'LAB_CS_AI',
      '2026-10-30 09:15:00',
      1,
      0.40,
      'pending'
    );

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

    // --------------------------------------------------------------------------
    // 8. MODULE C: SUSTAINABLE COMPUTING WORKLOADS & SCENARIOS
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
    // 9. MODULE D: DIGITAL WELLBEING (Rules, Focus Sessions, Aggregates)
    // --------------------------------------------------------------------------
    const insertRule = db.prepare(`
      INSERT INTO domain_rules (id, user_id, domain_pattern, category, is_custom)
      VALUES (?, ?, ?, ?, ?)
    `);

    // Global default rules (user_id = null)
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
    insertRule.run('rule_12', null, 'google.com', 'Neutral', 0);
    insertRule.run('rule_13', null, 'duckduckgo.com', 'Neutral', 0);
    insertRule.run('rule_14', null, 'canvas.lms', 'Neutral', 0);
    insertRule.run('rule_15', null, 'wikipedia.org', 'Neutral', 0);

    const insertSession = db.prepare(`
      INSERT INTO focus_sessions (id, user_id, start_time, end_time, target_duration_mins, actual_duration_mins, status, goal, deep_work_index, active_focus_ratio, context_switch_rate, productive_time_secs, distracting_time_secs, neutral_time_secs, total_switches)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertSession.run(
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

    const insertBrowsing = db.prepare(`
      INSERT INTO browsing_events (id, session_id, sanitized_domain, category, duration_seconds, context_switch, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertBrowsing.run('be_1', 'foc_1', 'leetcode.com', 'Productive', 1200, 0, '2026-10-29 09:00:00');
    insertBrowsing.run('be_2', 'foc_1', 'github.com', 'Productive', 600, 0, '2026-10-29 09:20:00');
    insertBrowsing.run('be_3', 'foc_1', 'youtube.com', 'Distracting', 180, 1, '2026-10-29 09:30:00');
    insertBrowsing.run('be_4', 'foc_1', 'stackoverflow.com', 'Productive', 576, 1, '2026-10-29 09:33:00');
    insertBrowsing.run('be_5', 'foc_1', 'google.com', 'Neutral', 144, 1, '2026-10-29 09:42:36');

    const insertCohort = db.prepare(`
      INSERT INTO cohort_aggregates (id, department, date, participant_count, is_suppressed, raw_avg_focus_mins, dp_noisy_avg_focus_mins, raw_avg_dwi, dp_noisy_avg_dwi, epsilon_used)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertCohort.run('coh_1', 'Computer Science & Engineering', '2026-10-29', 28, 0, 42.5, 43.1, 79.4, 78.8, 0.80);
    insertCohort.run('coh_2', 'Aerospace Engineering (Special Seminar)', '2026-10-29', 3, 1, null, null, null, null, 0.80); // Suppressed (k < 5)

    // --------------------------------------------------------------------------
    // 10. MODULE E: RESPONSIBLE EXAMINATION MONITORING & PROCTOR AUDIT
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

    insertObservation.run(
      'obs_3',
      'exam_1',
      '2026-10-29 10:45:00',
      2700.0,
      'ABSENCE_FROM_SEAT',
      0.96,
      'https://campus.edu/exam_frames/obs_3.jpg',
      'SIMULATED_EVENT',
      JSON.stringify({ personCount: 0, durationSec: 6.2 }),
      'PENDING_REVIEW',
      null,
      null,
      null
    );

    insertObservation.run(
      'obs_4',
      'exam_1',
      '2026-10-29 10:55:10',
      3310.0,
      'GAZE_AWAY',
      0.72,
      'https://campus.edu/exam_frames/obs_4.jpg',
      'ESTIMATED_METRIC',
      JSON.stringify({ pitch: -28.0, aggregateGlanceScore: 0.68 }),
      'DISMISS_FALSE_POSITIVE',
      'Candidate looking down at permitted physical rough scratch paper for calculations.',
      'usr_proctor_2',
      '2026-10-29 10:58:00'
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

    insertAudit.run(
      'aud_2',
      'obs_4',
      'exam_1',
      'usr_proctor_2',
      'PENDING_REVIEW',
      'DISMISS_FALSE_POSITIVE',
      'DISMISS_FALSE_POSITIVE',
      'PERMITTED_PHYSICAL_MATERIAL',
      'Candidate looking down at permitted physical rough scratch paper for calculations.',
      '2026-10-29 10:58:00'
    );

    // --------------------------------------------------------------------------
    // 11. SHARED NOTIFICATIONS & ACTIVITY LOG
    // --------------------------------------------------------------------------
    const insertNotif = db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, module, type, is_read, link_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertNotif.run('notif_1', 'usr_student_1', 'Mentorship Request Accepted', 'Diya Patel accepted your request for System Design Mock on Sat 11:00 AM.', 'hub', 'success', 0, '/hub');
    insertNotif.run('notif_2', 'usr_student_1', 'Ride Match Confirmed', 'You were matched with Vikram Rao for your ride to Central Dining. Departure at 08:35 AM.', 'rides', 'info', 0, '/rides');
    insertNotif.run('notif_3', 'usr_student_1', 'Focus Milestone Reached', 'Congratulations! You achieved a Deep Work Index of 84.5 during your 45-minute focus session.', 'wellbeing', 'success', 1, '/wellbeing');
    insertNotif.run('notif_4', 'usr_proctor_1', 'Exam Incident Pending Triage', '1 unreviewed head-pose deviation flag in CS301 Comprehensive Final.', 'exams', 'alert', 0, '/exams');

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
