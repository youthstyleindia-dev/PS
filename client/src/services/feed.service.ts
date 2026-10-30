import { request } from './api';

export interface FeedAuthor {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  department?: string;
}

export interface FeedPost {
  id: string;
  authorId: string;
  campusId: string;
  postType: 'discussion' | 'question' | 'project_update' | 'opportunity' | 'event' | 'announcement' | 'resource_share' | 'ride_share' | 'poll';
  title?: string;
  body: string;
  tags: string[];
  visibility: string;
  attachmentMetadata: Record<string, any>;
  status: string;
  likesCount: number;
  commentsCount: number;
  bookmarksCount: number;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
  author: FeedAuthor;
  hasLiked: boolean;
  hasBookmarked: boolean;
}

export interface FeedComment {
  id: string;
  postId: string;
  authorId: string;
  parentId?: string;
  content: string;
  isDemo: boolean;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    role: string;
  };
}

export const FeedService = {
  getFeed: async (params: {
    tab?: string;
    post_type?: string;
    tag?: string;
    query?: string;
    sort?: string;
    limit?: number;
    offset?: number;
  } = {}) => {
    const queryParts = Object.entries(params)
      .filter(([_, v]) => v !== undefined && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
    const queryStr = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    const res = await request<{ success: boolean; data: { posts: FeedPost[]; total: number } }>(`/feed${queryStr}`);
    return res.data;
  },

  createPost: async (postData: {
    post_type: string;
    title?: string;
    body: string;
    tags?: string[];
    visibility?: string;
  }) => {
    const res = await request<{ success: boolean; data: FeedPost }>('/feed/posts', {
      method: 'POST',
      body: JSON.stringify(postData)
    });
    return res.data;
  },

  getPost: async (postId: string) => {
    const res = await request<{ success: boolean; data: { post: FeedPost; comments: FeedComment[] } }>(`/feed/posts/${postId}`);
    return res.data;
  },

  deletePost: async (postId: string) => {
    return await request<{ success: boolean; message: string }>(`/feed/posts/${postId}`, {
      method: 'DELETE'
    });
  },

  toggleReaction: async (postId: string, reaction_type = 'like') => {
    const res = await request<{ success: boolean; data: { reacted: boolean; likesCount: number } }>(`/feed/posts/${postId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ reaction_type })
    });
    return res.data;
  },

  toggleBookmark: async (postId: string) => {
    const res = await request<{ success: boolean; data: { bookmarked: boolean } }>(`/feed/posts/${postId}/bookmarks`, {
      method: 'POST'
    });
    return res.data;
  },

  addComment: async (postId: string, content: string, parent_id?: string) => {
    const res = await request<{ success: boolean; data: FeedComment }>(`/feed/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, parent_id })
    });
    return res.data;
  },

  reportPost: async (postId: string, reason: string) => {
    return await request<{ success: boolean; message: string }>(`/feed/posts/${postId}/reports`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }
};
