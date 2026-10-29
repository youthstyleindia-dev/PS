import { request } from './api';
import {
  StudentProfile,
  PlacementMilestone,
  PeerMentor,
  MentorshipRequest,
  AcademicResource
} from '../types';

// Deterministic seed fallbacks matching SQLite data
const MOCK_PROFILE: StudentProfile = {
  id: 'sp_usr_student_1',
  userId: 'usr_student_1',
  user: {
    id: 'usr_student_1',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@campus.edu',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aarav',
    role: 'student',
    department: 'Computer Science & Engineering',
    yearOfStudy: 4,
    bio: 'Junior CS undergrad focusing on distributed systems and high-throughput backend architecture.'
  },
  name: 'Aarav Sharma',
  email: 'aarav.sharma@campus.edu',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aarav',
  department: 'Computer Science & Engineering',
  yearOfStudy: 4,
  bio: 'Junior CS undergrad focusing on distributed systems and high-throughput backend architecture.',
  skills: [
    { name: 'Data Structures & Algorithms', proficiency: 'advanced', category: 'Problem Solving' },
    { name: 'System Design & Scalability', proficiency: 'intermediate', category: 'Architecture' },
    { name: 'React 19 & TypeScript', proficiency: 'advanced', category: 'FullStack' },
    { name: 'Node.js & Express', proficiency: 'advanced', category: 'Backend' },
    { name: 'SQLite & Relational DBs', proficiency: 'advanced', category: 'Database' },
    { name: 'Graph Theory & Dijkstra', proficiency: 'advanced', category: 'Algorithms' },
    { name: 'Docker & Microservices', proficiency: 'intermediate', category: 'Cloud' }
  ],
  interests: ['Distributed Systems', 'Cloud Infrastructure', 'Graph Algorithms', 'Sustainable Tech'],
  targetRole: 'Full Stack Software Engineer',
  placementGoals: ['Crack Tier-1 Product Company campus placement. Master medium/hard graph & tree problems by Q3.'],
  readinessScore: 81,
  gpa: 8.85,
  resumeUrl: 'https://campus.edu/resumes/aarav_sharma_2026.pdf'
};

const MOCK_MILESTONES: PlacementMilestone[] = [
  { id: 'ms_1', studentId: 'usr_student_1', title: 'Master Graph Algorithms (Dijkstra, BFS/DFS, TopoSort)', category: 'DSA', completed: true },
  { id: 'ms_2', studentId: 'usr_student_1', title: 'Solve 150 LeetCode Medium/Hard Questions', category: 'DSA', completed: true },
  { id: 'ms_3', studentId: 'usr_student_1', title: 'Design Scalable Rate Limiter & URL Shortener', category: 'SystemDesign', completed: false },
  { id: 'ms_4', studentId: 'usr_student_1', title: 'Study Microservices & Event-Driven Architecture (Kafka/RabbitMQ)', category: 'SystemDesign', completed: false },
  { id: 'ms_5', studentId: 'usr_student_1', title: 'Resume Review & ATS Optimization with Senior Mentor', category: 'Resume', completed: true },
  { id: 'ms_6', studentId: 'usr_student_1', title: 'Complete 3 Mock Technical Interviews', category: 'MockInterview', completed: false },
  { id: 'ms_7', studentId: 'usr_student_1', title: 'STAR Method Behavioral Question Presentation', category: 'SoftSkills', completed: true },
  { id: 'ms_8', studentId: 'usr_student_1', title: 'Campus Placement Aptitude & Speed Math Drills', category: 'SoftSkills', completed: true }
];

