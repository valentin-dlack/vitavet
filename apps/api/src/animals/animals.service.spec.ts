import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnimalsService } from './animals.service';
import { Animal } from './entities/animal.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { UserClinicRole } from '../users/entities/user-clinic-role.entity';
import { Clinic } from '../clinics/entities/clinic.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('AnimalsService', () => {
  let service: AnimalsService;
  let repo: Repository<Animal>;
  let clinicRepo: Repository<Clinic>;
  let userClinicRoleRepo: Repository<UserClinicRole>;
  let appointmentRepo: Repository<Appointment>;

  const repoMock = {
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  } as unknown as Repository<Animal>;
  const clinicRepoMock = {
    findOne: jest.fn(),
  } as unknown as Repository<Clinic>;
  const userClinicRoleRepoMock = {
    findOne: jest.fn(),
  } as unknown as Repository<UserClinicRole>;
  const appointmentRepoMock = {
    find: jest.fn(),
  } as unknown as Repository<Appointment>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnimalsService,
        { provide: getRepositoryToken(Animal), useValue: repoMock },
        {
          provide: getRepositoryToken(Appointment),
          useValue: appointmentRepoMock,
        },
        {
          provide: getRepositoryToken(UserClinicRole),
          useValue: userClinicRoleRepoMock,
        },
        { provide: getRepositoryToken(Clinic), useValue: clinicRepoMock },
      ],
    }).compile();

    service = module.get<AnimalsService>(AnimalsService);
    repo = module.get(getRepositoryToken(Animal));
    clinicRepo = module.get(getRepositoryToken(Clinic));
    userClinicRoleRepo = module.get(getRepositoryToken(UserClinicRole));
    appointmentRepo = module.get(getRepositoryToken(Appointment));
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(repo).toBeDefined();
  });

  it('findByOwnerAndClinic returns animals for owner and clinic', async () => {
    (repo.find as any) = jest
      .fn()
      .mockResolvedValue([
        { id: 'a1', ownerId: 'u1', clinicId: 'c1', name: 'Milo' },
      ]);
    const res = await service.findByOwnerAndClinic('u1', 'c1');
    expect(repo.find).toHaveBeenCalledWith({
      where: { ownerId: 'u1', clinicId: 'c1' },
    });
    expect(res).toHaveLength(1);
  });

  describe('createAnimal', () => {
    it('throws when clinic not found', async () => {
      (clinicRepo.findOne as any) = jest.fn().mockResolvedValue(null);
      await expect(
        service.createAnimal(
          { clinicId: 'c-missing', name: 'Nina', species: 'cat' } as any,
          'owner1',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates animal when clinic exists', async () => {
      (clinicRepo.findOne as any) = jest.fn().mockResolvedValue({ id: 'c1' });
      (repo.create as any) = jest
        .fn()
        .mockImplementation((): Animal => ({ id: 'a1' }) as unknown as Animal);
      (repo.save as any) = jest.fn().mockResolvedValue({ id: 'a1' });
      const res = await service.createAnimal(
        { clinicId: 'c1', name: 'Nina', species: 'cat' } as any,
        'owner1',
      );
      expect(repo.create).toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalled();
      expect(res).toEqual({ id: 'a1' });
    });
  });

  describe('getAnimalHistory', () => {
    it('throws when animal not found', async () => {
      (repo.findOne as any) = jest.fn().mockResolvedValue(null);
      await expect(service.getAnimalHistory('u1', 'a-missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('forbids non-owner and non-staff', async () => {
      (repo.findOne as any) = jest
        .fn()
        .mockResolvedValue({ id: 'a1', ownerId: 'ownerX', clinicId: 'c1' });
      (userClinicRoleRepo.findOne as any) = jest.fn().mockResolvedValue(null);
      await expect(service.getAnimalHistory('intruder', 'a1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('returns history for owner with notes stripped', async () => {
      (repo.findOne as any) = jest
        .fn()
        .mockResolvedValue({ id: 'a1', ownerId: 'u1', clinicId: 'c1' });
      (appointmentRepo.find as any) = jest.fn().mockResolvedValue([
        {
          id: 'apt1',
          notes: 'internal',
          startsAt: new Date('2024-01-01T09:00:00.000Z'),
          endsAt: new Date('2024-01-01T09:30:00.000Z'),
          vet: {},
          type: {},
          clinic: {},
        },
      ]);
      const res = await service.getAnimalHistory('u1', 'a1');
      expect(res.animal.id).toBe('a1');
      expect(res.appointments[0]).not.toHaveProperty('notes');
    });

    it('returns full history for staff', async () => {
      (repo.findOne as any) = jest
        .fn()
        .mockResolvedValue({ id: 'a1', ownerId: 'owner', clinicId: 'c1' });
      (userClinicRoleRepo.findOne as any) = jest
        .fn()
        .mockResolvedValue({ userId: 'vet1', role: 'VET' });
      (appointmentRepo.find as any) = jest
        .fn()
        .mockResolvedValue([{ id: 'apt1', notes: 'internal' }]);
      const res = await service.getAnimalHistory('vet1', 'a1');
      expect(res.appointments[0]).toHaveProperty('notes', 'internal');
    });
  });
});
