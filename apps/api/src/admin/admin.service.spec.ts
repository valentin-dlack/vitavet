import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { UsersService } from '../users/users.service';
import { ClinicsService } from '../clinics/clinics.service';
import { User } from '../users/entities/user.entity';
import { Clinic } from '../clinics/entities/clinic.entity';
import { CreateUserDto } from './dto/create-user.dto';

describe('AdminService', () => {
  let service: AdminService;
  let usersService: jest.Mocked<UsersService>;
  let clinicsService: jest.Mocked<ClinicsService>;

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    password: 'hashedPassword',
    isEmailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    fullName: 'John Doe',
  };

  const mockClinic: Clinic = {
    id: 'clinic-1',
    name: 'Test Clinic',
    city: 'Paris',
    postcode: '75001',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
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
      email: 'new@example.com',
      password: 'password123',
      firstName: 'Jane',
      lastName: 'Smith',
    };

    it('should create a user successfully', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(mockUser);

      const result = await service.createUser(createUserDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(
        createUserDto.email,
      );
      expect(usersService.create).toHaveBeenCalledWith(
        createUserDto.email,
        createUserDto.password,
        createUserDto.firstName,
        createUserDto.lastName,
        'ASV',
      );
      expect(result).toEqual(mockUser);
    });

    it('should throw ConflictException if user already exists', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);

      await expect(service.createUser(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      expect(usersService.create).not.toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    const userId = 'user-1';
    const updateUserDto = {
      firstName: 'Updated',
      lastName: 'Name',
    };

    it('should update a user successfully', async () => {
      const updatedUser = {
        ...mockUser,
        ...updateUserDto,
        fullName: 'Updated Name',
      };
      usersService.update.mockResolvedValue(updatedUser);

      const result = await service.updateUser(userId, updateUserDto);

      expect(usersService.update).toHaveBeenCalledWith(userId, updateUserDto);
      expect(result).toEqual({
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        isEmailVerified: updatedUser.isEmailVerified,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
        fullName: 'Updated Name',
      });
    });
  });

  describe('removeUser', () => {
    const userId = 'user-1';

    it('should remove a user successfully', async () => {
      usersService.remove.mockResolvedValue(undefined);

      await service.removeUser(userId);

      expect(usersService.remove).toHaveBeenCalledWith(userId);
    });
  });

  describe('updateClinic', () => {
    const clinicId = 'clinic-1';
    const updateClinicDto = {
      name: 'Updated Clinic',
      city: 'Lyon',
    };

    it('should update a clinic successfully', async () => {
      const updatedClinic = { ...mockClinic, ...updateClinicDto };
      clinicsService.update.mockResolvedValue(updatedClinic);

      const result = await service.updateClinic(clinicId, updateClinicDto);

      expect(clinicsService.update).toHaveBeenCalledWith(
        clinicId,
        updateClinicDto,
      );
      expect(result).toEqual(updatedClinic);
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
      const clinics = [mockClinic];
      clinicsService.findAll.mockResolvedValue(clinics);

      const result = await service.findAllClinics();

      expect(clinicsService.findAll).toHaveBeenCalled();
      expect(result).toEqual(clinics);
    });
  });
});
