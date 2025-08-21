import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { User } from './entities/user.entity';
import { UserClinicRole } from './entities/user-clinic-role.entity';
import { UserGlobalRole } from './entities/user-global-role.entity';
// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn().mockImplementation((password: string) => {
    // Simulate bcrypt comparison - return true only for correct password
    return Promise.resolve(password === 'Password123!');
  }),
}));

// Simple in-memory mock repository
function createUserRepositoryMock() {
  const users: User[] = [] as unknown as User[];
  return {
    // findOne supports where: { email } or { id }
    findOne: jest.fn(({ where }: { where: Partial<User> }) => {
      if (where.email) {
        return users.find((u) => u.email === where.email) ?? null;
      }
      if (where.id) {
        return users.find((u) => u.id === where.id) ?? null;
      }
      return null;
    }),
    create: jest.fn((data: Partial<User>) => data as User),
    save: jest.fn((data: Partial<User>) => {
      // if existing, update
      const existingIndex = users.findIndex((u) => u.id === (data as User).id);
      const now = new Date();
      if (existingIndex >= 0) {
        const updated = {
          ...users[existingIndex],
          ...data,
          updatedAt: now,
        } as User;
        users[existingIndex] = updated;
        return updated;
      }
      const created = {
        id: Math.random().toString(36).slice(2, 11),
        email: data.email!,
        password: data.password!,
        firstName: data.firstName!,
        lastName: data.lastName!,
        isEmailVerified: data.isEmailVerified ?? false,
        createdAt: now,
        updatedAt: now,
      } as User;
      users.push(created);
      return created;
    }),
    find: jest.fn(() => users),
    // helper to reset between tests
    __reset: () => {
      users.splice(0, users.length);
    },
  };
}

describe('UsersService', () => {
  let service: UsersService;
  const repoMock = createUserRepositoryMock();

  beforeEach(async () => {
    repoMock.__reset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: repoMock,
        },
        {
          provide: getRepositoryToken(UserClinicRole),
          useValue: {
            findOne: jest.fn().mockResolvedValue(null),
            find: jest.fn().mockResolvedValue([]),
            create: jest
              .fn()
              .mockImplementation((data: Partial<UserClinicRole>) => ({
                ...data,
              })),
            save: jest
              .fn()
              .mockImplementation((data: Partial<UserClinicRole>) =>
                Promise.resolve({ ...data }),
              ),
            delete: jest.fn().mockResolvedValue({ affected: 1 }),
          },
        },
        {
          provide: getRepositoryToken(UserGlobalRole),
          useValue: {
            findOne: jest.fn().mockResolvedValue(null),
            find: jest.fn().mockResolvedValue([]),
            create: jest
              .fn()
              .mockImplementation((data: Partial<UserGlobalRole>) => ({
                ...data,
              })),
            save: jest
              .fn()
              .mockImplementation((data: Partial<UserGlobalRole>) =>
                Promise.resolve({ ...data }),
              ),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const result = await service.create(
        userData.email,
        userData.password,
        userData.firstName,
        userData.lastName,
      );

      expect(result.email).toBe(userData.email);
      expect(result.firstName).toBe(userData.firstName);
      expect(result.lastName).toBe(userData.lastName);
      expect(result.isEmailVerified).toBe(false);
      expect(result.password).not.toBe(userData.password);
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw ConflictException when user already exists', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      await service.create(
        userData.email,
        userData.password,
        userData.firstName,
        userData.lastName,
      );

      await expect(
        service.create(userData.email, 'AnotherPassword123!', 'Jane', 'Smith'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      await service.create(
        userData.email,
        userData.password,
        userData.firstName,
        userData.lastName,
      );

      const foundUser = await service.findByEmail(userData.email);

      expect(foundUser).toBeDefined();
      expect(foundUser?.email).toBe(userData.email);
    });

    it('should return null when user not found', async () => {
      const foundUser = await service.findByEmail('nonexistent@example.com');
      expect(foundUser).toBeNull();
    });
  });

  describe('validatePassword', () => {
    it('should validate correct password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const user = await service.create(
        userData.email,
        userData.password,
        userData.firstName,
        userData.lastName,
      );

      const isValid = await service.validatePassword(user, userData.password);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const user = await service.create(
        userData.email,
        userData.password,
        userData.firstName,
        userData.lastName,
      );

      const isValid = await service.validatePassword(user, 'WrongPassword123!');
      expect(isValid).toBe(false);
    });
  });

  describe('updateEmailVerification', () => {
    it('should update email verification status', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const user = await service.create(
        userData.email,
        userData.password,
        userData.firstName,
        userData.lastName,
      );

      const updatedUser = await service.updateEmailVerification(user.id, true);
      expect(updatedUser.isEmailVerified).toBe(true);
    });

    it('should throw NotFoundException for non-existent user', async () => {
      await expect(
        service.updateEmailVerification('nonexistent-id', true),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('role management', () => {
    it('should assign global role', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const user = await service.create(
        userData.email,
        userData.password,
        userData.firstName,
        userData.lastName,
      );

      await service.assignGlobalRole(user.id, 'WEBMASTER');

      // Mock the repository to return the assigned role
      const globalRoleRepo = service['userGlobalRoleRepository'];
      jest.spyOn(globalRoleRepo, 'findOne').mockResolvedValueOnce({
        userId: user.id,
        role: 'WEBMASTER',
      } as UserGlobalRole);

      const primaryRole = await service.findPrimaryRole(user.id);
      expect(primaryRole).toBe('WEBMASTER');
    });

    it('should assign clinic role', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const user = await service.create(
        userData.email,
        userData.password,
        userData.firstName,
        userData.lastName,
      );

      await service.assignClinicRole(user.id, 'VET', 'clinic-id');

      // Mock the repository to return the assigned role
      const clinicRoleRepo = service['userClinicRoleRepository'];
      jest.spyOn(clinicRoleRepo, 'findOne').mockResolvedValueOnce({
        userId: user.id,
        role: 'VET',
        clinicId: 'clinic-id',
      } as UserClinicRole);

      const primaryRole = await service.findPrimaryRole(user.id);
      expect(primaryRole).toBe('VET');
    });

    it('should find roles and clinics', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const user = await service.create(
        userData.email,
        userData.password,
        userData.firstName,
        userData.lastName,
      );

      // Mock repositories to return roles
      const globalRoleRepo = service['userGlobalRoleRepository'];
      const clinicRoleRepo = service['userClinicRoleRepository'];

      jest
        .spyOn(globalRoleRepo, 'find')
        .mockResolvedValueOnce([
          { userId: user.id, role: 'OWNER' } as UserGlobalRole,
        ]);
      jest.spyOn(clinicRoleRepo, 'find').mockResolvedValueOnce([
        {
          userId: user.id,
          role: 'VET',
          clinicId: 'clinic-1',
        } as UserClinicRole,
        {
          userId: user.id,
          role: 'ASV',
          clinicId: 'clinic-2',
        } as UserClinicRole,
      ]);

      const result = await service.findRolesAndClinics(user.id);
      expect(result.roles).toContain('OWNER');
      expect(result.roles).toContain('VET');
      expect(result.roles).toContain('ASV');
      expect(result.clinicIds).toContain('clinic-1');
      expect(result.clinicIds).toContain('clinic-2');
    });
  });
});
