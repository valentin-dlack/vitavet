import { Test, TestingModule } from '@nestjs/testing';
import { ClinicsController } from './clinics.controller';
import { ClinicsService } from './clinics.service';
import { GetVetsDto } from './dto/get-vets.dto';

describe('ClinicsController', () => {
  let controller: ClinicsController;
  let service: ClinicsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClinicsController],
      providers: [
        {
          provide: ClinicsService,
          useValue: {
            searchByPostcode: jest.fn(() => [
              { id: '1', name: 'Clinique A', city: 'Paris', postcode: '75001' },
            ]),
            seedDemoData: jest.fn(() => Promise.resolve()),
            getVetsByClinic: jest.fn(() => Promise.resolve([])),
            getAllClinics: jest.fn(() =>
              Promise.resolve([
                {
                  id: '1',
                  name: 'Clinique A',
                  city: 'Paris',
                  postcode: '75001',
                },
                {
                  id: '2',
                  name: 'Clinique B',
                  city: 'Paris',
                  postcode: '75002',
                },
              ]),
            ),
            listServices: jest.fn(() =>
              Promise.resolve([
                { id: 's1', slug: 'consultation', label: 'Consultations' },
                { id: 's2', slug: 'urgence', label: 'Urgences' },
              ]),
            ),
          },
        },
      ],
    }).compile();

    controller = module.get<ClinicsController>(ClinicsController);
    service = module.get<ClinicsService>(ClinicsService);
  });

  it('should return mapped clinics list', async () => {
    const res = await controller.search('75001');
    expect(res).toEqual([
      { id: '1', name: 'Clinique A', city: 'Paris', postcode: '75001' },
    ]);
  });

  it('should seed demo data', async () => {
    const res = await controller.seedDemoData();
    expect(service.seedDemoData).toHaveBeenCalled();
    expect(res).toEqual({ message: 'Demo data seeded successfully' });
  });

  it('should list all clinics when no postcode is provided', async () => {
    const res = await controller.search(undefined as any);
    expect(res).toEqual([
      { id: '1', name: 'Clinique A', city: 'Paris', postcode: '75001' },
      { id: '2', name: 'Clinique B', city: 'Paris', postcode: '75002' },
    ]);
  });

  it('should filter clinics by postcode and services', async () => {
    await controller.search('75001', 'urgence,nac');
    expect(service.searchByPostcode).toHaveBeenCalledWith('75001', [
      'urgence',
      'nac',
    ]);
  });

  it('should list services', async () => {
    const res = await controller.listServices();
    expect(service.listServices).toHaveBeenCalled();
    expect(res).toEqual([
      { id: 's1', slug: 'consultation', label: 'Consultations' },
      { id: 's2', slug: 'urgence', label: 'Urgences' },
    ]);
  });

  it('should allow services-only filtering when postcode is empty', async () => {
    await controller.search('', 'consultation');
    expect(service.searchByPostcode).toHaveBeenCalledWith('', ['consultation']);
  });

  it('should return clinic details with services', async () => {
    (service.getById as any) = jest.fn().mockResolvedValue({
      id: 'c1',
      name: 'X',
      postcode: '75001',
      city: 'Paris',
      services: [{ id: 's1', slug: 'consultation', label: 'Consultations' }],
    });
    const res = await controller.getById('c1');
    expect(service.getById).toHaveBeenCalledWith('c1');
    expect(res).toMatchObject({
      id: 'c1',
      services: [{ slug: 'consultation' }],
    });
  });

  describe('getVetsByClinic', () => {
    it('should return vets for clinic', async () => {
      const clinicId = '550e8400-e29b-41d4-a716-446655440000';
      const mockVets = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          firstName: 'Dr. Martin',
          lastName: 'Dubois',
          email: 'martin.dubois@vitavet.fr',
          specialty: 'Chirurgie générale',
        },
      ];

      jest.spyOn(service, 'getVetsByClinic').mockResolvedValue(mockVets);

      const result = await controller.getVetsByClinic({
        clinicId,
      } as GetVetsDto);

      expect(result).toEqual(mockVets);
      expect(service.getVetsByClinic).toHaveBeenCalledWith(clinicId);
    });
  });
});
