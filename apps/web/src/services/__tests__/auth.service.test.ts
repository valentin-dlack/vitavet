import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { authService } from '../auth.service';

// Mock fetch globally
global.fetch = vi.fn();

describe('AuthService - getCurrentUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch current user data successfully', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      roles: ['OWNER', 'VET'],
      clinics: ['clinic-1', 'clinic-2'],
    };

    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue(mockUser),
    };

    vi.mocked(fetch).mockResolvedValue(mockResponse as any);
    localStorage.setItem('authToken', 'test-token');

    const result = await authService.getCurrentUser();

    expect(fetch).toHaveBeenCalledWith('/api/auth/me', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json',
      },
    });
    expect(result).toEqual(mockUser);
  });

  it('should throw error when no token is available', async () => {
    await expect(authService.getCurrentUser()).rejects.toThrow('No authentication token');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should throw error when API returns error', async () => {
    const mockResponse = {
      ok: false,
      json: vi.fn().mockResolvedValue({ message: 'Unauthorized' }),
    };

    vi.mocked(fetch).mockResolvedValue(mockResponse as any);
    localStorage.setItem('authToken', 'test-token');

    await expect(authService.getCurrentUser()).rejects.toThrow('Unauthorized');
  });

  it('should throw generic error when API response has no message', async () => {
    const mockResponse = {
      ok: false,
      json: vi.fn().mockResolvedValue({}),
    };

    vi.mocked(fetch).mockResolvedValue(mockResponse as any);
    localStorage.setItem('authToken', 'test-token');

    await expect(authService.getCurrentUser()).rejects.toThrow('Failed to get current user');
  });

  it('should handle network errors', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'));
    localStorage.setItem('authToken', 'test-token');

    await expect(authService.getCurrentUser()).rejects.toThrow('Network error');
  });
});

describe('AuthService - updateProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should update profile successfully', async () => {
    const updateData = {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
    };

    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({ message: 'Profile updated successfully' }),
    };

    vi.mocked(fetch).mockResolvedValue(mockResponse as any);
    localStorage.setItem('authToken', 'test-token');

    const result = await authService.updateProfile(updateData);

    expect(fetch).toHaveBeenCalledWith('/api/auth/profile', {
      method: 'PATCH',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
    expect(result).toEqual({ message: 'Profile updated successfully' });
  });

  it('should throw error when no token is available', async () => {
    await expect(authService.updateProfile({ firstName: 'Jane' })).rejects.toThrow('No authentication token');
  });
});

describe('AuthService - changePassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should change password successfully', async () => {
    const passwordData = {
      currentPassword: 'oldpass',
      newPassword: 'newpass123',
      confirmPassword: 'newpass123',
    };

    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({ message: 'Password changed successfully' }),
    };

    vi.mocked(fetch).mockResolvedValue(mockResponse as any);
    localStorage.setItem('authToken', 'test-token');

    const result = await authService.changePassword(passwordData);

    expect(fetch).toHaveBeenCalledWith('/api/auth/password', {
      method: 'PATCH',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(passwordData),
    });
    expect(result).toEqual({ message: 'Password changed successfully' });
  });

  it('should throw error when no token is available', async () => {
    await expect(authService.changePassword({
      currentPassword: 'old',
      newPassword: 'new',
      confirmPassword: 'new',
    })).rejects.toThrow('No authentication token');
  });
});

describe('AuthService - requestAccountDeletion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should request account deletion successfully', async () => {
    const deletionData = {
      reason: 'I no longer need this account',
      password: 'mypassword',
    };

    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({ 
        message: 'Account deletion request submitted successfully',
        requestId: 'req-123'
      }),
    };

    vi.mocked(fetch).mockResolvedValue(mockResponse as any);
    localStorage.setItem('authToken', 'test-token');

    const result = await authService.requestAccountDeletion(deletionData);

    expect(fetch).toHaveBeenCalledWith('/api/auth/delete-account', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deletionData),
    });
    expect(result).toEqual({ 
      message: 'Account deletion request submitted successfully',
      requestId: 'req-123'
    });
  });

  it('should throw error when no token is available', async () => {
    await expect(authService.requestAccountDeletion({
      reason: 'test',
      password: 'test',
    })).rejects.toThrow('No authentication token');
  });
});

describe('AuthService - getDeletionRequestStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should get deletion request status successfully', async () => {
    const mockStatus = {
      id: 'req-123',
      status: 'PENDING',
      reason: 'Test reason',
      createdAt: '2024-01-01T00:00:00Z',
      adminNotes: 'Processing...',
      processedAt: null,
    };

    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue(mockStatus),
    };

    vi.mocked(fetch).mockResolvedValue(mockResponse as any);
    localStorage.setItem('authToken', 'test-token');

    const result = await authService.getDeletionRequestStatus();

    expect(fetch).toHaveBeenCalledWith('/api/auth/delete-account/status', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json',
      },
    });
    expect(result).toEqual(mockStatus);
  });

  it('should return null when no deletion request exists', async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue(null),
    };

    vi.mocked(fetch).mockResolvedValue(mockResponse as any);
    localStorage.setItem('authToken', 'test-token');

    const result = await authService.getDeletionRequestStatus();

    expect(result).toBeNull();
  });

  it('should throw error when no token is available', async () => {
    await expect(authService.getDeletionRequestStatus()).rejects.toThrow('No authentication token');
  });
});
