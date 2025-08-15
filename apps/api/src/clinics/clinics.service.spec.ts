import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClinicsService } from './clinics.service';
import { Clinic } from './entities/clinic.entity';
import { NotFoundException } from '@nestjs/common';

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
    find: jest.fn(({ where }: any) => {
      const prefix = (where.postcode._value as string).replace('%', '');
      return clinics.filter((c) => c.postcode.startsWith(prefix));
    }),
    findOne: jest.fn(),
  } as unknown as Repository<Clinic>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClinicsService,
        { provide: getRepositoryToken(Clinic), useValue: repoMock },
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

  describe('getVetsByClinic', () => {
    it('should return vets for existing clinic', async () => {
      const clinicId = '550e8400-e29b-41d4-a716-446655440000';
      const mockClinic = { id: clinicId, name: 'Test Clinic' };

      jest.spyOn(repo, 'findOne').mockResolvedValue(mockClinic as any);

      const result = await service.getVetsByClinic(clinicId);

      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('firstName');
      expect(result[0]).toHaveProperty('lastName');
      expect(result[0]).toHaveProperty('email');
      expect(result[0]).toHaveProperty('specialty');
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
