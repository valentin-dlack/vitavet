import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClinicsService } from './clinics.service';
import { Clinic } from './entities/clinic.entity';
import { User } from '../users/entities/user.entity';
import { UserClinicRole } from '../users/entities/user-clinic-role.entity';
import { NotFoundException } from '@nestjs/common';
import { Service as ClinicServiceEntity } from './entities/service.entity';

describe('ClinicsService', () => {
  let service: ClinicsService;
  let repo: Repository<Clinic>;

  const clinics: Clinic[] = [
    {
      id: '1',
      name: 'Clinique A',
      city: 'Paris',
      postcode: '75001',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Clinic,
    {
      id: '2',
      name: 'Clinique B',
      city: 'Paris',
      postcode: '75002',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Clinic,
    {
      id: '3',
      name: 'Clinique C',
      city: 'Lyon',
      postcode: '69001',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Clinic,
  ];

  const repoMock = {
    find: jest.fn(
      (opts?: { where?: { postcode?: { _type: string; _value: string } } }) => {
        const value = opts?.where?.postcode?._value;
        const prefix = typeof value === 'string' ? value.replace('%', '') : '';
        const result: Clinic[] = clinics.filter((c) =>
          prefix ? c.postcode.startsWith(prefix) : true,
        );
        return Promise.resolve(result);
      },
    ),
    findOne: jest.fn(),
  } as unknown as Repository<Clinic>;

  const userRepoMock = {
    find: jest.fn(),
  } as unknown as Repository<User>;

  const ucrRepoMock = {
    find: jest.fn(),
  } as unknown as Repository<UserClinicRole>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClinicsService,
        { provide: getRepositoryToken(Clinic), useValue: repoMock },
        { provide: getRepositoryToken(User), useValue: userRepoMock },
        { provide: getRepositoryToken(UserClinicRole), useValue: ucrRepoMock },
        {
          provide: getRepositoryToken(ClinicServiceEntity),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(
              (x: Partial<ClinicServiceEntity>) => x as ClinicServiceEntity,
            ),
          },
        },
      ],
    }).compile();

    service = module.get<ClinicsService>(ClinicsService);
    repo = module.get(getRepositoryToken(Clinic));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(repo).toBeDefined();
  });

  it('searchByPostcode returns clinics by prefix', async () => {
    const results = await service.searchByPostcode('7500');
    expect(results).toHaveLength(2);
    expect(results.map((c) => c.id)).toEqual(['1', '2']);
  });

  it('searchByPostcode with services OR filter returns subset', async () => {
    const serviceRepo = {
      find: jest
        .fn()
        .mockResolvedValue([
          { id: 'srv1', slug: 'urgence', label: 'Urgences' },
        ]),
    } as any;
    // Inject mocked service repository into service instance
    (service as any).serviceRepository = serviceRepo;
    // Mock clinics with relations
    (repo.find as any) = jest.fn().mockResolvedValue(clinics);
    // find with relations
    const findMock = repo.find as unknown as jest.Mock;
    findMock.mockResolvedValueOnce(clinics);
    findMock.mockResolvedValueOnce(
      clinics.map((c, i) => ({
        ...c,
        services: i === 0 ? [{ id: 'srv1' }] : [],
      })),
    );
    const results = await service.searchByPostcode('750', ['urgence']);
    expect(serviceRepo.find).toHaveBeenCalled();
    expect(results.length).toBeGreaterThan(0);
  });

  describe('getVetsByClinic', () => {
    it('should return vets for existing clinic', async () => {
      const clinicId = '550e8400-e29b-41d4-a716-446655440000';
      const mockClinic = { id: clinicId, name: 'Test Clinic' };

      jest.spyOn(repo, 'findOne').mockResolvedValue(mockClinic as any);
      (ucrRepoMock.find as any) = jest.fn().mockResolvedValue([
        { userId: 'v1', clinicId, role: 'VET' },
        { userId: 'v2', clinicId, role: 'VET' },
      ]);
      (userRepoMock.find as any) = jest.fn().mockResolvedValue([
        { id: 'v1', firstName: 'Vet', lastName: 'One', email: 'v1@ex.com' },
        { id: 'v2', firstName: 'Vet', lastName: 'Two', email: 'v2@ex.com' },
      ]);

      const result = await service.getVetsByClinic(clinicId);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('firstName');
      expect(result[0]).toHaveProperty('lastName');
      expect(result[0]).toHaveProperty('email');
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: clinicId },
      });
    });

    it('should throw NotFoundException for non-existing clinic', async () => {
      const clinicId = 'non-existing-id';

      jest.spyOn(repo, 'findOne').mockResolvedValue(null);

      await expect(service.getVetsByClinic(clinicId)).rejects.toThrow(
        NotFoundException,
      );
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: clinicId },
      });
    });
  });
});
