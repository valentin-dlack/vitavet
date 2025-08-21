import { beforeEach, describe, expect, it, vi, type Mocked } from 'vitest';
import { adminService } from './admin.service';
import { httpService } from './http.service';

// Mock httpService
vi.mock('./http.service');
const mockedHttpService = httpService as Mocked<typeof httpService>;

describe('AdminService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create user with clinic role successfully', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        isEmailVerified: false,
        createdAt: '2024-01-01T00:00:00Z',
        role: 'ASV',
      };

      const createUserPayload = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123',
        role: 'ASV',
        clinicId: 'clinic-1',
      };

      mockedHttpService.post.mockResolvedValue(mockUser);

      const result = await adminService.createUser(createUserPayload);

      expect(mockedHttpService.post).toHaveBeenCalledWith('/admin/users', createUserPayload);
      expect(result).toEqual(mockUser);
    });

    it('should create user with global role successfully', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        isEmailVerified: false,
        createdAt: '2024-01-01T00:00:00Z',
        role: 'OWNER',
      };

      const createUserPayload = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123',
        role: 'OWNER',
        clinicId: undefined,
      };

      mockedHttpService.post.mockResolvedValue(mockUser);

      const result = await adminService.createUser(createUserPayload);

      expect(mockedHttpService.post).toHaveBeenCalledWith('/admin/users', createUserPayload);
      expect(result).toEqual(mockUser);
    });

    it('should handle creation error', async () => {
      const error = new Error('User creation failed');
      mockedHttpService.post.mockRejectedValue(error);

      const createUserPayload = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123',
        role: 'ASV',
        clinicId: 'clinic-1',
      };

      await expect(adminService.createUser(createUserPayload)).rejects.toThrow('User creation failed');
    });
  });

  describe('updateUser', () => {
    it('should update user with role change successfully', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'updated@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        isEmailVerified: false,
        createdAt: '2024-01-01T00:00:00Z',
        role: 'VET',
      };

      const updateUserPayload = {
        email: 'updated@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'VET',
        clinicId: 'clinic-2',
      };

      mockedHttpService.patch.mockResolvedValue(mockUser);

      const result = await adminService.updateUser('user-1', updateUserPayload);

      expect(mockedHttpService.patch).toHaveBeenCalledWith('/admin/users/user-1', updateUserPayload);
      expect(result).toEqual(mockUser);
    });

    it('should update user with global role change successfully', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        isEmailVerified: false,
        createdAt: '2024-01-01T00:00:00Z',
        role: 'WEBMASTER',
      };

      const updateUserPayload = {
        role: 'WEBMASTER',
        clinicId: undefined,
      };

      mockedHttpService.patch.mockResolvedValue(mockUser);

      const result = await adminService.updateUser('user-1', updateUserPayload);

      expect(mockedHttpService.patch).toHaveBeenCalledWith('/admin/users/user-1', updateUserPayload);
      expect(result).toEqual(mockUser);
    });

    it('should update user without role change', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'updated@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        isEmailVerified: false,
        createdAt: '2024-01-01T00:00:00Z',
        role: 'ASV',
      };

      const updateUserPayload = {
        email: 'updated@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
      };

      mockedHttpService.patch.mockResolvedValue(mockUser);

      const result = await adminService.updateUser('user-1', updateUserPayload);

      expect(mockedHttpService.patch).toHaveBeenCalledWith('/admin/users/user-1', updateUserPayload);
      expect(result).toEqual(mockUser);
    });

    it('should handle update error', async () => {
      const error = new Error('User update failed');
      mockedHttpService.patch.mockRejectedValue(error);

      const updateUserPayload = {
        email: 'updated@example.com',
        role: 'VET',
        clinicId: 'clinic-1',
      };

      await expect(adminService.updateUser('user-1', updateUserPayload)).rejects.toThrow('User update failed');
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      mockedHttpService.delete.mockResolvedValue(undefined);

      await adminService.deleteUser('user-1');

      expect(mockedHttpService.delete).toHaveBeenCalledWith('/admin/users/user-1');
    });

    it('should handle delete error', async () => {
      const error = new Error('User deletion failed');
      mockedHttpService.delete.mockRejectedValue(error);

      await expect(adminService.deleteUser('user-1')).rejects.toThrow('User deletion failed');
    });
  });

  describe('getUsers', () => {
    it('should get all users successfully', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'test1@example.com',
          firstName: 'John',
          lastName: 'Doe',
          isEmailVerified: false,
          createdAt: '2024-01-01T00:00:00Z',
          role: 'ASV',
        },
        {
          id: 'user-2',
          email: 'test2@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          isEmailVerified: true,
          createdAt: '2024-01-02T00:00:00Z',
          role: 'VET',
        },
      ];

      mockedHttpService.get.mockResolvedValue(mockUsers);

      const result = await adminService.getUsers();

      expect(mockedHttpService.get).toHaveBeenCalledWith('/admin/users');
      expect(result).toEqual(mockUsers);
    });

    it('should handle get users error', async () => {
      const error = new Error('Failed to fetch users');
      mockedHttpService.get.mockRejectedValue(error);

      await expect(adminService.getUsers()).rejects.toThrow('Failed to fetch users');
    });
  });

  describe('getClinics', () => {
    it('should get all clinics successfully', async () => {
      const mockClinics = [
        {
          id: 'clinic-1',
          name: 'Test Clinic 1',
          city: 'Paris',
          postcode: '75001',
          active: true,
        },
        {
          id: 'clinic-2',
          name: 'Test Clinic 2',
          city: 'Lyon',
          postcode: '69000',
          active: true,
        },
      ];

      mockedHttpService.get.mockResolvedValue(mockClinics);

      const result = await adminService.getClinics();

      expect(mockedHttpService.get).toHaveBeenCalledWith('/admin/clinics');
      expect(result).toEqual(mockClinics);
    });

    it('should handle get clinics error', async () => {
      const error = new Error('Failed to fetch clinics');
      mockedHttpService.get.mockRejectedValue(error);

      await expect(adminService.getClinics()).rejects.toThrow('Failed to fetch clinics');
    });
  });
});
