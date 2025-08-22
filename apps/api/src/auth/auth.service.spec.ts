import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { AccountDeletionRequest } from './entities/account-deletion-request.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUsersService = {
    create: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    validatePassword: jest.fn(),
    findPrimaryRole: jest.fn().mockResolvedValue(null),
    findRolesAndClinics: jest
      .fn()
      .mockResolvedValue({ roles: [], clinicIds: [] }),
    update: jest.fn(),
    updatePassword: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockDeletionRequestRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: getRepositoryToken(AccountDeletionRequest),
          useValue: mockDeletionRequestRepo,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockUser = {
        id: '123',
        email: 'test@example.com',
        password: 'hashedPassword',
        firstName: 'John',
        lastName: 'Doe',
        isEmailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.register(registerDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(usersService.create).toHaveBeenCalledWith(
        registerDto.email,
        registerDto.password,
        registerDto.firstName,
        registerDto.lastName,
      );
      expect(jwtService.sign).toHaveBeenCalled();
      expect(result.user.email).toBe(registerDto.email);
      expect(result.token).toBe('jwt-token');
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user data with roles and clinics', async () => {
      const userId = 'user-123';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockRolesAndClinics = {
        roles: ['OWNER', 'VET'],
        clinicIds: ['clinic-1', 'clinic-2'],
      };

      mockUsersService.findById.mockResolvedValue(mockUser);
      mockUsersService.findRolesAndClinics.mockResolvedValue(
        mockRolesAndClinics,
      );

      const result = await service.getCurrentUser(userId);

      expect(usersService.findById).toHaveBeenCalledWith(userId);
      expect(usersService.findRolesAndClinics).toHaveBeenCalledWith(userId);
      expect(result).toEqual({
        id: userId,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        roles: ['OWNER', 'VET'],
        clinics: ['clinic-1', 'clinic-2'],
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      const userId = 'non-existent-user';

      mockUsersService.findById.mockResolvedValue(null);

      await expect(service.getCurrentUser(userId)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(usersService.findById).toHaveBeenCalledWith(userId);
    });

    it('should handle empty roles and clinics gracefully', async () => {
      const userId = 'user-123';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUsersService.findById.mockResolvedValue(mockUser);
      mockUsersService.findRolesAndClinics.mockResolvedValue({
        roles: null,
        clinicIds: null,
      });

      const result = await service.getCurrentUser(userId);

      expect(result.roles).toEqual([]);
      expect(result.clinics).toEqual([]);
    });

    it('should throw ConflictException when user already exists', async () => {
      const registerDto: RegisterDto = {
        email: 'existing@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockUsersService.findByEmail.mockResolvedValue({
        id: '123',
        email: 'existing@example.com',
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const mockUser = {
        id: '123',
        email: 'test@example.com',
        password: 'hashedPassword',
        firstName: 'John',
        lastName: 'Doe',
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.validatePassword.mockResolvedValue(true);
      mockUsersService.findRolesAndClinics.mockResolvedValue({
        roles: ['OWNER'],
        clinicIds: ['clinic-1'],
      });
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login(loginDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(usersService.validatePassword).toHaveBeenCalledWith(
        mockUser,
        loginDto.password,
      );
      expect(jwtService.sign).toHaveBeenCalled();
      expect(result.user.email).toBe(loginDto.email);
      expect(result.token).toBe('jwt-token');
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      const loginDto: LoginDto = {
        email: 'nonexistent@example.com',
        password: 'Password123!',
      };

      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const mockUser = {
        id: '123',
        email: 'test@example.com',
        password: 'hashedPassword',
        firstName: 'John',
        lastName: 'Doe',
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.validatePassword.mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('updateProfile', () => {
    it('throws when user not found', async () => {
      mockUsersService.findById.mockResolvedValue(null);
      await expect(
        service.updateProfile('uid', { firstName: 'A' } as UpdateProfileDto),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws when email already used by another user', async () => {
      mockUsersService.findById.mockResolvedValue({ id: 'uid', email: 'a@a' });
      mockUsersService.findByEmail.mockResolvedValue({ id: 'other' });
      await expect(
        service.updateProfile('uid', { email: 'b@b' } as UpdateProfileDto),
      ).rejects.toThrow(ConflictException);
    });

    it('updates profile successfully', async () => {
      mockUsersService.findById.mockResolvedValue({ id: 'uid', email: 'a@a' });
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.update = jest
        .fn()
        .mockResolvedValue({ id: 'uid', email: 'b@b', firstName: 'B' });
      const res = await service.updateProfile('uid', {
        email: 'b@b',
        firstName: 'B',
      } as UpdateProfileDto);
      expect(res).toMatchObject({ email: 'b@b', firstName: 'B' });
    });
  });

  describe('changePassword', () => {
    it('throws when user not found', async () => {
      mockUsersService.findById.mockResolvedValue(null);
      await expect(
        service.changePassword('uid', {
          currentPassword: 'x',
          newPassword: 'y',
          confirmPassword: 'y',
        } as ChangePasswordDto),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws when current password invalid', async () => {
      mockUsersService.findById.mockResolvedValue({ id: 'uid' });
      mockUsersService.validatePassword.mockResolvedValue(false);
      await expect(
        service.changePassword('uid', {
          currentPassword: 'bad',
          newPassword: 'y',
          confirmPassword: 'y',
        } as ChangePasswordDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when new and confirm mismatch', async () => {
      mockUsersService.findById.mockResolvedValue({ id: 'uid' });
      mockUsersService.validatePassword.mockResolvedValue(true);
      await expect(
        service.changePassword('uid', {
          currentPassword: 'ok',
          newPassword: 'y',
          confirmPassword: 'z',
        } as ChangePasswordDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('changes password successfully', async () => {
      mockUsersService.findById.mockResolvedValue({ id: 'uid' });
      mockUsersService.validatePassword.mockResolvedValue(true);
      mockUsersService.updatePassword = jest.fn().mockResolvedValue(undefined);
      const res = await service.changePassword('uid', {
        currentPassword: 'ok',
        newPassword: 'y',
        confirmPassword: 'y',
      } as ChangePasswordDto);
      expect(mockUsersService.updatePassword).toHaveBeenCalled();
      expect(res).toEqual({ message: 'Mot de passe modifié avec succès' });
    });
  });

  describe('requestAccountDeletion & getDeletionRequestStatus', () => {
    it('throws when user not found', async () => {
      mockUsersService.findById.mockResolvedValue(null);
      await expect(
        service.requestAccountDeletion('uid', {
          password: 'p',
          reason: 'r',
        } as DeleteAccountDto),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws when password invalid', async () => {
      mockUsersService.findById.mockResolvedValue({ id: 'uid' });
      mockUsersService.validatePassword.mockResolvedValue(false);
      await expect(
        service.requestAccountDeletion('uid', {
          password: 'bad',
          reason: 'r',
        } as DeleteAccountDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when pending request already exists', async () => {
      mockUsersService.findById.mockResolvedValue({ id: 'uid' });
      mockUsersService.validatePassword.mockResolvedValue(true);
      (mockDeletionRequestRepo.findOne as any) = jest
        .fn()
        .mockResolvedValue({ id: 'existing' });
      await expect(
        service.requestAccountDeletion('uid', {
          password: 'ok',
          reason: 'r',
        } as DeleteAccountDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates deletion request when no pending', async () => {
      mockUsersService.findById.mockResolvedValue({ id: 'uid' });
      mockUsersService.validatePassword.mockResolvedValue(true);
      (mockDeletionRequestRepo.findOne as any) = jest
        .fn()
        .mockResolvedValue(null);
      (mockDeletionRequestRepo.create as any) = jest
        .fn()
        .mockImplementation(
          (d: any) => ({ id: 'new', ...d }) as AccountDeletionRequest,
        );
      (mockDeletionRequestRepo.save as any) = jest
        .fn()
        .mockResolvedValue({ id: 'new' });
      const res = await service.requestAccountDeletion('uid', {
        password: 'ok',
        reason: 'r',
      } as DeleteAccountDto);
      expect(mockDeletionRequestRepo.create).toHaveBeenCalled();
      expect(mockDeletionRequestRepo.save).toHaveBeenCalled();
      expect(res).toHaveProperty('requestId', 'new');
    });

    it('getDeletionRequestStatus returns latest or null', async () => {
      (mockDeletionRequestRepo.findOne as any) = jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 'r1',
          status: 'PENDING',
          reason: 'x',
          createdAt: new Date(),
          adminNotes: null,
          processedAt: null,
        });
      const empty = await service.getDeletionRequestStatus('uid');
      expect(empty).toBeNull();
      const nonEmpty = await service.getDeletionRequestStatus('uid');
      expect(nonEmpty).toHaveProperty('id', 'r1');
    });
  });
});
