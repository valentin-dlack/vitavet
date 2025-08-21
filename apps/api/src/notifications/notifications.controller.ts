import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { NotificationService } from './notification.service';
import { NotificationLog } from './entities/notification-log.entity';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('logs')
  @Roles('VET', 'ADMIN_CLINIC', 'WEBMASTER')
  async getNotificationLogs(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<NotificationLog[]> {
    const limitNum = limit ? parseInt(limit) : 50;
    const offsetNum = offset ? parseInt(offset) : 0;

    return this.notificationService.getNotificationLogs(limitNum, offsetNum);
  }

  @Get('stats')
  @Roles('VET', 'ADMIN_CLINIC', 'WEBMASTER')
  async getNotificationStats() {
    return this.notificationService.getNotificationStats();
  }

  @Post('test-email')
  @Roles('WEBMASTER')
  async testEmailConnection() {
    const isConnected = await this.notificationService.testEmailConnection();
    return {
      success: isConnected,
      message: isConnected
        ? 'SMTP connection successful'
        : 'SMTP connection failed',
    };
  }
}
