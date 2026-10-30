# UniVerse — Canonical Demo Data & Personas Reference

This document catalogs the deterministic demonstration data seeded into `server/data/universe.db` via `npm run seed` (or `scripts/seed-demo`).

## 1. Persona Accounts & Role Credentials

All persona accounts share the default development password:
`CampusPass123!`

| Persona Name | Primary Role | Assigned Roles | Email | Department / Details |
|---|---|---|---|---|
| **Aarav Sharma** | `student` | `['student']` | `aarav.sharma@campus.edu` | Computer Science & Engineering (Year 4). Focus: Distributed Systems & DSA. |
| **Diya Patel** | `student` / `mentor` | `['student', 'mentor']` | `diya.patel@campus.edu` | Senior Scholar & ML/AI Mentor (Incoming Google Brain / AI Resident). |
| **Kabir Mehta** | `student` / `mentor` | `['student', 'mentor']` | `kabir.mehta@campus.edu` | Senior Scholar & PyTorch / Deep Learning Mentor. |
| **Vikram Rao** | `driver` | `['driver']` | `vikram.rao@campus.edu` | Campus Transit Operator. Vehicle: Tata Nexon EV (Zero Direct Emissions). |
| **Dr. Meenakshi Sundaram** | `proctor` | `['proctor']` | `m.sundaram@campus.edu` | Examination Tribunal Chair. Double-blind incident reviewer. |
| **Dr. Priya Patel** | `ta_faculty` | `['ta_faculty']` | `dr.patel@campus.edu` | Academic Faculty, Graduate Advisor, Course Coordinator for CS401. |
| **Campus Residential Warden** | `warden` | `['warden']` | `warden@campus.edu` | Hostel & Facilities Superintendent (Block A-D & Facilities Triage). |
| **Campus IT Operations** | `admin` | `['admin']` | `admin@campus.edu` | Root System Administrator. Full audit log and RBAC oversight. |

---

## 2. Senior Mentorship Network (10 Mentors)

All mentors have an approved status (`is_approved = 1`) and verified company placement offers.

1. **Diya Patel (`usr_student_2`)** — Google AI Resident (`men_1`). Domain: Machine Learning & NLP. Skills: `['PyTorch', 'Transformers', 'CUDA', 'Python', 'MLOps']`.
2. **Kabir Mehta (`usr_student_5`)** — Meta AI Research (`men_2`). Domain: Computer Vision & Deep Learning. Skills: `['PyTorch', 'TensorFlow', 'OpenCV', 'CNNs', 'Diffusion Models']`.
3. **Ananya Iyer (`usr_student_6`)** — Microsoft Research (`men_3`). Domain: Natural Language Processing. Skills: `['Transformers', 'LLMs', 'Fine-tuning', 'HuggingFace', 'Python']`.
4. **Rohan Deshmukh (`usr_student_7`)** — DeepMind Fellow (`men_4`). Domain: Reinforcement Learning. Skills: `['PyTorch', 'Gymnasium', 'Deep RL', 'Algorithms', 'Mathematics']`.
5. **Nisha Sharma (`usr_student_8`)** — Apple Core OS (`men_5`). Domain: Distributed Systems & Cloud. Skills: `['Go', 'Kubernetes', 'gRPC', 'Distributed Systems', 'Docker']`.
6. **Aditya Sen (`usr_student_9`)** — Amazon AWS (`men_6`). Domain: Backend Systems & Scale. Skills: `['Java', 'Spring Boot', 'AWS DynamoDB', 'Microservices', 'System Design']`.
7. **Pooja Hegde (`usr_student_10`)** — Stripe Infrastructure (`men_7`). Domain: High-Reliability FinTech. Skills: `['TypeScript', 'PostgreSQL', 'Redis', 'Event-Driven Architecture']`.
8. **Rahul Nair (`usr_student_11`)** — Cloudflare Systems (`men_8`). Domain: Network Protocols & Edge. Skills: `['Rust', 'WebAssembly', 'Linux Kernel', 'Computer Networks']`.
9. **Sneha Mukherjee (`usr_student_12`)** — Databricks Core (`men_9`). Domain: Big Data Engineering. Skills: `['Apache Spark', 'Python', 'Delta Lake', 'Data Pipelines']`.
10. **Arjun Kulkarni (`usr_student_13`)** — Qualcomm Embedded (`men_10`). Domain: Low-Level Architecture. Skills: `['C++', 'ARM Assembly', 'Operating Systems', 'Compilers']`.

---

## 3. Campus Topological Network (10 Nodes, 22 Directed Artery Edges)

The campus mobility mesh uses real topological nodes for Dijkstra shortest-path calculations:

| Node ID | Landmark Name | Zone Type | Coordinates (X, Y) |
|---|---|---|---|
| `GATE_NORTH` | North Main Gate | TRANSIT | (200, 100) |
| `DORM_NORTH` | North Dormitories | RESIDENTIAL | (350, 200) |
| `LIB_CENTRAL` | Central Library | ACADEMIC | (650, 250) |
| `LAB_CS_AI` | Turing CS & AI Labs | RESEARCH | (750, 450) |
| `ACAD_QUAD` | Academic Quadrangle | ACADEMIC | (500, 500) |
| `INNOVATION_PARK` | Research & Innovation Park | RESEARCH | (250, 550) |
| `SPORTS_CMPLX` | Athletics & Gymnasium Complex | ATHLETICS | (200, 850) |
| `STUDENT_CTR` | Student Union & Dining | COMMONS | (450, 700) |
| `DORM_SOUTH` | South Residential Towers | RESIDENTIAL | (700, 750) |
| `GATE_SOUTH` | South Highway Interchange | TRANSIT | (800, 900) |

---

## 4. Campus Communities & Events

### Communities:
- **AI & Machine Learning Guild (`ai-ml-guild`)**: Research group studying state-of-the-art architectures.
- **Systems & Open Source Society (`systems-oss`)**: Low-level kernel hacking, Rust, and distributed consensus.
- **Competitive Programming Club (`algo-coders`)**: DSA algorithms, LeetCode Hard, and Olympiad prep.
- **Full-Stack & Cloud Engineers (`cloud-builders`)**: Microservices, Docker, Kubernetes, and UI design.
- **Cybersecurity & Ethical Hacking (`cyber-defense`)**: Web security, reverse engineering, and CTF challenges.
- **Robotics & Embedded Hardware (`robotics-iot`)**: ROS, autonomous rovers, and sensor arrays.

### Canonical Events:
- **ACM Hackathon: Scalable AI & Systems**: 48-hour collegiate engineering hackathon.
- **Distributed Consensus & Paxos Deep Dive**: Systems guild weekly architecture seminar.
- **Placement Sprint: Mock Technical Interviews**: Senior mentors evaluating junior scholars.
- **Slurm HPC & Green Computing Summit**: Computational sustainability workshop.
