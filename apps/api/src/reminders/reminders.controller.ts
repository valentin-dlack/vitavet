import { Controller, Post, Param, UseGuards, Get, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RemindersService } from './reminders.service';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiUnauthorizedResponse,
  ApiOkResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';

@Controller('reminders')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('reminders')
@ApiBearerAuth('JWT-auth')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Post('plan/appointment/:id')
  @Roles('ASV', 'VET', 'ADMIN_CLINIC')
  @ApiOperation({
    summary: 'Planifier des rappels pour un rendez-vous',
    description:
      'Crée automatiquement des rappels pour un rendez-vous (vaccination, suivi, etc.)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID du rendez-vous',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'Rappels planifiés avec succès',
    schema: {
      type: 'object',
      properties: {
        planned: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Reminders planned successfully' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT invalide ou manquant',
  })
  @ApiForbiddenResponse({
    description: 'Permissions insuffisantes',
  })
  @ApiNotFoundResponse({
    description: 'Rendez-vous non trouvé',
  })
  async planForAppointment(@Param('id') id: string) {
    await this.remindersService.planAppointmentReminders(id);
    return { planned: true };
  }

  @Post('run-due')
  @Roles('ADMIN_CLINIC', 'VET')
  @ApiOperation({
    summary: 'Traiter les rappels échus',
    description:
      'Traite et envoie tous les rappels qui sont échus (ADMIN_CLINIC, VET)',
  })
  @ApiOkResponse({
    description: 'Rappels traités',
    schema: {
      type: 'object',
      properties: {
        processed: { type: 'number', description: 'Nombre de rappels traités' },
        message: {
          type: 'string',
          example: 'Due reminders processed successfully',
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
  async runDue() {
    const processed = await this.remindersService.processDueReminders();
    return { processed };
  }

  @Get('instances')
  @Roles('ADMIN_CLINIC', 'VET')
  @ApiOperation({
    summary: 'Lister les instances de rappels',
    description:
      'Récupère la liste des instances de rappels avec filtrage par statut (ADMIN_CLINIC, VET)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filtrer par statut des rappels',
    enum: ['SCHEDULED', 'SENT', 'FAILED', 'CANCELLED'],
  })
  @ApiOkResponse({
    description: 'Liste des instances de rappels',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          reminderRuleId: { type: 'string' },
          appointmentId: { type: 'string' },
          scheduledFor: { type: 'string', format: 'date-time' },
          status: {
            type: 'string',
            enum: ['SCHEDULED', 'SENT', 'FAILED', 'CANCELLED'],
          },
          sentAt: { type: 'string', format: 'date-time', nullable: true },
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
  async listInstances(
    @Query('status') status?: 'SCHEDULED' | 'SENT' | 'FAILED' | 'CANCELLED',
  ) {
    return this.remindersService.listInstances(status);
  }
}
