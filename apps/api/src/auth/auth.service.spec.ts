import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

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
  };

  const mockJwtService = {
    sign: jest.fn(),
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
      mockUsersService.findRolesAndClinics.mockResolvedValue(mockRolesAndClinics);

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
});
