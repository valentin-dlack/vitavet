import { Test, TestingModule } from '@nestjs/testing';
import { RemindersProcessor } from './reminders.processor';
import { RemindersService } from './reminders.service';

describe('RemindersProcessor', () => {
  let processor: RemindersProcessor;
  const serviceMock = {
    processDueReminders: jest.fn(),
  } as unknown as RemindersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RemindersProcessor,
        { provide: RemindersService, useValue: serviceMock },
      ],
    }).compile();

    processor = module.get<RemindersProcessor>(RemindersProcessor);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  it('handleCron calls processDueReminders', async () => {
    (serviceMock.processDueReminders as any) = jest.fn().mockResolvedValue();
    await processor.handleCron();
    expect(serviceMock.processDueReminders).toHaveBeenCalled();
  });
});
