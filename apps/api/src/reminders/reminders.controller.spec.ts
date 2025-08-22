import { Test, TestingModule } from '@nestjs/testing';
import { RemindersController } from './reminders.controller';
import { RemindersService } from './reminders.service';

describe('RemindersController', () => {
  let controller: RemindersController;
  const serviceMock = {
    planAppointmentReminders: jest.fn(),
    processDueReminders: jest.fn(),
    listInstances: jest.fn(),
  } as unknown as RemindersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RemindersController],
      providers: [{ provide: RemindersService, useValue: serviceMock }],
    }).compile();
    controller = module.get<RemindersController>(RemindersController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('planForAppointment calls service and returns planned true', async () => {
    (serviceMock.planAppointmentReminders as any) = jest
      .fn()
      .mockResolvedValue(undefined);
    const res = await controller.planForAppointment('apt1');
    expect(serviceMock.planAppointmentReminders).toHaveBeenCalledWith('apt1');
    expect(res).toEqual({ planned: true });
  });

  it('runDue returns processed count', async () => {
    (serviceMock.processDueReminders as any) = jest.fn().mockResolvedValue(3);
    const res = await controller.runDue();
    expect(res).toEqual({ processed: 3 });
  });

  it('listInstances forwards optional status', async () => {
    (serviceMock.listInstances as any) = jest.fn().mockResolvedValue([]);
    await controller.listInstances('SENT');
    expect(serviceMock.listInstances).toHaveBeenCalledWith('SENT');
  });
});
