import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationService } from './notification.service';
import { NotificationLog } from './entities/notification-log.entity';
import * as nodemailer from 'nodemailer';

// Mock nodemailer
jest.mock('nodemailer');

describe('NotificationService', () => {
  let service: NotificationService;

  const mockNotificationLogRepo = {
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
    find: jest.fn(),
  };

  const mockTransporter = {
    sendMail: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: getRepositoryToken(NotificationLog),
          useValue: mockNotificationLogRepo,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);

    // Mock the transporter
    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendReminderEmail', () => {
    const notificationData = {
      recipientEmail: 'test@example.com',
      recipientName: 'John Doe',
      appointmentDate: '2024-01-15 10:00',
      animalName: 'Rex',
      clinicName: 'Clinique Test',
      reminderType: 'appointment_24h' as const,
    };

    it('should send email successfully', async () => {
      const mockResult = { messageId: 'test-message-id' };
      mockTransporter.sendMail.mockResolvedValue(mockResult);
      mockNotificationLogRepo.create.mockReturnValue({});
      mockNotificationLogRepo.save.mockResolvedValue({});

      const result = await service.sendReminderEmail(notificationData);

      expect(result).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'noreply@vitavet.com',
        to: 'test@example.com',
        subject: expect.stringContaining(
          'Rappel : Rendez-vous demain pour Rex',
        ),
        html: expect.stringContaining('John Doe'),
        text: expect.stringContaining('John Doe'),
      });
      expect(mockNotificationLogRepo.save).toHaveBeenCalled();
    });

    it('should handle email sending failure', async () => {
      const error = new Error('SMTP error');
      mockTransporter.sendMail.mockRejectedValue(error);
      mockNotificationLogRepo.create.mockReturnValue({
        notificationType: 'email',
        recipient: 'test@example.com',
        status: 'failed',
        error: 'SMTP error',
        reminderType: 'appointment_24h',
        sentAt: new Date(),
      });
      mockNotificationLogRepo.save.mockResolvedValue({});

      const result = await service.sendReminderEmail(notificationData);

      expect(result).toBe(false);
      expect(mockNotificationLogRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
          error: 'SMTP error',
        }),
      );
    });

    it('should generate correct email template for appointment_24h', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test' });
      mockNotificationLogRepo.create.mockReturnValue({});
      mockNotificationLogRepo.save.mockResolvedValue({});

      await service.sendReminderEmail(notificationData);

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.subject).toContain(
        'Rappel : Rendez-vous demain pour Rex',
      );
      expect(callArgs.html).toContain('demain');
      expect(callArgs.html).toContain('John Doe');
      expect(callArgs.html).toContain('Rex');
      expect(callArgs.html).toContain('Clinique Test');
    });

    it('should generate correct email template for appointment_1h', async () => {
      const data1h = {
        ...notificationData,
        reminderType: 'appointment_1h' as const,
      };
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test' });
      mockNotificationLogRepo.create.mockReturnValue({});
      mockNotificationLogRepo.save.mockResolvedValue({});

      await service.sendReminderEmail(data1h);

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.subject).toContain('Rendez-vous dans 1 heure pour Rex');
      expect(callArgs.html).toContain('1 heure');
    });
  });

  describe('logNotification', () => {
    it('should log notification successfully', async () => {
      const logData = {
        notificationType: 'email',
        recipient: 'test@example.com',
        status: 'sent',
        reminderType: 'appointment_24h',
        messageId: 'test-id',
        sentAt: new Date(),
      };

      mockNotificationLogRepo.create.mockReturnValue(logData);
      mockNotificationLogRepo.save.mockResolvedValue(logData);

      await service.logNotification(
        'email',
        'test@example.com',
        'sent',
        undefined,
        'appointment_24h',
        'test-id',
      );

      expect(mockNotificationLogRepo.create).toHaveBeenCalledWith(logData);
      expect(mockNotificationLogRepo.save).toHaveBeenCalledWith(logData);
    });
  });

  describe('getNotificationStats', () => {
    it('should return correct statistics', async () => {
      mockNotificationLogRepo.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(80) // sent
        .mockResolvedValueOnce(20); // failed

      const stats = await service.getNotificationStats();

      expect(stats).toEqual({
        total: 100,
        sent: 80,
        failed: 20,
        successRate: 80,
      });
    });

    it('should handle zero total notifications', async () => {
      mockNotificationLogRepo.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      const stats = await service.getNotificationStats();

      expect(stats.successRate).toBe(0);
    });
  });

  describe('getNotificationLogs', () => {
    it('should return notification logs with pagination', async () => {
      const mockLogs = [
        { id: '1', recipient: 'test@example.com', status: 'sent' },
        { id: '2', recipient: 'test2@example.com', status: 'failed' },
      ];

      mockNotificationLogRepo.find.mockResolvedValue(mockLogs);

      const logs = await service.getNotificationLogs(10, 5);

      expect(logs).toEqual(mockLogs);
      expect(mockNotificationLogRepo.find).toHaveBeenCalledWith({
        order: { sentAt: 'DESC' },
        take: 10,
        skip: 5,
      });
    });

    it('should use default pagination values', async () => {
      mockNotificationLogRepo.find.mockResolvedValue([]);

      await service.getNotificationLogs();

      expect(mockNotificationLogRepo.find).toHaveBeenCalledWith({
        order: { sentAt: 'DESC' },
        take: 50,
        skip: 0,
      });
    });
  });

  describe('testEmailConnection', () => {
    it('should return true when SMTP connection is successful', async () => {
      mockTransporter.verify.mockResolvedValue(true);

      const result = await service.testEmailConnection();

      expect(result).toBe(true);
      expect(mockTransporter.verify).toHaveBeenCalled();
    });

    it('should return false when SMTP connection fails', async () => {
      mockTransporter.verify.mockRejectedValue(new Error('Connection failed'));

      const result = await service.testEmailConnection();

      expect(result).toBe(false);
    });
  });
});
