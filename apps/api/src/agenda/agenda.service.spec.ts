import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgendaService } from './agenda.service';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Animal } from '../animals/entities/animal.entity';
import { User } from '../users/entities/user.entity';

describe('AgendaService', () => {
  let service: AgendaService;
  let aptRepo: Repository<Appointment>;
  let animalRepo: Repository<Animal>;
  let userRepo: Repository<User>;

  const aptRepoMock = { find: jest.fn() } as unknown as Repository<Appointment>;
  const animalRepoMock = { find: jest.fn() } as unknown as Repository<Animal>;
  const userRepoMock = { find: jest.fn() } as unknown as Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgendaService,
        { provide: getRepositoryToken(Appointment), useValue: aptRepoMock },
        { provide: getRepositoryToken(Animal), useValue: animalRepoMock },
        { provide: getRepositoryToken(User), useValue: userRepoMock },
      ],
    }).compile();

    service = module.get<AgendaService>(AgendaService);
    aptRepo = module.get(getRepositoryToken(Appointment));
    animalRepo = module.get(getRepositoryToken(Animal));
    userRepo = module.get(getRepositoryToken(User));
    jest.clearAllMocks();
  });

  it('returns empty array if no appointments', async () => {
    (aptRepo.find as any) = jest.fn().mockResolvedValue([]);
    const res = await service.getVetDayAgenda('vet1', new Date('2024-01-10'));
    expect(res).toEqual([]);
  });

  it('returns mapped agenda items within the day with animal and owner', async () => {
    const start = new Date('2024-01-10T00:00:00.000Z');
    const appt = {
      id: 'apt1',
      vetUserId: 'vet1',
      animalId: 'an1',
      status: 'CONFIRMED',
      startsAt: new Date('2024-01-10T09:00:00.000Z'),
      endsAt: new Date('2024-01-10T09:30:00.000Z'),
    } as any;
    (aptRepo.find as any) = jest.fn().mockResolvedValue([appt]);
    (animalRepo.find as any) = jest.fn().mockResolvedValue([
      {
        id: 'an1',
        name: 'Milo',
        ownerId: 'u1',
        birthdate: null,
        species: 'chien',
        breed: 'Labrador',
        weightKg: 30,
      },
    ]);
    (userRepo.find as any) = jest
      .fn()
      .mockResolvedValue([
        { id: 'u1', firstName: 'Olivia', lastName: 'Owner', email: 'o@ex.com' },
      ]);

    const res = await service.getVetDayAgenda('vet1', start);
    expect(aptRepo.find).toHaveBeenCalled();
    expect(res).toHaveLength(1);
    expect(res[0]).toMatchObject({
      id: 'apt1',
      animal: {
        name: 'Milo',
        species: 'chien',
        breed: 'Labrador',
        weightKg: 30,
      },
      owner: { firstName: 'Olivia' },
    });
  });

  it('returns mapped agenda items within a week range', async () => {
    const start = new Date('2024-01-08T00:00:00.000Z');
    const end = new Date('2024-01-14T23:59:59.999Z');
    const appt = {
      id: 'apt2', vetUserId: 'vet1', animalId: 'an2', status: 'PENDING',
      startsAt: new Date('2024-01-10T11:00:00.000Z'), endsAt: new Date('2024-01-10T11:30:00.000Z'),
    } as any;
    (aptRepoMock.find as any) = jest.fn().mockResolvedValue([appt]);
    (animalRepoMock.find as any) = jest.fn().mockResolvedValue([{ id: 'an2', name: 'Luna', ownerId: 'u2' }]);
    (userRepoMock.find as any) = jest.fn().mockResolvedValue([{ id: 'u2', firstName: 'Leo', lastName: 'L', email: 'l@ex.com' }]);
    const res = await service.getVetRangeAgenda('vet1', start, end);
    expect(res).toHaveLength(1);
    expect(res[0]).toMatchObject({ id: 'apt2', owner: { firstName: 'Leo' } });
  });
});
