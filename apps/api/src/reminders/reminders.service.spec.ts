import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RemindersService } from './reminders.service';
import { ReminderRule } from './entities/reminder-rule.entity';
import { ReminderInstance } from './entities/reminder-instance.entity';
import { NotificationLog } from '../notifications/entities/notification-log.entity';
import { Appointment } from '../appointments/entities/appointment.entity';

describe('RemindersService', () => {
  let service: RemindersService;
  const ruleRepoMock = {
    find: jest.fn(),
  } as unknown as Repository<ReminderRule>;
  const instanceRepoMock = {
    findOne: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
  } as unknown as Repository<ReminderInstance>;
  const logRepoMock = {
    save: jest.fn(),
    create: jest.fn(),
  } as unknown as Repository<NotificationLog>;
  const aptRepoMock = {
    findOne: jest.fn(),
  } as unknown as Repository<Appointment>;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RemindersService,
        { provide: getRepositoryToken(ReminderRule), useValue: ruleRepoMock },
        {
          provide: getRepositoryToken(ReminderInstance),
          useValue: instanceRepoMock,
        },
        { provide: getRepositoryToken(NotificationLog), useValue: logRepoMock },
        { provide: getRepositoryToken(Appointment), useValue: aptRepoMock },
      ],
    }).compile();
    service = module.get(RemindersService);
  });

  it('plans appointment reminders based on rules', async () => {
    (aptRepoMock.findOne as any) = jest.fn().mockResolvedValue({
      id: 'apt1',
      startsAt: new Date('2024-01-20T10:00:00.000Z'),
      createdByUserId: 'u1',
      clinicId: 'c1',
      animalId: 'an1',
    });
    (ruleRepoMock.find as any) = jest.fn().mockResolvedValue([
      {
        id: 'r1',
        scope: 'APPOINTMENT',
        offsetDays: -7,
        channelEmail: true,
        channelPush: false,
        active: true,
      },
    ]);
    (instanceRepoMock.findOne as any) = jest.fn().mockResolvedValue(null);
    (instanceRepoMock.save as any) = jest.fn().mockResolvedValue({});

    await service.planAppointmentReminders('apt1');
    expect(instanceRepoMock.save).toHaveBeenCalled();
  });

  it('processes due reminders and logs notifications', async () => {
    const now = new Date();
    (instanceRepoMock.find as any) = jest.fn().mockResolvedValue([
      { id: 'i1', status: 'SCHEDULED', sendAt: new Date(now.getTime() - 1000) },
      { id: 'i2', status: 'SCHEDULED', sendAt: new Date(now.getTime() - 2000) },
    ]);
    (logRepoMock.save as any) = jest.fn().mockResolvedValue({});
    (instanceRepoMock.save as any) = jest.fn().mockResolvedValue({});

    const processed = await service.processDueReminders();
    expect(processed).toBe(2);
    expect(logRepoMock.save).toHaveBeenCalledTimes(2);
  });
});
