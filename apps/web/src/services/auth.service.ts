export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  message: string;
}

class AuthService {
  private baseUrl = '/api/auth';
  private tokenKey = 'authToken';
  private userKey = 'authUser';
  private listeners = new Set<() => void>();

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    return response.json();
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    return response.json();
  }

  // Token helpers
  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
    this.emit();
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  removeToken(): void {
    localStorage.removeItem(this.tokenKey);
    this.emit();
  }

  // User helpers
  setUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.emit();
  }

  getUser(): User | null {
    const raw = localStorage.getItem(this.userKey);
    return raw ? (JSON.parse(raw) as User) : null;
  }

  removeUser(): void {
    localStorage.removeItem(this.userKey);
    this.emit();
  }

  // Session
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    this.removeToken();
    this.removeUser();
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    for (const l of this.listeners) {
      try { l(); } catch {}
    }
  }
}

export const authService = new AuthService();
