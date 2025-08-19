import { Test, TestingModule } from '@nestjs/testing';
import { AnimalsController } from './animals.controller';
import { AnimalsService } from './animals.service';
import { User } from '../users/entities/user.entity';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('AnimalsController', () => {
  let controller: AnimalsController;
  let service: AnimalsService;

  const mockAnimalsService = {
    findByOwnerAndClinic: jest.fn(),
    getAnimalHistory: jest.fn(),
    createAnimal: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnimalsController],
      providers: [
        {
          provide: AnimalsService,
          useValue: mockAnimalsService,
        },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AnimalsController>(AnimalsController);
    service = module.get<AnimalsService>(AnimalsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMyAnimals', () => {
    it('should return animals for owner', async () => {
      const mockUser = { id: 'user-123' } as User;
      const mockAnimals = [
        { id: 'animal-1', name: 'Milo', ownerId: 'user-123' },
      ];

      mockAnimalsService.findByOwnerAndClinic.mockResolvedValue(mockAnimals);

      const result = await controller.getMyAnimals(mockUser, 'clinic-123');

      expect(service.findByOwnerAndClinic).toHaveBeenCalledWith(
        'user-123',
        'clinic-123',
      );
      expect(result).toEqual(mockAnimals);
    });
  });

  describe('getAnimalHistory', () => {
    it('should return animal history', async () => {
      const mockUser = { id: 'user-123' } as User;
      const mockHistory = {
        animal: { id: 'animal-1', name: 'Milo' },
        appointments: [],
      };

      mockAnimalsService.getAnimalHistory.mockResolvedValue(mockHistory);

      const result = await controller.getAnimalHistory(mockUser, 'animal-1');

      expect(service.getAnimalHistory).toHaveBeenCalledWith(
        'user-123',
        'animal-1',
      );
      expect(result).toEqual(mockHistory);
    });
  });

  describe('createAnimal', () => {
    it('should create a new animal', async () => {
      const mockUser = { id: 'user-123' } as User;
      const createDto = {
        name: 'Milo',
        species: 'chien',
        breed: 'Labrador',
        clinicId: 'clinic-123',
      };
      const mockAnimal = {
        id: 'animal-123',
        ...createDto,
        ownerId: 'user-123',
      };

      mockAnimalsService.createAnimal.mockResolvedValue(mockAnimal);

      const result = await controller.createAnimal(mockUser, createDto);

      expect(service.createAnimal).toHaveBeenCalledWith(createDto, 'user-123');
      expect(result).toEqual(mockAnimal);
    });
  });
});
