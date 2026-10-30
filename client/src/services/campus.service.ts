import { request } from './api';

export interface CampusLocation {
  id: string;
  name: string;
  category: string;
  building: string;
  zone: string;
  description: string;
  hours: string;
  accessibility: string;
  coordinates: { x: number; y: number };
  nodeId?: string;
  isDemo: boolean;
}

export interface CampusEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  organizerId: string;
  organizerName: string;
  communityId?: string;
  communityName?: string;
  venue: string;
  startTime: string;
  endTime: string;
  capacity: number;
  rsvpCount: number;
  status: string;
  tags: string[];
  isDemo: boolean;
  hasRsvpd: boolean;
  createdAt: string;
}

export interface CampusCommunity {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  avatar?: string;
  memberCount: number;
  isMember: boolean;
  isDemo: boolean;
  createdAt: string;
}

export interface CampusAnnouncement {
  id: string;
  title: string;
  body: string;
  scope: string;
  priority: 'normal' | 'urgent' | 'critical';
  isDemo: boolean;
  createdAt: string;
  author: {
    id: string;
    name: string;
    role: string;
    department?: string;
  };
}

export interface FacilityIssue {
  id: string;
  reporter_id: string;
  reporter_name?: string;
  reporter_email?: string;
  location_id?: string;
  location_name?: string;
  title: string;
  description: string;
  category: 'electrical' | 'plumbing' | 'hvac' | 'structural' | 'cleanliness' | 'safety' | 'other' | string;
  urgency: 'low' | 'medium' | 'high' | 'critical' | string;
  status: 'open' | 'in_progress' | 'resolved' | 'rejected' | string;
  assigned_to?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
}

export const CampusService = {
  getDirectory: async (category?: string, query?: string) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (query) params.append('query', query);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await request<{ success: boolean; data: { locations: CampusLocation[]; total: number } }>(`/campus/directory${qs}`);
    return res.data;
  },

  getEvents: async (category?: string, query?: string) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (query) params.append('query', query);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await request<{ success: boolean; data: { events: CampusEvent[]; total: number } }>(`/campus/events${qs}`);
    return res.data;
  },

  rsvpEvent: async (eventId: string) => {
    const res = await request<{ success: boolean; data: { registered: boolean; rsvpCount: number }; message: string }>(`/campus/events/${eventId}/rsvp`, {
      method: 'POST'
    });
    return res.data;
  },

  getCommunities: async (category?: string) => {
    const qs = category ? `?category=${encodeURIComponent(category)}` : '';
    const res = await request<{ success: boolean; data: { communities: CampusCommunity[]; total: number } }>(`/campus/communities${qs}`);
    return res.data;
  },

  joinCommunity: async (communityId: string) => {
    const res = await request<{ success: boolean; data: { isMember: boolean; memberCount: number }; message: string }>(`/campus/communities/${communityId}/join`, {
      method: 'POST'
    });
    return res.data;
  },

  getAnnouncements: async () => {
    const res = await request<{ success: boolean; data: { announcements: CampusAnnouncement[] } }>('/campus/announcements');
    return res.data.announcements;
  },

  getFacilityIssues: async (status?: string) => {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    const res = await request<{ success: boolean; data: { issues: FacilityIssue[]; total: number } }>(`/campus/facilities/issues${qs}`);
    return res.data;
  },

  reportFacilityIssue: async (data: {
    title: string;
    description: string;
    category: string;
    urgency?: string;
    location_id?: string;
  }) => {
    const res = await request<{ success: boolean; data: FacilityIssue; message: string }>('/campus/facilities/issues', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  },

  updateFacilityIssueStatus: async (issueId: string, status: string, resolution_notes?: string) => {
    const res = await request<{ success: boolean; data: FacilityIssue; message: string }>(`/campus/facilities/issues/${issueId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, resolution_notes })
    });
    return res.data;
  }
};
