import { describe, it, expect, beforeEach, vi } from 'vitest';
import { adminService } from '../admin.service';
import { httpService } from '../http.service';

// Mock the http service
vi.mock('../http.service');
const mockedHttpService = httpService as any;

describe('AdminService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createUser', () => {
    const createUserPayload = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should create a user successfully', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        isEmailVerified: false,
        createdAt: '2024-01-01T00:00:00Z',
      };

      mockedHttpService.post.mockResolvedValue(mockUser);

      const result = await adminService.createUser(createUserPayload);

      expect(mockedHttpService.post).toHaveBeenCalledWith('/admin/users', createUserPayload);
      expect(result).toEqual(mockUser);
    });

    it('should handle errors', async () => {
      const error = new Error('Failed to create user');
      mockedHttpService.post.mockRejectedValue(error);

      await expect(adminService.createUser(createUserPayload)).rejects.toThrow('Failed to create user');
    });
  });

  describe('updateUser', () => {
    const userId = 'user-1';
    const updateUserPayload = {
      firstName: 'Updated',
      lastName: 'Name',
    };

    it('should update a user successfully', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'Updated',
        lastName: 'Name',
        isEmailVerified: false,
        createdAt: '2024-01-01T00:00:00Z',
      };

      mockedHttpService.patch.mockResolvedValue(mockUser);

      const result = await adminService.updateUser(userId, updateUserPayload);

      expect(mockedHttpService.patch).toHaveBeenCalledWith(`/admin/users/${userId}`, updateUserPayload);
      expect(result).toEqual(mockUser);
    });
  });

  describe('deleteUser', () => {
    const userId = 'user-1';

    it('should delete a user successfully', async () => {
      mockedHttpService.delete.mockResolvedValue(undefined);

      await adminService.deleteUser(userId);

      expect(mockedHttpService.delete).toHaveBeenCalledWith(`/admin/users/${userId}`);
    });
  });

  describe('updateClinic', () => {
    const clinicId = 'clinic-1';
    const updateClinicPayload = {
      name: 'Updated Clinic',
      city: 'Lyon',
    };

    it('should update a clinic successfully', async () => {
      const mockClinic = {
        id: 'clinic-1',
        name: 'Updated Clinic',
        city: 'Lyon',
        postcode: '75001',
        active: true,
      };

      mockedHttpService.patch.mockResolvedValue(mockClinic);

      const result = await adminService.updateClinic(clinicId, updateClinicPayload);

      expect(mockedHttpService.patch).toHaveBeenCalledWith(`/admin/clinics/${clinicId}`, updateClinicPayload);
      expect(result).toEqual(mockClinic);
    });
  });

  describe('getUsers', () => {
    it('should get all users successfully', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          isEmailVerified: false,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];

      mockedHttpService.get.mockResolvedValue(mockUsers);

      const result = await adminService.getUsers();

      expect(mockedHttpService.get).toHaveBeenCalledWith('/admin/users');
      expect(result).toEqual(mockUsers);
    });
  });

  describe('getClinics', () => {
    it('should get all clinics successfully', async () => {
      const mockClinics = [
        {
          id: 'clinic-1',
          name: 'Test Clinic',
          city: 'Paris',
          postcode: '75001',
          active: true,
        },
      ];

      mockedHttpService.get.mockResolvedValue(mockClinics);

      const result = await adminService.getClinics();

      expect(mockedHttpService.get).toHaveBeenCalledWith('/admin/clinics');
      expect(result).toEqual(mockClinics);
    });
  });
});
