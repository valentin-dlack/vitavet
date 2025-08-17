import { Test, TestingModule } from '@nestjs/testing';
import { SlotsController } from './slots.controller';
import { SlotsService } from './slots.service';
import { GetSlotsDto } from './dto/get-slots.dto';

describe('SlotsController', () => {
  let controller: SlotsController;
  let service: SlotsService;

  const mockSlots = [
    {
      id: 'slot-1',
      startsAt: '2024-01-15T09:00:00.000Z',
      endsAt: '2024-01-15T09:30:00.000Z',
      durationMinutes: 30,
      vetUserId: '550e8400-e29b-41d4-a716-446655440001',
    },
    {
      id: 'slot-2',
      startsAt: '2024-01-15T09:30:00.000Z',
      endsAt: '2024-01-15T10:00:00.000Z',
      durationMinutes: 30,
      vetUserId: '550e8400-e29b-41d4-a716-446655440001',
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SlotsController],
      providers: [
        {
          provide: SlotsService,
          useValue: {
            getAvailableSlots: jest.fn(() => mockSlots),
            seedDemoSlots: jest.fn(() => Promise.resolve()),
          },
        },
      ],
    }).compile();

    controller = module.get<SlotsController>(SlotsController);
    service = module.get<SlotsService>(SlotsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return available slots', async () => {
    const query: GetSlotsDto = {
      clinicId: '550e8400-e29b-41d4-a716-446655440000',
      date: '2024-01-15',
    };

    const result = await controller.getAvailableSlots(query);

    expect(service.getAvailableSlots).toHaveBeenCalledWith(query);
    expect(result).toEqual(mockSlots);
  });

  it('should seed demo slots', async () => {
    const result = await controller.seedDemoSlots();

    expect(service.seedDemoSlots).toHaveBeenCalled();
    expect(result).toEqual({ message: 'Demo slots seeded successfully' });
  });
});
