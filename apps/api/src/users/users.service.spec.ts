import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { User } from './entities/user.entity';

// Simple in-memory mock repository
function createUserRepositoryMock() {
  const users: User[] = [] as unknown as User[];
  return {
    // findOne supports where: { email } or { id }
    findOne: jest.fn(async ({ where }: { where: Partial<User> }) => {
      if (where.email) {
        return users.find((u) => u.email === where.email) ?? null;
      }
      if (where.id) {
        return users.find((u) => u.id === where.id) ?? null;
      }
      return null;
    }),
    create: jest.fn((data: Partial<User>) => data as User),
    save: jest.fn(async (data: Partial<User>) => {
      // if existing, update
      const existingIndex = users.findIndex((u) => u.id === (data as User).id);
      const now = new Date();
      if (existingIndex >= 0) {
        const updated = { ...users[existingIndex], ...data, updatedAt: now } as User;
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
    find: jest.fn(async () => users),
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
});
