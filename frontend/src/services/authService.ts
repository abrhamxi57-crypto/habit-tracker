export interface UserPreferences {
  sound_enabled: boolean;
  email_reminders: boolean;
  week_start_day: number;
  daily_reminder_time: string | null;
}

export interface User {
  id: string;
  email: string;
  display_name: string;
  timezone: string;
  preferred_theme: string;
  is_active: boolean;
  created_at: string;
  preferences?: UserPreferences;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

const ACCESS_KEY = 'hf_access_token';
const REFRESH_KEY = 'hf_refresh_token';
const USER_KEY = 'hf_user_cache';

class AuthService {
  private user: User | null = null;
  private listeners: Array<(user: User | null) => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(USER_KEY);
      if (cached) {
        try {
          this.user = JSON.parse(cached);
        } catch {
          this.user = null;
        }
      }
    }
  }

  public getAccessToken(): string | null {
    return typeof window !== 'undefined' ? localStorage.getItem(ACCESS_KEY) : null;
  }

  public getRefreshToken(): string | null {
    return typeof window !== 'undefined' ? localStorage.getItem(REFRESH_KEY) : null;
  }

  public getAuthHeader(): Record<string, string> {
    const token = this.getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  public getUser(): User | null {
    return this.user;
  }

  public onUserChange(fn: (user: User | null) => void): () => void {
    this.listeners.push(fn);
    fn(this.user);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  private notify() {
    this.listeners.forEach(fn => fn(this.user));
  }

  private saveSession(data: AuthTokens) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ACCESS_KEY, data.access_token);
      localStorage.setItem(REFRESH_KEY, data.refresh_token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }
    this.user = data.user;
    this.notify();
  }

  public async register(payload: {
    email: string;
    password: string;
    display_name: string;
    timezone?: string;
    preferred_theme?: string;
  }): Promise<AuthTokens> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
      throw new Error(err.detail || 'Registration failed');
    }

    const data: AuthTokens = await res.json();
    this.saveSession(data);
    return data;
  }

  public async login(payload: { email: string; password: string }): Promise<AuthTokens> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Login failed' }));
      throw new Error(err.detail || 'Invalid email or password');
    }

    const data: AuthTokens = await res.json();
    this.saveSession(data);
    return data;
  }

  public async refresh(): Promise<string | null> {
    const rToken = this.getRefreshToken();
    if (!rToken) return null;

    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: rToken }),
      });

      if (!res.ok) {
        this.logout();
        return null;
      }

      const data: AuthTokens = await res.json();
      this.saveSession(data);
      return data.access_token;
    } catch {
      return null;
    }
  }

  public async logout(): Promise<void> {
    const token = this.getAccessToken();
    if (token) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem(USER_KEY);
    }
    this.user = null;
    this.notify();
  }

  public async fetchMe(): Promise<User | null> {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 401) {
          const refreshed = await this.refresh();
          if (refreshed) {
            return this.fetchMe();
          }
        }
        return null;
      }

      const user: User = await res.json();
      this.user = user;
      if (typeof window !== 'undefined') {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      }
      this.notify();
      return user;
    } catch {
      return null;
    }
  }

  public async updateProfile(payload: {
    display_name?: string;
    timezone?: string;
    preferred_theme?: string;
  }): Promise<User> {
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeader(),
    };

    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Update failed' }));
      throw new Error(err.detail || 'Could not update profile');
    }

    const updated: User = await res.json();
    this.user = updated;
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
    }
    this.notify();
    return updated;
  }
}

export const authService = new AuthService();
