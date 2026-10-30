import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '../types';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roles?: UserRole[];
  avatar?: string;
  department?: string;
  year_of_study?: number;
  bio?: string;
  is_active?: boolean;
  permissions?: Record<string, boolean>;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  loginWithRole: (email: string, password: string, roleKey: UserRole) => Promise<AuthUser>;
  demoLogin: (role: UserRole) => Promise<AuthUser>;
  register: (data: { name: string; email: string; password: string; role?: UserRole; department?: string; year_of_study?: number }) => Promise<AuthUser>;
  logout: () => void;
  switchRole: (role: UserRole) => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'universe_auth_token';
const USER_KEY = 'universe_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem(USER_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Validate session and fetch fresh profile on mount
  useEffect(() => {
    const initAuth = async () => {
      const activeToken = localStorage.getItem(TOKEN_KEY);
      if (activeToken) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${activeToken}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.data) {
              setUser(data.data);
              localStorage.setItem(USER_KEY, JSON.stringify(data.data));
            }
          } else {
            // Token expired or invalid
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            setToken(null);
            setUser(null);
          }
        } catch {
          // Keep local state if server offline
        }
      } else {
        localStorage.removeItem(USER_KEY);
        setUser(null);
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Login failed');
      }

      setToken(data.data.token);
      setUser(data.data.user);
      localStorage.setItem(TOKEN_KEY, data.data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.data.user));
      return data.data.user;
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    }
  };

  const loginWithRole = async (email: string, password: string, roleKey: UserRole) => {
    setError(null);
    try {
      const res = await fetch(`/api/auth/login/${roleKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || `Access denied for role '${roleKey}'`);
      }

      setToken(data.data.token);
      setUser(data.data.user);
      localStorage.setItem(TOKEN_KEY, data.data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.data.user));
      return data.data.user;
    } catch (err: any) {
      setError(err.message || 'Role login failed');
      throw err;
    }
  };

  const demoLogin = async (role: UserRole) => {
    setError(null);
    try {
      const res = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Demo login failed');
      }

      setToken(data.data.token);
      setUser(data.data.user);
      localStorage.setItem(TOKEN_KEY, data.data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.data.user));
      return data.data.user;
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
      throw err;
    }
  };

  const register = async (formData: { name: string; email: string; password: string; role?: UserRole; department?: string; year_of_study?: number }) => {
    setError(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Registration failed');
      }

      setToken(data.data.token);
      setUser(data.data.user);
      localStorage.setItem(TOKEN_KEY, data.data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.data.user));
      return data.data.user;
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      throw err;
    }
  };

  const logout = () => {
    if (token) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {});
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const switchRole = async (role: UserRole) => {
    // Only allow switching if the user actually holds that role or in demo mode
    await demoLogin(role);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        loginWithRole,
        demoLogin,
        register,
        logout,
        switchRole,
        error,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
