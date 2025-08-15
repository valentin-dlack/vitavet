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
