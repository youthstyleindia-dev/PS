import { request } from './api';

export interface MentorProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar: string;
  department: string;
  yearOfStudy: number;
  graduationYear: number;
  companyOffer: string;
  domain: string;
  skills: string[];
  topics: string[];
  projects: Array<{ title: string; link?: string }>;
  availableSlots: string[];
  preferredFormat: 'chat' | 'office_hours' | 'hybrid';
  maxMentees: number;
  activeMentees: number;
  isAvailable: boolean;
  rating: number;
  reviewCount: number;
  bio: string;
  isDemo: boolean;
  matchScore: number;
  matchReason: string;
  matchedSkills: string[];
  matchedTopics: string[];
}

export interface MentorshipRequestItem {
  id: string;
  menteeId: string;
  mentorId: string;
  topic: string;
  preferredSlot: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  notes?: string;
  mentorNotes?: string;
  conversationId?: string;
  createdAt: string;
  updatedAt: string;
  mentor?: {
    name: string;
    avatar: string;
    department: string;
    company: string;
  };
  mentee?: {
    name: string;
    avatar: string;
    department: string;
    year: number;
  };
}

export interface MentorshipMessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    avatar: string;
    role: string;
  };
}

export const MentorService = {
  getMentors: async (params: {
    query?: string;
    skills?: string;
    department?: string;
    available_only?: boolean;
    sort?: string;
  } = {}) => {
    const queryParts = Object.entries(params)
      .filter(([_, v]) => v !== undefined && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
    const queryStr = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    const res = await request<{ success: boolean; data: { mentors: MentorProfile[]; total: number } }>(`/mentors${queryStr}`);
    return res.data;
  },

  getMentor: async (mentorId: string) => {
    const res = await request<{ success: boolean; data: MentorProfile }>(`/mentors/${mentorId}`);
    return res.data;
  },

  getRequests: async () => {
    const res = await request<{ success: boolean; data: { sent: MentorshipRequestItem[]; received: MentorshipRequestItem[] } }>('/mentorship/requests/all');
    return res.data;
  },

  createRequest: async (data: {
    mentor_id: string;
    topic: string;
    preferred_slot: string;
    notes?: string;
  }) => {
    const res = await request<{ success: boolean; data: any; message: string }>('/mentorship/requests', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  },

  updateRequestStatus: async (requestId: string, status: 'accepted' | 'rejected' | 'completed', mentor_notes?: string) => {
    const res = await request<{ success: boolean; data: { id: string; status: string; conversationId?: string }; message: string }>(`/mentorship/requests/${requestId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, mentor_notes })
    });
    return res.data;
  },

  getConversation: async (conversationId: string) => {
    const res = await request<{ success: boolean; data: { conversation: any; messages: MentorshipMessageItem[] } }>(`/mentorship/conversations/${conversationId}`);
    return res.data;
  },

  sendMessage: async (conversationId: string, content: string) => {
    const res = await request<{ success: boolean; data: MentorshipMessageItem }>(`/mentorship/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
    return res.data;
  }
};
