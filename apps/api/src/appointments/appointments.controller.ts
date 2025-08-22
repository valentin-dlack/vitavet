import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  UseGuards,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CompleteAppointmentDto } from './dto/complete-appointment.dto';
import { Document } from '../documents/entities/document.entity';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';

@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('appointments')
@ApiBearerAuth('JWT-auth')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @Roles('OWNER', 'VET', 'ASV')
  @ApiOperation({
    summary: 'Créer un nouveau rendez-vous',
    description: 'Crée un nouveau rendez-vous vétérinaire (OWNER, VET, ASV)',
  })
  @ApiBody({
    type: CreateAppointmentDto,
    description: 'Informations du rendez-vous à créer',
  })
  @ApiCreatedResponse({
    description: 'Rendez-vous créé avec succès',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        animalId: { type: 'string' },
        vetId: { type: 'string' },
        clinicId: { type: 'string' },
        startsAt: { type: 'string', format: 'date-time' },
        endsAt: { type: 'string', format: 'date-time' },
        status: {
          type: 'string',
          enum: ['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED'],
        },
        message: {
          type: 'string',
          example: 'Appointment created successfully. Pending confirmation.',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Données du rendez-vous invalides',
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT invalide ou manquant',
  })
  @ApiForbiddenResponse({
    description: 'Permissions insuffisantes',
  })
  async createAppointment(
    @Body() createDto: CreateAppointmentDto,
    @CurrentUser() user: User,
  ) {
    const appointment = await this.appointmentsService.createAppointment(
      createDto,
      user.id,
    );

    // TODO: Send confirmation email
    console.log(
      `Appointment created: ${appointment.id} for ${appointment.startsAt}`,
    );

    return {
      ...appointment,
      message: 'Appointment created successfully. Pending confirmation.',
    };
  }

  @Get('pending')
  @Roles('ASV', 'VET', 'ADMIN_CLINIC')
  @ApiOperation({
    summary: 'Obtenir les rendez-vous en attente',
    description:
      'Récupère la liste des rendez-vous en attente de confirmation (ASV, VET, ADMIN_CLINIC)',
  })
  @ApiQuery({
    name: 'clinicId',
    required: false,
    description: 'ID de la clinique pour filtrer les rendez-vous',
    type: 'string',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Nombre maximum de résultats (1-100)',
    type: 'number',
    example: 20,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Nombre de résultats à ignorer pour la pagination',
    type: 'number',
    example: 0,
  })
  @ApiOkResponse({
    description: 'Liste des rendez-vous en attente',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          animalId: { type: 'string' },
          animalName: { type: 'string' },
          vetId: { type: 'string' },
          vetName: { type: 'string' },
          clinicId: { type: 'string' },
          clinicName: { type: 'string' },
          startsAt: { type: 'string', format: 'date-time' },
          endsAt: { type: 'string', format: 'date-time' },
          status: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Paramètres de pagination invalides',
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT invalide ou manquant',
  })
  @ApiForbiddenResponse({
    description: 'Permissions insuffisantes',
  })
  async getPendingAppointments(
    @Query('clinicId') clinicId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const offsetNum = offset ? parseInt(offset, 10) : 0;

    // Validate pagination parameters
    if (limitNum < 1 || limitNum > 100) {
      throw new BadRequestException('Limit must be between 1 and 100');
    }
    if (offsetNum < 0) {
      throw new BadRequestException('Offset must be non-negative');
    }

    return this.appointmentsService.getPendingAppointments(
      clinicId,
      limitNum,
      offsetNum,
    );
  }

  @Get(':id/documents')
  @Roles('VET', 'OWNER') // Or maybe ASV, ADMIN_CLINIC?
  @ApiOperation({
    summary: "Obtenir les documents d'un rendez-vous",
    description:
      'Récupère la liste des documents associés à un rendez-vous (VET, OWNER)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID du rendez-vous',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'Liste des documents du rendez-vous',
    type: [Document],
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
  async getAppointmentDocuments(@Param('id') id: string): Promise<Document[]> {
    return this.appointmentsService.findDocumentsByAppointmentId(id);
  }

  @Patch(':id/confirm')
  @Roles('ASV', 'VET', 'ADMIN_CLINIC')
  @ApiOperation({
    summary: 'Confirmer un rendez-vous',
    description: 'Confirme un rendez-vous en attente (ASV, VET, ADMIN_CLINIC)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID du rendez-vous à confirmer',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'Rendez-vous confirmé avec succès',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        status: { type: 'string', example: 'CONFIRMED' },
        message: {
          type: 'string',
          example: 'Appointment confirmed successfully.',
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
  @ApiNotFoundResponse({
    description: 'Rendez-vous non trouvé',
  })
  async confirmAppointment(@Param('id') id: string) {
    const appointment = await this.appointmentsService.confirmAppointment(id);

    // TODO: Send confirmation email
    console.log(`Appointment confirmed: ${appointment.id}`);

    return {
      ...appointment,
      message: 'Appointment confirmed successfully.',
    };
  }

  @Patch(':id/complete')
  @Roles('VET')
  @ApiOperation({
    summary: 'Terminer un rendez-vous',
    description:
      'Marque un rendez-vous comme terminé et ajoute un rapport (VET uniquement)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID du rendez-vous à terminer',
    type: 'string',
  })
  @ApiBody({
    type: CompleteAppointmentDto,
    description: 'Rapport de consultation',
  })
  @ApiOkResponse({
    description: 'Rendez-vous terminé avec succès',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        status: { type: 'string', example: 'COMPLETED' },
        report: { type: 'string' },
        message: {
          type: 'string',
          example: 'Appointment completed and report saved.',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Données du rapport invalides',
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT invalide ou manquant',
  })
  @ApiForbiddenResponse({
    description: 'Permissions insuffisantes (VET requis)',
  })
  @ApiNotFoundResponse({
    description: 'Rendez-vous non trouvé',
  })
  async completeAppointment(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() completeDto: CompleteAppointmentDto,
  ) {
    const appointment = await this.appointmentsService.completeAppointment(
      id,
      user.id,
      completeDto,
    );

    // TODO: Send report email to owner

    return {
      ...appointment,
      message: 'Appointment completed and report saved.',
    };
  }

  // Owner: appointments for their animals (optional status filter)
  @Get('me')
  @Roles('OWNER')
  @ApiOperation({
    summary: 'Obtenir mes rendez-vous',
    description:
      "Récupère la liste des rendez-vous de l'utilisateur connecté (OWNER uniquement)",
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filtrer par statut du rendez-vous',
    enum: ['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED'],
  })
  @ApiOkResponse({
    description: "Liste des rendez-vous de l'utilisateur",
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          animalId: { type: 'string' },
          animalName: { type: 'string' },
          vetId: { type: 'string' },
          vetName: { type: 'string' },
          clinicId: { type: 'string' },
          clinicName: { type: 'string' },
          startsAt: { type: 'string', format: 'date-time' },
          endsAt: { type: 'string', format: 'date-time' },
          status: { type: 'string' },
          report: { type: 'string', nullable: true },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT invalide ou manquant',
  })
  @ApiForbiddenResponse({
    description: 'Permissions insuffisantes (OWNER requis)',
  })
  async getMyAppointments(
    @CurrentUser() user: User,
    @Query('status')
    status?: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED',
  ) {
    return this.appointmentsService.getOwnerAppointments(user.id, status);
  }
}
