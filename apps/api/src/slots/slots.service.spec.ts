import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SlotsService } from './slots.service';
import { TimeSlot } from './entities/time-slot.entity';
import { GetSlotsDto } from './dto/get-slots.dto';
import { Appointment } from '../appointments/entities/appointment.entity';
import { AgendaBlock } from '../agenda/entities/agenda-block.entity';

describe('SlotsService', () => {
  let service: SlotsService;
  let repo: Repository<TimeSlot>;

  const timeRepoMock = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  } as unknown as Repository<TimeSlot>;

  const appointmentRepoMock = {
    find: jest.fn(),
  } as unknown as Repository<Appointment>;

  const blockRepoMock = {
    find: jest.fn().mockResolvedValue([]),
  } as unknown as Repository<AgendaBlock>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SlotsService,
        { provide: getRepositoryToken(TimeSlot), useValue: timeRepoMock },
        {
          provide: getRepositoryToken(Appointment),
          useValue: appointmentRepoMock,
        },
        {
          provide: getRepositoryToken(AgendaBlock),
          useValue: blockRepoMock,
        },
      ],
    }).compile();

    service = module.get<SlotsService>(SlotsService);
    repo = module.get(getRepositoryToken(TimeSlot));
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(repo).toBeDefined();
  });

  it('should return available slots for a clinic and date', async () => {
    const query: GetSlotsDto = {
      clinicId: '550e8400-e29b-41d4-a716-446655440000',
      date: '2024-01-15',
    };

    // day variable not used; remove to satisfy linter
    const s1 = {
      id: 's1',
      clinicId: query.clinicId,
      vetUserId: 'v',
      startsAt: new Date('2024-01-15T09:00:00.000Z'),
      endsAt: new Date('2024-01-15T09:30:00.000Z'),
      isAvailable: true,
      durationMinutes: 30,
    } as any;
    const s2 = {
      id: 's2',
      clinicId: query.clinicId,
      vetUserId: 'v',
      startsAt: new Date('2024-01-15T09:30:00.000Z'),
      endsAt: new Date('2024-01-15T10:00:00.000Z'),
      isAvailable: true,
      durationMinutes: 30,
    } as any;
    (timeRepoMock.find as any) = jest.fn().mockResolvedValue([s1, s2]);
    (appointmentRepoMock.find as any) = jest.fn().mockResolvedValue([]);
    (blockRepoMock.find as any) = jest.fn().mockResolvedValue([]);

    const result = await service.getAvailableSlots(query);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    // Check slot structure
    const firstSlot = result[0];
    expect(firstSlot).toHaveProperty('id');
    expect(firstSlot).toHaveProperty('startsAt');
    expect(firstSlot).toHaveProperty('endsAt');
    expect(firstSlot).toHaveProperty('durationMinutes');
    expect(firstSlot.durationMinutes).toBe(30);
  });

  it('should filter slots by vet when vetUserId is provided', async () => {
    const query: GetSlotsDto = {
      clinicId: '550e8400-e29b-41d4-a716-446655440000',
      date: '2024-01-15',
      vetUserId: '550e8400-e29b-41d4-a716-446655440001',
    };

    const s1 = {
      id: 's1',
      clinicId: query.clinicId,
      vetUserId: query.vetUserId,
      startsAt: new Date('2024-01-15T09:00:00.000Z'),
      endsAt: new Date('2024-01-15T09:30:00.000Z'),
      isAvailable: true,
      durationMinutes: 30,
    } as any;
    const s2 = {
      id: 's2',
      clinicId: query.clinicId,
      vetUserId: query.vetUserId,
      startsAt: new Date('2024-01-15T09:30:00.000Z'),
      endsAt: new Date('2024-01-15T10:00:00.000Z'),
      isAvailable: true,
      durationMinutes: 30,
    } as any;
    (timeRepoMock.find as any) = jest.fn().mockResolvedValue([s1, s2]);
    (appointmentRepoMock.find as any) = jest.fn().mockResolvedValue([]);
    (blockRepoMock.find as any) = jest.fn().mockResolvedValue([]);

    const result = await service.getAvailableSlots(query);

    expect(Array.isArray(result)).toBe(true);

    // All slots should have the same vetUserId
    result.forEach((slot) => {
      expect(slot.vetUserId).toBe('550e8400-e29b-41d4-a716-446655440001');
    });
  });

  it('should return slots sorted by start time', async () => {
    const query: GetSlotsDto = {
      clinicId: '550e8400-e29b-41d4-a716-446655440000',
      date: '2024-01-15',
    };

    const s1 = {
      id: 's1',
      clinicId: query.clinicId,
      vetUserId: 'v',
      startsAt: new Date('2024-01-15T10:00:00.000Z'),
      endsAt: new Date('2024-01-15T10:30:00.000Z'),
      isAvailable: true,
      durationMinutes: 30,
    } as any;
    const s2 = {
      id: 's2',
      clinicId: query.clinicId,
      vetUserId: 'v',
      startsAt: new Date('2024-01-15T09:30:00.000Z'),
      endsAt: new Date('2024-01-15T10:00:00.000Z'),
      isAvailable: true,
      durationMinutes: 30,
    } as any;
    (timeRepoMock.find as any) = jest.fn().mockResolvedValue([s1, s2]);
    (appointmentRepoMock.find as any) = jest.fn().mockResolvedValue([]);
    (blockRepoMock.find as any) = jest.fn().mockResolvedValue([]);

    const result = await service.getAvailableSlots(query);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(1);

    // Check if slots are sorted by start time
    for (let i = 1; i < result.length; i++) {
      const prevTime = new Date(result[i - 1].startsAt).getTime();
      const currentTime = new Date(result[i].startsAt).getTime();
      expect(currentTime).toBeGreaterThanOrEqual(prevTime);
    }
  });

  it('filters out slots overlapping appointments (non-cancelled)', async () => {
    const query: any = { clinicId: 'c1', date: '2024-01-15' };
    const s1 = {
      id: 's1',
      clinicId: 'c1',
      vetUserId: 'v1',
      startsAt: new Date('2024-01-15T09:00:00.000Z'),
      endsAt: new Date('2024-01-15T09:30:00.000Z'),
      isAvailable: true,
      durationMinutes: 30,
    } as any;
    const s2 = {
      id: 's2',
      clinicId: 'c1',
      vetUserId: 'v1',
      startsAt: new Date('2024-01-15T09:30:00.000Z'),
      endsAt: new Date('2024-01-15T10:00:00.000Z'),
      isAvailable: true,
      durationMinutes: 30,
    } as any;
    (timeRepoMock.find as any) = jest.fn().mockResolvedValue([s1, s2]);
    (appointmentRepoMock.find as any) = jest.fn().mockResolvedValue([
      {
        id: 'apt1',
        clinicId: 'c1',
        vetUserId: 'v1',
        status: 'CONFIRMED',
        startsAt: new Date('2024-01-15T09:15:00.000Z'),
        endsAt: new Date('2024-01-15T09:45:00.000Z'),
      },
      {
        id: 'apt2',
        clinicId: 'c1',
        vetUserId: 'v1',
        status: 'CANCELLED',
        startsAt: new Date('2024-01-15T09:00:00.000Z'),
        endsAt: new Date('2024-01-15T09:30:00.000Z'),
      },
    ]);
    (blockRepoMock.find as any) = jest.fn().mockResolvedValue([]);
    const result = await service.getAvailableSlots(query);
    // Both s1 and s2 overlap with 09:15-09:45 appointment
    expect(result.map((r) => r.id)).toEqual([]);
  });

  it('filters out slots overlapping blocks and respects vet filter logic', async () => {
    const query: any = { clinicId: 'c1', date: '2024-01-15' };
    const s1 = {
      id: 's1',
      clinicId: 'c1',
      vetUserId: 'v1',
      startsAt: new Date('2024-01-15T09:00:00.000Z'),
      endsAt: new Date('2024-01-15T09:30:00.000Z'),
      isAvailable: true,
      durationMinutes: 30,
    } as any;
    const s2 = {
      id: 's2',
      clinicId: 'c1',
      vetUserId: 'v2',
      startsAt: new Date('2024-01-15T09:30:00.000Z'),
      endsAt: new Date('2024-01-15T10:00:00.000Z'),
      isAvailable: true,
      durationMinutes: 30,
    } as any;
    (timeRepoMock.find as any) = jest.fn().mockResolvedValue([s1, s2]);
    (appointmentRepoMock.find as any) = jest.fn().mockResolvedValue([]);
    (blockRepoMock.find as any) = jest.fn().mockResolvedValue([
      {
        clinicId: 'c1',
        vetUserId: 'v1',
        blockStartsAt: new Date('2024-01-15T08:45:00.000Z'),
        blockEndsAt: new Date('2024-01-15T09:15:00.000Z'),
      },
    ]);
    const result = await service.getAvailableSlots(query);
    // s1 overlaps block -> removed, s2 kept (block for different vet)
    expect(result.map((r) => r.id)).toEqual(['s2']);
  });

  it('filters out slots not within the day', async () => {
    const query: any = { clinicId: 'c1', date: '2024-01-15' };
    const sEarly = {
      id: 'sEarly',
      clinicId: 'c1',
      // Far enough before to be excluded regardless of timezone handling
      startsAt: new Date('2024-01-13T00:00:00.000Z'),
      endsAt: new Date('2024-01-13T00:30:00.000Z'),
      isAvailable: true,
      durationMinutes: 30,
    } as any;
    const sIn = {
      id: 'sIn',
      clinicId: 'c1',
      startsAt: new Date('2024-01-15T10:00:00.000Z'),
      endsAt: new Date('2024-01-15T10:30:00.000Z'),
      isAvailable: true,
      durationMinutes: 30,
    } as any;
    const sLate = {
      id: 'sLate',
      clinicId: 'c1',
      // Far enough after to be excluded regardless of timezone handling
      startsAt: new Date('2024-01-17T00:00:01.000Z'),
      endsAt: new Date('2024-01-17T00:30:01.000Z'),
      isAvailable: true,
      durationMinutes: 30,
    } as any;
    (timeRepoMock.find as any) = jest
      .fn()
      .mockResolvedValue([sEarly, sIn, sLate]);
    (appointmentRepoMock.find as any) = jest.fn().mockResolvedValue([]);
    (blockRepoMock.find as any) = jest.fn().mockResolvedValue([]);
    const result = await service.getAvailableSlots(query);
    expect(result.map((r) => r.id)).toEqual(['sIn']);
  });
});
