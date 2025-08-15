import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SlotsService } from './slots.service';
import { TimeSlot } from './entities/time-slot.entity';
import { GetSlotsDto } from './dto/get-slots.dto';

describe('SlotsService', () => {
  let service: SlotsService;
  let repo: Repository<TimeSlot>;

  const repoMock = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  } as unknown as Repository<TimeSlot>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SlotsService,
        { provide: getRepositoryToken(TimeSlot), useValue: repoMock },
      ],
    }).compile();

    service = module.get<SlotsService>(SlotsService);
    repo = module.get(getRepositoryToken(TimeSlot));
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

    const result = await service.getAvailableSlots(query);

    expect(Array.isArray(result)).toBe(true);
    
    // All slots should have the same vetUserId
    result.forEach(slot => {
      expect(slot.vetUserId).toBe('550e8400-e29b-41d4-a716-446655440001');
    });
  });

  it('should return slots sorted by start time', async () => {
    const query: GetSlotsDto = {
      clinicId: '550e8400-e29b-41d4-a716-446655440000',
      date: '2024-01-15',
    };

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
});
