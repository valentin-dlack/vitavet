import { jwtDecode } from 'jwt-decode';

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
  role?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CurrentUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  clinics: string[];
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface DeleteAccountData {
  reason: string;
  password: string;
}

export interface DeletionRequestStatus {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  reason: string;
  createdAt: string;
  adminNotes?: string;
  processedAt?: string;
}

interface DecodedToken {
  sub: string;
  email: string;
  roles: string[];
  clinicIds: string[];
  iat: number;
  exp: number;
}

export interface AuthResponse {
  user: User;
  token: string;
  message: string;
}

class AuthService {
  private baseUrl = ((import.meta as unknown as ImportMeta)?.env?.VITE_API_BASE_URL || '/api') + '/auth';
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

  getUserRoles(): string[] {
    const token = this.getToken();
    if (!token) return [];
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      return decoded.roles || [];
    } catch (e) {
      console.error('Failed to decode token', e);
      return [];
    }
  }

  getUserClinics(): string[] {
    const token = this.getToken();
    if (!token) return [];
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      return decoded.clinicIds || [];
    } catch (e) {
      console.error('Failed to decode token', e);
      return [];
    }
  }

  removeUser(): void {
    localStorage.removeItem(this.userKey);
    this.emit();
  }

  async getCurrentUser(): Promise<CurrentUser> {
    const token = this.getToken();
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await fetch(`${this.baseUrl}/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get current user');
    }

    return response.json();
  }

  async updateProfile(data: UpdateProfileData): Promise<{ message: string }> {
    const token = this.getToken();
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await fetch(`${this.baseUrl}/profile`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update profile');
    }

    return response.json();
  }

  async changePassword(data: ChangePasswordData): Promise<{ message: string }> {
    const token = this.getToken();
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await fetch(`${this.baseUrl}/password`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to change password');
    }

    return response.json();
  }

  async requestAccountDeletion(data: DeleteAccountData): Promise<{ message: string; requestId: string }> {
    const token = this.getToken();
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await fetch(`${this.baseUrl}/delete-account`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to request account deletion');
    }

    return response.json();
  }

  async getDeletionRequestStatus(): Promise<DeletionRequestStatus | null> {
    const token = this.getToken();
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await fetch(`${this.baseUrl}/delete-account/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get deletion request status');
    }

    return response.json();
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
      try { l(); } catch { /* empty */ }
    }
  }
}

export const authService = new AuthService();
