import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '../users/entities/user.entity';

describe('AdminController', () => {
  let controller: AdminController;
  let service: jest.Mocked<AdminService>;

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
    service = module.get(AdminService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
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

    it('should create a user successfully', async () => {
      service.createUser.mockResolvedValue(mockUser);

      const result = await controller.createUser(createUserDto);

      expect(service.createUser).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(mockUser);
    });

    it('should create a user with global role', async () => {
      const globalRoleDto = { ...createUserDto, role: 'OWNER' as const, clinicId: undefined };
      service.createUser.mockResolvedValue(mockUser);

      const result = await controller.createUser(globalRoleDto);

      expect(service.createUser).toHaveBeenCalledWith(globalRoleDto);
      expect(result).toEqual(mockUser);
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

    it('should update a user successfully', async () => {
      service.updateUser.mockResolvedValue(mockUser);

      const result = await controller.updateUser('user-1', updateUserDto);

      expect(service.updateUser).toHaveBeenCalledWith('user-1', updateUserDto);
      expect(result).toEqual(mockUser);
    });

    it('should update user with role change', async () => {
      const roleChangeDto = { role: 'WEBMASTER' as const, clinicId: undefined };
      service.updateUser.mockResolvedValue(mockUser);

      const result = await controller.updateUser('user-1', roleChangeDto);

      expect(service.updateUser).toHaveBeenCalledWith('user-1', roleChangeDto);
      expect(result).toEqual(mockUser);
    });
  });

  describe('removeUser', () => {
    it('should remove a user successfully', async () => {
      service.removeUser.mockResolvedValue();

      await controller.removeUser('user-1');

      expect(service.removeUser).toHaveBeenCalledWith('user-1');
    });
  });

  describe('updateClinic', () => {
    const updateClinicDto = {
      name: 'Updated Clinic',
      city: 'Lyon',
    };

    it('should update a clinic successfully', async () => {
      const mockClinic = { 
        id: 'clinic-1', 
        name: 'Updated Clinic',
        city: 'Lyon',
        postcode: '69000',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      service.updateClinic.mockResolvedValue(mockClinic);

      const result = await controller.updateClinic('clinic-1', updateClinicDto);

      expect(service.updateClinic).toHaveBeenCalledWith('clinic-1', updateClinicDto);
      expect(result).toEqual(mockClinic);
    });
  });

  describe('findAllUsers', () => {
    it('should return all users', async () => {
      const users = [mockUser];
      service.findAllUsers.mockResolvedValue(users);

      const result = await controller.findAllUsers();

      expect(service.findAllUsers).toHaveBeenCalled();
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
      service.findAllClinics.mockResolvedValue(clinics);

      const result = await controller.findAllClinics();

      expect(service.findAllClinics).toHaveBeenCalled();
      expect(result).toEqual(clinics);
    });
  });
});
