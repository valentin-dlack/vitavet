import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateClinicDto } from '../clinics/dto/create-clinic.dto';

describe('AdminController', () => {
  let controller: AdminController;
  let adminService: jest.Mocked<AdminService>;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    isEmailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    fullName: 'John Doe',
  };

  const mockClinic = {
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
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: {
            createUser: jest.fn(),
            updateUser: jest.fn(),
            removeUser: jest.fn(),
            updateClinic: jest.fn(),
            findAllUsers: jest.fn(),
            findAllClinics: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    adminService = module.get(AdminService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createUser', () => {
    const createUserDto: CreateUserDto = {
      email: 'new@example.com',
      password: 'password123',
      firstName: 'Jane',
      lastName: 'Smith',
    };

    it('should create a user', async () => {
      adminService.createUser.mockResolvedValue(mockUser);

      const result = await controller.createUser(createUserDto);

      expect(adminService.createUser).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateUser', () => {
    const userId = 'user-1';
    const updateUserDto = {
      firstName: 'Updated',
      lastName: 'Name',
    };

    it('should update a user', async () => {
      const updatedUser = { ...mockUser, ...updateUserDto };
      adminService.updateUser.mockResolvedValue(updatedUser);

      const result = await controller.updateUser(userId, updateUserDto);

      expect(adminService.updateUser).toHaveBeenCalledWith(
        userId,
        updateUserDto,
      );
      expect(result).toEqual(updatedUser);
    });
  });

  describe('removeUser', () => {
    const userId = 'user-1';

    it('should remove a user', async () => {
      adminService.removeUser.mockResolvedValue(undefined);

      await controller.removeUser(userId);

      expect(adminService.removeUser).toHaveBeenCalledWith(userId);
    });
  });

  describe('updateClinic', () => {
    const clinicId = 'clinic-1';
    const updateClinicDto: Partial<CreateClinicDto> = {
      name: 'Updated Clinic',
      city: 'Lyon',
    };

    it('should update a clinic', async () => {
      const updatedClinic = { ...mockClinic, ...updateClinicDto };
      adminService.updateClinic.mockResolvedValue(updatedClinic);

      const result = await controller.updateClinic(clinicId, updateClinicDto);

      expect(adminService.updateClinic).toHaveBeenCalledWith(
        clinicId,
        updateClinicDto,
      );
      expect(result).toEqual(updatedClinic);
    });
  });

  describe('findAllUsers', () => {
    it('should return all users', async () => {
      const users = [mockUser];
      adminService.findAllUsers.mockResolvedValue(users);

      const result = await controller.findAllUsers();

      expect(adminService.findAllUsers).toHaveBeenCalled();
      expect(result).toEqual(users);
    });
  });

  describe('findAllClinics', () => {
    it('should return all clinics', async () => {
      const clinics = [mockClinic];
      adminService.findAllClinics.mockResolvedValue(clinics);

      const result = await controller.findAllClinics();

      expect(adminService.findAllClinics).toHaveBeenCalled();
      expect(result).toEqual(clinics);
    });
  });
});
