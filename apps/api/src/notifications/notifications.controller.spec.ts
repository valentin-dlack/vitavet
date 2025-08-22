import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationService } from './notification.service';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  const serviceMock = {
    getNotificationLogs: jest.fn(),
    getNotificationStats: jest.fn(),
    testEmailConnection: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [{ provide: NotificationService, useValue: serviceMock }],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getNotificationLogs forwards parsed query params', async () => {
    serviceMock.getNotificationLogs.mockResolvedValue([]);
    const res = await controller.getNotificationLogs('10', '5');
    expect(serviceMock.getNotificationLogs).toHaveBeenCalledWith(10, 5);
    expect(res).toEqual([]);
  });

  it('getNotificationLogs uses defaults when query missing', async () => {
    serviceMock.getNotificationLogs.mockResolvedValue([]);
    await controller.getNotificationLogs(undefined, undefined);
    expect(serviceMock.getNotificationLogs).toHaveBeenCalledWith(50, 0);
  });

  it('getNotificationStats proxies to service', async () => {
    serviceMock.getNotificationStats.mockResolvedValue({ totalSent: 1 });
    const res = await controller.getNotificationStats();
    expect(serviceMock.getNotificationStats).toHaveBeenCalled();
    expect(res).toEqual({ totalSent: 1 });
  });

  it('testEmailConnection maps boolean to response object', async () => {
    serviceMock.testEmailConnection.mockResolvedValue(true);
    const ok = await controller.testEmailConnection();
    expect(ok).toEqual({
      success: true,
      message: 'SMTP connection successful',
    });

    serviceMock.testEmailConnection.mockResolvedValue(false);
    const ko = await controller.testEmailConnection();
    expect(ko).toEqual({ success: false, message: 'SMTP connection failed' });
  });
});