const MOCK_MENTORS: PeerMentor[] = [
  {
    id: 'men_1',
    userId: 'usr_student_2',
    user: {
      id: 'usr_student_2',
      name: 'Diya Patel',
      email: 'diya.patel@campus.edu',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Diya',
      role: 'student',
      department: 'Computer Science & Engineering',
      yearOfStudy: 4,
      bio: 'Final-year student, incoming SDE at Microsoft Cloud. Peer mentor in systems and Kubernetes.'
    },
    name: 'Diya Patel',
    email: 'diya.patel@campus.edu',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Diya',
    department: 'Computer Science & Engineering',
    companyOffer: 'Microsoft SDE',
    roleTitle: 'Cloud & Distributed Systems',
    domain: 'Cloud & Distributed Systems',
    skills: ['Distributed Systems', 'Go', 'Docker', 'Kubernetes', 'System Design'],
    availableSlots: ['Tue 4:00 PM', 'Thu 6:00 PM', 'Sat 11:00 AM'],
    maxMentees: 5,
    activeMenteeCount: 2,
    isAvailable: true,
    rating: 4.92,
    reviewCount: 18,
    bio: 'Helped 15+ students crack Tier-1 cloud infrastructure and systems engineering interviews.'
  },
  {
    id: 'men_2',
    userId: 'usr_student_4',
    user: {
      id: 'usr_student_4',
      name: 'Sneha Kulkarni',
      email: 'sneha.kulkarni@campus.edu',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sneha',
      role: 'student',
      department: 'Computer Science & Engineering',
      yearOfStudy: 4,
      bio: 'Incoming SDE at Google. Competitive programmer (Codeforces Candidate Master).'
    },
    name: 'Sneha Kulkarni',
    email: 'sneha.kulkarni@campus.edu',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sneha',
    department: 'Computer Science & Engineering',
    companyOffer: 'Google SDE',
    roleTitle: 'Algorithms & Competitive Programming',
    domain: 'Algorithms & Competitive Programming',
    skills: ['DSA', 'C++', 'Dynamic Programming', 'Graph Theory', 'Segment Trees'],
    availableSlots: ['Mon 5:00 PM', 'Wed 5:00 PM', 'Sun 10:00 AM'],
    maxMentees: 6,
    activeMenteeCount: 3,
    isAvailable: true,
    rating: 4.96,
    reviewCount: 27,
    bio: 'Specializing in rigorous LeetCode Hard and Google OA problem walkthroughs.'
  },
  {
    id: 'men_3',
    userId: 'usr_driver_1',
    user: {
      id: 'usr_driver_1',
      name: 'Vikram Rao',
      email: 'vikram.rao@campus.edu',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram',
      role: 'driver',
      department: 'Mechanical Engineering',
      yearOfStudy: 4,
      bio: 'Daily campus EV commuter (Tata Nexon EV). Happy to offer shared rides from North Gate.'
    },
    name: 'Vikram Rao',
    email: 'vikram.rao@campus.edu',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram',
    department: 'Mechanical Engineering',
    companyOffer: 'Amazon SDE',
    roleTitle: 'Full Stack & Microservices',
    domain: 'Full Stack & Microservices',
    skills: ['React', 'Node.js', 'AWS', 'System Design', 'TypeScript'],
    availableSlots: ['Fri 3:00 PM', 'Sat 2:00 PM'],
    maxMentees: 4,
    activeMenteeCount: 1,
    isAvailable: true,
    rating: 4.85,
    reviewCount: 14,
    bio: 'Focusing on portfolio architecture, fullstack project reviews, and AWS deployments.'
  }
];

const MOCK_REQUESTS: MentorshipRequest[] = [
  {
    id: 'mr_1',
    menteeId: 'usr_student_1',
    mentorId: 'men_1',
    mentor: MOCK_MENTORS[0],
    topic: 'System Design Mock - Scalable News Feed & Ride Matching',
    preferredSlot: 'Sat 11:00 AM',
    status: 'accepted',
    notes: 'I have prepared the HLD diagram. Would appreciate feedback on caching and DB partitioning.',
    mentorNotes: 'Looking forward to it! Make sure to write out latency and read/write QPS calculations before the session.',
    createdAt: '2026-10-28T10:30:00Z'
  },
  {
    id: 'mr_2',
    menteeId: 'usr_student_3',
    mentorId: 'men_2',
    mentor: MOCK_MENTORS[1],
    topic: 'DP on Trees and Graphs practice',
    preferredSlot: 'Mon 5:00 PM',
    status: 'pending',
    notes: 'Struggling with post-order traversal DP transitions on directed acyclic graphs.',
    createdAt: '2026-10-29T08:15:00Z'
  }
];

