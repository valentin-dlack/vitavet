import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { UsersService } from '../users/users.service';
import { ClinicsService } from '../clinics/clinics.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '../users/entities/user.entity';

describe('AdminService', () => {
  let service: AdminService;
  let usersService: jest.Mocked<UsersService>;
  let clinicsService: jest.Mocked<ClinicsService>;

  const mockUser: Omit<User, 'password'> = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    isEmailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    fullName: 'John Doe',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            removeAllRoles: jest.fn(),
            assignGlobalRole: jest.fn(),
            assignClinicRole: jest.fn(),
            findAll: jest.fn(),
          },
        },
        {
          provide: ClinicsService,
          useValue: {
            update: jest.fn(),
            findAll: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    usersService = module.get(UsersService);
    clinicsService = module.get(ClinicsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      password: 'password123',
      role: 'ASV',
      clinicId: 'clinic-1',
    };

    it('should create a user with clinic role successfully', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(mockUser as User);

      const result = await service.createUser(createUserDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(usersService.create).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        'John',
        'Doe',
        'ASV',
        'clinic-1',
      );
      expect(result).toEqual(mockUser);
    });

    it('should create a user with global role successfully', async () => {
      const globalRoleDto = { ...createUserDto, role: 'OWNER' as const, clinicId: undefined };
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(mockUser as User);

      const result = await service.createUser(globalRoleDto);

      expect(usersService.create).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        'John',
        'Doe',
        'OWNER',
        '',
      );
      expect(result).toEqual(mockUser);
    });

    it('should throw ConflictException if user already exists', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as User);

      await expect(service.createUser(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException if clinic role has no clinicId', async () => {
      const invalidDto = { ...createUserDto, clinicId: undefined };

      await expect(service.createUser(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if global role has clinicId', async () => {
      const invalidDto = { ...createUserDto, role: 'OWNER' as const, clinicId: 'clinic-1' };

      await expect(service.createUser(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(usersService.create).not.toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    const updateUserDto: UpdateUserDto = {
      email: 'updated@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'VET',
      clinicId: 'clinic-2',
    };

    it('should update user with new clinic role successfully', async () => {
      usersService.update.mockResolvedValue(mockUser as User);
      usersService.removeAllRoles.mockResolvedValue();
      usersService.assignClinicRole.mockResolvedValue();

      const result = await service.updateUser('user-1', updateUserDto);

      expect(usersService.update).toHaveBeenCalledWith('user-1', {
        email: 'updated@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
      });
      expect(usersService.removeAllRoles).toHaveBeenCalledWith('user-1');
      expect(usersService.assignClinicRole).toHaveBeenCalledWith(
        'user-1',
        'VET',
        'clinic-2',
      );
      expect(result).toEqual({ ...mockUser, fullName: 'John Doe' });
    });

    it('should update user with new global role successfully', async () => {
      const globalRoleDto = { ...updateUserDto, role: 'WEBMASTER' as const, clinicId: undefined };
      usersService.update.mockResolvedValue(mockUser as User);
      usersService.removeAllRoles.mockResolvedValue();
      usersService.assignGlobalRole.mockResolvedValue();

      const result = await service.updateUser('user-1', globalRoleDto);

      expect(usersService.removeAllRoles).toHaveBeenCalledWith('user-1');
      expect(usersService.assignGlobalRole).toHaveBeenCalledWith(
        'user-1',
        'WEBMASTER',
      );
      expect(result).toEqual({ ...mockUser, fullName: 'John Doe' });
    });

    it('should update user without changing role if role not provided', async () => {
      const { role, clinicId, ...userData } = updateUserDto;
      usersService.update.mockResolvedValue(mockUser as User);

      const result = await service.updateUser('user-1', userData);

      expect(usersService.update).toHaveBeenCalledWith('user-1', userData);
      expect(usersService.removeAllRoles).not.toHaveBeenCalled();
      expect(usersService.assignGlobalRole).not.toHaveBeenCalled();
      expect(usersService.assignClinicRole).not.toHaveBeenCalled();
      expect(result).toEqual({ ...mockUser, fullName: 'John Doe' });
    });

    it('should throw BadRequestException if clinic role has no clinicId', async () => {
      const invalidDto = { ...updateUserDto, clinicId: undefined };

      await expect(service.updateUser('user-1', invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if global role has clinicId', async () => {
      const invalidDto = { ...updateUserDto, role: 'OWNER' as const, clinicId: 'clinic-1' };

      await expect(service.updateUser('user-1', invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('removeUser', () => {
    it('should remove user successfully', async () => {
      usersService.remove.mockResolvedValue();

      await service.removeUser('user-1');

      expect(usersService.remove).toHaveBeenCalledWith('user-1');
    });
  });

  describe('findAllUsers', () => {
    it('should return all users', async () => {
      const users = [mockUser];
      usersService.findAll.mockResolvedValue(users);

      const result = await service.findAllUsers();

      expect(usersService.findAll).toHaveBeenCalled();
      expect(result).toEqual(users);
    });
  });

  describe('findAllClinics', () => {
    it('should return all clinics', async () => {
      const clinics = [{ 
        id: 'clinic-1', 
        name: 'Test Clinic',
        city: 'Paris',
        postcode: '75001',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }];
      clinicsService.findAll.mockResolvedValue(clinics);

      const result = await service.findAllClinics();

      expect(clinicsService.findAll).toHaveBeenCalled();
      expect(result).toEqual(clinics);
    });
  });
});
