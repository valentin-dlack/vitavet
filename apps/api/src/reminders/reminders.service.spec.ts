/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RemindersService } from './reminders.service';
import { ReminderRule } from './entities/reminder-rule.entity';
import { ReminderInstance } from './entities/reminder-instance.entity';
import { NotificationLog } from '../notifications/entities/notification-log.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { NotificationService } from '../notifications/notification.service';

describe('RemindersService', () => {
  let service: RemindersService;
  let ruleRepoMock: jest.Mocked<any>;
  let instanceRepoMock: jest.Mocked<any>;
  let logRepoMock: jest.Mocked<any>;
  let appointmentRepoMock: jest.Mocked<any>;
  let notificationServiceMock: jest.Mocked<any>;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Initialize mocks
    ruleRepoMock = {
      find: jest.fn(),
    };

    instanceRepoMock = {
      findOne: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
    };

    logRepoMock = {
      save: jest.fn(),
      create: jest.fn(),
    };

    appointmentRepoMock = {
      findOne: jest.fn(),
    };

    notificationServiceMock = {
      sendReminderEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RemindersService,
        { provide: getRepositoryToken(ReminderRule), useValue: ruleRepoMock },
        {
          provide: getRepositoryToken(ReminderInstance),
          useValue: instanceRepoMock,
        },
        { provide: getRepositoryToken(NotificationLog), useValue: logRepoMock },
        {
          provide: getRepositoryToken(Appointment),
          useValue: appointmentRepoMock,
        },
        { provide: NotificationService, useValue: notificationServiceMock },
      ],
    }).compile();

    service = module.get<RemindersService>(RemindersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('planAppointmentReminders', () => {
    it('plans appointment reminders based on rules', async () => {
      const appointmentId = 'apt-1';
      const mockAppointment = {
        id: appointmentId,
        startsAt: new Date('2024-01-10T10:00:00Z'),
        createdByUserId: 'user-1',
        clinicId: 'clinic-1',
        animalId: 'animal-1',
      };

      const mockRules = [
        { id: 'rule-1', scope: 'APPOINTMENT', active: true, offsetDays: -1 },
        { id: 'rule-2', scope: 'APPOINTMENT', active: true, offsetDays: 0 },
      ];

      appointmentRepoMock.findOne.mockResolvedValue(mockAppointment);
      ruleRepoMock.find.mockResolvedValue(mockRules);
      instanceRepoMock.findOne.mockResolvedValue(null);
      instanceRepoMock.create.mockReturnValue({});
      instanceRepoMock.save.mockResolvedValue({});

      await service.planAppointmentReminders(appointmentId);

      expect(appointmentRepoMock.findOne).toHaveBeenCalledWith({
        where: { id: appointmentId },
      });
      expect(ruleRepoMock.find).toHaveBeenCalledWith({
        where: { scope: 'APPOINTMENT', active: true },
      });
      expect(instanceRepoMock.save).toHaveBeenCalledTimes(2);
    });
  });

  describe('processDueReminders', () => {
    it('processes due reminders and logs notifications', async () => {
      const mockInstances = [
        {
          id: 'i1',
          status: 'SCHEDULED',
          appointmentId: 'apt-1',
          rule: { offsetDays: -1 },
        },
        {
          id: 'i2',
          status: 'SCHEDULED',
          appointmentId: 'apt-2',
          rule: { offsetDays: 0 },
        },
      ];

      const mockAppointment = {
        id: 'apt-1',
        animal: {
          name: 'Rex',
          owner: {
            email: 'owner@test.com',
            firstName: 'John',
            lastName: 'Doe',
          },
        },
        clinic: { name: 'Test Clinic' },
        startsAt: new Date('2024-01-10T10:00:00Z'),
      };

      instanceRepoMock.find.mockResolvedValue(mockInstances);
      appointmentRepoMock.findOne.mockResolvedValue(mockAppointment);
      notificationServiceMock.sendReminderEmail.mockResolvedValue(true);
      instanceRepoMock.save.mockResolvedValue({});

      const processed = await service.processDueReminders();

      expect(processed).toBe(2);
      expect(notificationServiceMock.sendReminderEmail).toHaveBeenCalledTimes(
        2,
      );
    });
  });
});
