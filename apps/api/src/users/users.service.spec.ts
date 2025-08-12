import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService],
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
      expect(result.password).not.toBe(userData.password); // Should be hashed
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

      // Create first user
      await service.create(
        userData.email,
        userData.password,
        userData.firstName,
        userData.lastName,
      );

      // Try to create second user with same email
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

    it('should throw NotFoundException for non-existent user', () => {
      expect(() => {
        service.updateEmailVerification('nonexistent-id', true);
      }).toThrow(NotFoundException);
    });
  });
});
