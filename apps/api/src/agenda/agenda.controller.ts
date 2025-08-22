import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AgendaService, AgendaItem } from './agenda.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { User } from '../users/entities/user.entity';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiQuery,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';

@Controller('agenda')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('agenda')
@ApiBearerAuth('JWT-auth')
export class AgendaController {
  constructor(private readonly agendaService: AgendaService) {}

  @Get('me')
  @Roles('VET')
  @ApiOperation({
    summary: 'Obtenir mon agenda',
    description:
      "Récupère l'agenda du vétérinaire connecté pour une période donnée (VET uniquement)",
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description:
      "Date de référence (format: YYYY-MM-DD). Par défaut: aujourd'hui",
    type: 'string',
    example: '2024-01-15',
  })
  @ApiQuery({
    name: 'range',
    required: false,
    description: 'Période à récupérer',
    enum: ['day', 'week', 'month'],
    example: 'day',
  })
  @ApiOkResponse({
    description: 'Agenda du vétérinaire',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          type: { type: 'string', enum: ['APPOINTMENT', 'BLOCK'] },
          startsAt: { type: 'string', format: 'date-time' },
          endsAt: { type: 'string', format: 'date-time' },
          title: { type: 'string' },
          description: { type: 'string', nullable: true },
          animalName: { type: 'string', nullable: true },
          ownerName: { type: 'string', nullable: true },
          clinicId: { type: 'string' },
          clinicName: { type: 'string' },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT invalide ou manquant',
  })
  @ApiForbiddenResponse({
    description: 'Permissions insuffisantes (VET requis)',
  })
  @ApiBadRequestResponse({
    description: 'Date ou période invalide',
  })
  async getMyAgenda(
    @CurrentUser() user: User,
    @Query('date') date: string,
    @Query('range') range: 'day' | 'week' | 'month' = 'day',
  ): Promise<AgendaItem[]> {
    const target = date ? new Date(date) : new Date();
    if (range === 'week') {
      const start = new Date(target);
      const end = new Date(target);
      // week: Monday 00:00 to Sunday 23:59:59.999 (ISO weeks simplified)
      const day = start.getDay() || 7; // 1..7
      start.setDate(start.getDate() - (day - 1));
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return this.agendaService.getVetRangeAgenda(user.id, start, end);
    }
    if (range === 'month') {
      const start = new Date(
        target.getFullYear(),
        target.getMonth(),
        1,
        0,
        0,
        0,
        0,
      );
      const end = new Date(
        target.getFullYear(),
        target.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );
      return this.agendaService.getVetRangeAgenda(user.id, start, end);
    }
    return this.agendaService.getVetDayAgenda(user.id, target);
  }

  @Post('block')
  @Roles('VET')
  @ApiOperation({
    summary: 'Bloquer des créneaux',
    description:
      "Bloque des créneaux dans l'agenda du vétérinaire (VET uniquement)",
  })
  @ApiBody({
    description: 'Informations du blocage de créneaux',
    schema: {
      type: 'object',
      required: ['clinicId', 'startsAt', 'endsAt'],
      properties: {
        clinicId: {
          type: 'string',
          description: 'ID de la clinique',
        },
        startsAt: {
          type: 'string',
          format: 'date-time',
          description: 'Date et heure de début du blocage',
        },
        endsAt: {
          type: 'string',
          format: 'date-time',
          description: 'Date et heure de fin du blocage',
        },
        reason: {
          type: 'string',
          description: 'Raison du blocage (optionnel)',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Créneaux bloqués avec succès',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        startsAt: { type: 'string', format: 'date-time' },
        endsAt: { type: 'string', format: 'date-time' },
        reason: { type: 'string', nullable: true },
        message: { type: 'string', example: 'Slots blocked successfully' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Données de blocage invalides',
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT invalide ou manquant',
  })
  @ApiForbiddenResponse({
    description: 'Permissions insuffisantes (VET requis)',
  })
  async block(
    @CurrentUser() user: User,
    @Body()
    body: {
      clinicId: string;
      startsAt: string;
      endsAt: string;
      reason?: string;
    },
  ) {
    const { clinicId, startsAt, endsAt, reason } = body;
    const res = await this.agendaService.blockSlots(
      clinicId,
      user.id,
      new Date(startsAt),
      new Date(endsAt),
      reason,
    );
    return res;
  }
}
