export type UserRole = 'student' | 'driver' | 'proctor' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  department?: string;
  year_of_study?: number;
  bio?: string;
  created_at?: string;
  updated_at?: string;
}

export type ActivityModule = 'hub' | 'rides' | 'sustainability' | 'wellbeing' | 'exams' | 'system';

export interface ActivityLogItem {
  id: string;
  userId?: string;
  userName?: string;
  userAvatar?: string;
  module: ActivityModule;
  action: string;
  details?: Record<string, any> | string;
  timestamp: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  error: {
    code: 'BAD_REQUEST' | 'NOT_FOUND' | 'CONFLICT' | 'INTERNAL_SERVER_ERROR';
    message: string;
    details?: any;
  };
}
