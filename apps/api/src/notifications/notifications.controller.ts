import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { NotificationService } from './notification.service';
import { NotificationLog } from './entities/notification-log.entity';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiUnauthorizedResponse,
  ApiOkResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('notifications')
@ApiBearerAuth('JWT-auth')
export class NotificationsController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('logs')
  @Roles('VET', 'ADMIN_CLINIC', 'WEBMASTER')
  @ApiOperation({
    summary: 'Obtenir les logs de notifications',
    description:
      "Récupère l'historique des notifications envoyées (VET, ADMIN_CLINIC, WEBMASTER)",
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Nombre maximum de résultats',
    type: 'number',
    example: 50,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Nombre de résultats à ignorer pour la pagination',
    type: 'number',
    example: 0,
  })
  @ApiOkResponse({
    description: 'Liste des logs de notifications',
    type: [NotificationLog],
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          type: { type: 'string', enum: ['EMAIL', 'SMS', 'PUSH'] },
          recipient: { type: 'string' },
          subject: { type: 'string' },
          content: { type: 'string' },
          status: { type: 'string', enum: ['SENT', 'FAILED', 'PENDING'] },
          sentAt: { type: 'string', format: 'date-time' },
          errorMessage: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT invalide ou manquant',
  })
  @ApiForbiddenResponse({
    description: 'Permissions insuffisantes',
  })
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
  @ApiOperation({
    summary: 'Obtenir les statistiques de notifications',
    description:
      "Récupère les statistiques d'envoi des notifications (VET, ADMIN_CLINIC, WEBMASTER)",
  })
  @ApiOkResponse({
    description: 'Statistiques des notifications',
    schema: {
      type: 'object',
      properties: {
        totalSent: {
          type: 'number',
          description: 'Nombre total de notifications envoyées',
        },
        totalFailed: {
          type: 'number',
          description: 'Nombre total de notifications échouées',
        },
        successRate: {
          type: 'number',
          description: 'Taux de succès en pourcentage',
        },
        byType: {
          type: 'object',
          properties: {
            email: { type: 'number' },
            sms: { type: 'number' },
            push: { type: 'number' },
          },
        },
        byStatus: {
          type: 'object',
          properties: {
            sent: { type: 'number' },
            failed: { type: 'number' },
            pending: { type: 'number' },
          },
        },
        last24Hours: {
          type: 'number',
          description: 'Notifications envoyées dans les dernières 24h',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT invalide ou manquant',
  })
  @ApiForbiddenResponse({
    description: 'Permissions insuffisantes',
  })
  async getNotificationStats() {
    return this.notificationService.getNotificationStats();
  }

  @Post('test-email')
  @Roles('WEBMASTER')
  @ApiOperation({
    summary: 'Tester la connexion email',
    description:
      "Teste la configuration SMTP pour l'envoi d'emails (WEBMASTER uniquement)",
  })
  @ApiOkResponse({
    description: 'Résultat du test de connexion',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string', example: 'SMTP connection successful' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT invalide ou manquant',
  })
  @ApiForbiddenResponse({
    description: 'Permissions insuffisantes (WEBMASTER requis)',
  })
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
