const BASE_URL = '/api';

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const token = typeof window !== 'undefined' ? localStorage.getItem('universe_auth_token') : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(errorBody.message || errorBody.error?.message || `HTTP error ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (err: any) {
    console.warn(`[API] fetch failed for ${endpoint}:`, err.message);
    throw err;
  }
}
