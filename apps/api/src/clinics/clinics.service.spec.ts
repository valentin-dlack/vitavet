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
    preload: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  } as unknown as Repository<Clinic>;

  const userRepoMock = {
    find: jest.fn(),
    findOne: jest.fn(),
  } as unknown as Repository<User>;

  const ucrRepoMock = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn((d) => d),
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

  describe('create/update/remove', () => {
    it('creates clinic with active=true', async () => {
      const createDto = { name: 'X', city: 'Y', postcode: '12345' } as any;
      (repoMock.save as any) = jest.fn().mockResolvedValue({ id: 'c1' });
      (repoMock as any).create = jest.fn().mockImplementation((d: any) => d);
      const res = await service.create(createDto);
      expect((repoMock as any).create).toHaveBeenCalledWith(
        expect.objectContaining({ active: true }),
      );
      expect(repoMock.save).toHaveBeenCalled();
      expect(res).toEqual({ id: 'c1' });
    });

    it('updates existing clinic', async () => {
      (repoMock.preload as any) = jest
        .fn()
        .mockResolvedValue({ id: 'c1', name: 'New' });
      (repoMock.save as any) = jest.fn().mockResolvedValue({ id: 'c1' });
      const res = await service.update('c1', { name: 'New' });
      expect(repoMock.preload).toHaveBeenCalled();
      expect(repoMock.save).toHaveBeenCalled();
      expect(res).toEqual({ id: 'c1' });
    });

    it('update throws when clinic not found', async () => {
      (repoMock.preload as any) = jest.fn().mockResolvedValue(null);
      await expect(service.update('missing', {})).rejects.toThrow();
    });

    it('remove deletes when exists', async () => {
      (repoMock.delete as any) = jest.fn().mockResolvedValue({ affected: 1 });
      await service.remove('c1');
      expect(repoMock.delete).toHaveBeenCalledWith('c1');
    });

    it('remove throws when not found', async () => {
      (repoMock.delete as any) = jest.fn().mockResolvedValue({ affected: 0 });
      await expect(service.remove('missing')).rejects.toThrow();
    });
  });

  describe('assignRole and getClinicRoles', () => {
    it('assigns new role when none exists', async () => {
      const clinicId = 'c1';
      (repoMock.findOne as any) = jest.fn().mockResolvedValue({ id: clinicId });
      (userRepoMock.findOne as any) = jest.fn().mockResolvedValue({ id: 'u1' });
      (ucrRepoMock.findOne as any) = jest.fn().mockResolvedValue(null);
      (ucrRepoMock.save as any) = jest.fn().mockResolvedValue({
        userId: 'u1',
        clinicId,
        role: 'VET',
      });
      const res = await service.assignRole(clinicId, {
        userId: 'u1',
        role: 'VET',
      } as any);
      expect(ucrRepoMock.save).toHaveBeenCalled();
      expect(res).toMatchObject({ clinicId, userId: 'u1', role: 'VET' });
    });

    it('updates existing assignment role', async () => {
      const clinicId = 'c1';
      (repoMock.findOne as any) = jest.fn().mockResolvedValue({ id: clinicId });
      (userRepoMock.findOne as any) = jest.fn().mockResolvedValue({ id: 'u1' });
      (ucrRepoMock.findOne as any) = jest
        .fn()
        .mockResolvedValue({ userId: 'u1', clinicId, role: 'ASV' });
      (ucrRepoMock.save as any) = jest.fn().mockImplementation((d) => d);
      const res = await service.assignRole(clinicId, {
        userId: 'u1',
        role: 'VET',
      } as any);
      expect(res).toMatchObject({ role: 'VET' });
    });

    it('getClinicRoles returns roles with user relation', async () => {
      (ucrRepoMock.find as any) = jest
        .fn()
        .mockResolvedValue([{ userId: 'u1', clinicId: 'c1', role: 'VET' }]);
      const res = await service.getClinicRoles('c1');
      expect(ucrRepoMock.find).toHaveBeenCalledWith({
        where: { clinicId: 'c1' },
        relations: ['user'],
      });
      expect(res).toHaveLength(1);
    });
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
