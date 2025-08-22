import { Controller, Get, Query } from '@nestjs/common';
import { GetSlotsDto } from './dto/get-slots.dto';
import { AvailableSlot, SlotsService } from './slots.service';
import { UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiOkResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';

@Controller('slots')
@UseGuards()
@ApiTags('slots')
export class SlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  @Get()
  @ApiOperation({
    summary: 'Obtenir les créneaux disponibles',
    description:
      'Récupère la liste des créneaux disponibles pour un vétérinaire, une clinique et une date donnés',
  })
  @ApiQuery({
    name: 'clinicId',
    required: true,
    description: 'ID de la clinique',
    type: 'string',
  })
  @ApiQuery({
    name: 'vetId',
    required: true,
    description: 'ID du vétérinaire',
    type: 'string',
  })
  @ApiQuery({
    name: 'date',
    required: true,
    description:
      'Date pour laquelle rechercher les créneaux (format: YYYY-MM-DD)',
    type: 'string',
    example: '2024-01-15',
  })
  @ApiQuery({
    name: 'serviceId',
    required: false,
    description: 'ID du service pour filtrer les créneaux',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'Liste des créneaux disponibles',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          startsAt: { type: 'string', format: 'date-time' },
          endsAt: { type: 'string', format: 'date-time' },
          duration: { type: 'number', description: 'Durée en minutes' },
          isAvailable: { type: 'boolean' },
          clinicId: { type: 'string' },
          vetId: { type: 'string' },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Paramètres de recherche invalides',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'array', items: { type: 'string' } },
        error: { type: 'string' },
        statusCode: { type: 'number' },
      },
    },
  })
  async getAvailableSlots(
    @Query() query: GetSlotsDto,
  ): Promise<AvailableSlot[]> {
    return this.slotsService.getAvailableSlots(query);
  }
}