const MOCK_RESOURCES: AcademicResource[] = [
  {
    id: 'res_1',
    title: 'CS301: Graph Algorithms & Dynamic Programming Comprehensive Guide',
    courseCode: 'CS301',
    courseName: 'Data Structures & Algorithms',
    category: 'Notes',
    semester: 5,
    department: 'Computer Science',
    fileUrl: 'https://campus.edu/resources/cs301_graph_dp.pdf',
    fileSize: '2.4 MB',
    uploaderId: 'usr_student_2',
    uploaderName: 'Diya Patel',
    downloadsCount: 184,
    rating: 4.90,
    ratingsCount: 32,
    tags: ['Graphs', 'Dijkstra', 'DP', 'ShortestPath', 'LeetCode'],
    createdAt: '2026-10-15T14:00:00Z'
  },
  {
    id: 'res_2',
    title: 'CS301: End-Semester Exam Paper 2024 (with Detailed Solutions)',
    courseCode: 'CS301',
    courseName: 'Data Structures & Algorithms',
    category: 'PYQ',
    semester: 5,
    department: 'Computer Science',
    fileUrl: 'https://campus.edu/resources/cs301_pyq_2024.pdf',
    fileSize: '1.8 MB',
    uploaderId: 'usr_student_1',
    uploaderName: 'Aarav Sharma',
    downloadsCount: 342,
    rating: 4.85,
    ratingsCount: 48,
    tags: ['PYQ', 'Solutions', 'EndSem', '2024'],
    createdAt: '2026-10-18T09:20:00Z'
  },
  {
    id: 'res_3',
    title: 'CS301: Quick Reference Cheatsheet — Asymptotic Notations & Data Structures',
    courseCode: 'CS301',
    courseName: 'Data Structures & Algorithms',
    category: 'Cheatsheet',
    semester: 5,
    department: 'Computer Science',
    fileUrl: 'https://campus.edu/resources/cs301_cheatsheet.pdf',
    fileSize: '0.8 MB',
    uploaderId: 'usr_student_4',
    uploaderName: 'Sneha Kulkarni',
    downloadsCount: 115,
    rating: 4.70,
    ratingsCount: 19,
    tags: ['Cheatsheet', 'Complexity', 'BigO', 'Heaps'],
    createdAt: '2026-10-20T11:45:00Z'
  },
  {
    id: 'res_4',
    title: 'CS302: Virtual Memory, Paging & Page Replacement Illustrated',
    courseCode: 'CS302',
    courseName: 'Operating Systems',
    category: 'Guide',
    semester: 5,
    department: 'Computer Science',
    fileUrl: 'https://campus.edu/resources/cs302_virtual_memory.pdf',
    fileSize: '3.1 MB',
    uploaderId: 'usr_student_2',
    uploaderName: 'Diya Patel',
    downloadsCount: 156,
    rating: 4.88,
    ratingsCount: 25,
    tags: ['VirtualMemory', 'LRU', 'Paging', 'Deadlocks'],
    createdAt: '2026-10-22T16:10:00Z'
  }
];

