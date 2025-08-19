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