export const hubService = {
  async getStudentProfile(studentId: string = 'usr_student_1'): Promise<StudentProfile> {
    try {
      const data = await request<any>(`/hub/profile/${studentId}`);
      return {
        ...data,
        id: data.id || `sp_${studentId}`,
        user: data.user || {
          id: data.userId || studentId,
          name: data.name,
          email: data.email,
          avatar: data.avatar,
          role: 'student',
          department: data.department,
          yearOfStudy: data.yearOfStudy,
          bio: data.bio
        }
      };
    } catch (error) {
      if (error instanceof TypeError) {
        return MOCK_PROFILE;
      }
      throw error;
    }
  },

  async updateStudentProfile(studentId: string, data: Partial<StudentProfile>): Promise<StudentProfile> {
    try {
      const res = await request<any>(`/hub/profile/${studentId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      return {
        ...res,
        id: `sp_${studentId}`,
        user: {
          id: studentId,
          name: res.name || 'Aarav Sharma',
          email: res.email || 'aarav.sharma@campus.edu',
          avatar: res.avatar,
          role: 'student',
          department: res.department,
          yearOfStudy: res.yearOfStudy,
          bio: res.bio
        }
      };
    } catch (error) {
      if (error instanceof TypeError) {
        return { ...MOCK_PROFILE, ...data };
      }
      throw error;
    }
  },

  async getPlacementMilestones(studentId: string = 'usr_student_1'): Promise<PlacementMilestone[]> {
    try {
      const res = await request<{ milestones: PlacementMilestone[] } | PlacementMilestone[]>(`/hub/placement-milestones/${studentId}`);
      if (Array.isArray(res)) return res;
      return res.milestones || MOCK_MILESTONES;
    } catch (error) {
      if (error instanceof TypeError) {
        return MOCK_MILESTONES;
      }
      throw error;
    }
  },

  async toggleMilestone(studentId: string, milestoneId: string): Promise<{ completed: boolean; readinessScore: number }> {
    try {
      return await request<{ completed: boolean; readinessScore: number }>(
        `/hub/placement-milestones/${studentId}/toggle`,
        {
          method: 'POST',
          body: JSON.stringify({ milestoneId })
        }
      );
    } catch (error) {
      if (error instanceof TypeError) {
        const item = MOCK_MILESTONES.find((m) => m.id === milestoneId);
        if (item) item.completed = !item.completed;
        const completedCount = MOCK_MILESTONES.filter((m) => m.completed).length;
        const score = Math.min(100, Math.round((completedCount / MOCK_MILESTONES.length) * 50) + 50);
        return { completed: !!item?.completed, readinessScore: score };
      }
      throw error;
    }
  },

  async getMentors(filters: { skill?: string; company?: string } = {}): Promise<PeerMentor[]> {
    try {
      const params = new URLSearchParams();
      if (filters.skill) params.append('skill', filters.skill);
      if (filters.company) params.append('company', filters.company);
      const res = await request<{ mentors: PeerMentor[] } | PeerMentor[]>(`/hub/mentors?${params.toString()}`);
      if (Array.isArray(res)) return res;
      return res.mentors || MOCK_MENTORS;
    } catch (error) {
      if (error instanceof TypeError) {
        let result = [...MOCK_MENTORS];
        if (filters.skill) {
          result = result.filter((m) => m.skills.some((s) => s.toLowerCase().includes(filters.skill!.toLowerCase())));
        }
        if (filters.company) {
          result = result.filter((m) => m.companyOffer.toLowerCase().includes(filters.company!.toLowerCase()));
        }
        return result;
      }
      throw error;
    }
  },

  async submitMentorshipRequest(payload: {
    mentorId: string;
    topic: string;
    preferredSlot: string;
    notes?: string;
  }): Promise<MentorshipRequest> {
    try {
      return await request<MentorshipRequest>('/hub/mentorship-requests', {
        method: 'POST',
        body: JSON.stringify({ ...payload, menteeId: 'usr_student_1' })
      });
    } catch (error) {
      if (error instanceof TypeError) {
        const mentor = MOCK_MENTORS.find((m) => m.id === payload.mentorId) || MOCK_MENTORS[0];
        const newReq: MentorshipRequest = {
          id: `req_${Date.now()}`,
          menteeId: 'usr_student_1',
          mentorId: payload.mentorId,
          mentor,
          topic: payload.topic,
          preferredSlot: payload.preferredSlot,
          status: 'pending',
          notes: payload.notes,
          createdAt: new Date().toISOString()
        };
        MOCK_REQUESTS.unshift(newReq);
        return newReq;
      }
      throw error;
    }
  },

  async getUserRequests(userId: string = 'usr_student_1'): Promise<MentorshipRequest[]> {
    try {
      const res = await request<{ sent: MentorshipRequest[]; requests?: MentorshipRequest[] } | MentorshipRequest[]>(`/hub/mentorship-requests/${userId}`);
      if (Array.isArray(res)) return res;
      return res.sent || res.requests || MOCK_REQUESTS;
    } catch (error) {
      if (error instanceof TypeError) {
        return MOCK_REQUESTS;
      }
      throw error;
    }
  },

  async updateRequestStatus(requestId: string, status: 'accepted' | 'rejected', notes?: string): Promise<MentorshipRequest> {
    try {
      return await request<MentorshipRequest>(`/hub/mentorship-requests/${requestId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes })
      });
    } catch (error) {
      if (error instanceof TypeError) {
        const req = MOCK_REQUESTS.find((r) => r.id === requestId);
        if (req) {
          req.status = status;
          if (notes) req.notes = notes;
        }
        return req!;
      }
      throw error;
    }
  },

  async getResources(filters: { courseCode?: string; category?: string; query?: string } = {}): Promise<AcademicResource[]> {
    try {
      const params = new URLSearchParams();
      if (filters.courseCode) params.append('courseCode', filters.courseCode);
      if (filters.category) params.append('category', filters.category);
      if (filters.query) params.append('query', filters.query);
      const res = await request<{ resources: AcademicResource[] } | AcademicResource[]>(`/hub/resources?${params.toString()}`);
      if (Array.isArray(res)) return res;
      return res.resources || MOCK_RESOURCES;
    } catch (error) {
      if (error instanceof TypeError) {
        let result = [...MOCK_RESOURCES];
        if (filters.courseCode && filters.courseCode !== 'All') {
          result = result.filter((r) => r.courseCode === filters.courseCode);
        }
        if (filters.category && filters.category !== 'All') {
          result = result.filter((r) => r.category === filters.category);
        }
        if (filters.query) {
          const q = filters.query.toLowerCase();
          result = result.filter(
            (r) =>
              r.title.toLowerCase().includes(q) ||
              r.courseCode.toLowerCase().includes(q) ||
              r.tags.some((t) => t.toLowerCase().includes(q))
          );
        }
        return result;
      }
      throw error;
    }
  },

  async rateResource(resourceId: string, rating: number): Promise<{ averageRating: number; totalRatings: number }> {
    try {
      return await request<{ averageRating: number; totalRatings: number }>(`/hub/resources/${resourceId}/rate`, {
        method: 'POST',
        body: JSON.stringify({ rating, userId: 'usr_student_1' })
      });
    } catch (error) {
      if (error instanceof TypeError) {
        const r = MOCK_RESOURCES.find((x) => x.id === resourceId);
        if (r) {
          r.ratingsCount = (r.ratingsCount || 0) + 1;
          r.rating = Number(((r.rating * (r.ratingsCount - 1) + rating) / r.ratingsCount).toFixed(1));
          r.userRated = rating;
          return { averageRating: r.rating, totalRatings: r.ratingsCount };
        }
        return { averageRating: rating, totalRatings: 1 };
      }
      throw error;
    }
  }
};
