import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Body,
} from '@nestjs/common';
import { AnimalsService } from './animals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateAnimalDto } from './dto/create-animal.dto';
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

@Controller('animals')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('animals')
@ApiBearerAuth('JWT-auth')
export class AnimalsController {
  constructor(private readonly animalsService: AnimalsService) {}

  @Post()
  @Roles('OWNER')
  @ApiOperation({
    summary: 'Créer un nouvel animal',
    description:
      "Ajoute un nouvel animal au profil de l'utilisateur connecté (OWNER uniquement)",
  })
  @ApiBody({
    type: CreateAnimalDto,
    description: "Informations de l'animal à créer",
  })
  @ApiCreatedResponse({
    description: 'Animal créé avec succès',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        species: { type: 'string' },
        breed: { type: 'string' },
        birthDate: { type: 'string', format: 'date' },
        ownerId: { type: 'string' },
        message: { type: 'string', example: 'Animal created successfully' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: "Données de l'animal invalides",
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT invalide ou manquant',
  })
  @ApiForbiddenResponse({
    description: 'Permissions insuffisantes (OWNER requis)',
  })
  async createAnimal(
    @CurrentUser() user: User,
    @Body() createDto: CreateAnimalDto,
  ) {
    return this.animalsService.createAnimal(createDto, user.id);
  }

  @Get('me')
  @Roles('OWNER')
  @ApiOperation({
    summary: 'Obtenir mes animaux',
    description:
      "Récupère la liste des animaux appartenant à l'utilisateur connecté (OWNER uniquement)",
  })
  @ApiQuery({
    name: 'clinicId',
    required: false,
    description: 'ID de la clinique pour filtrer les animaux',
    type: 'string',
  })
  @ApiOkResponse({
    description: "Liste des animaux de l'utilisateur",
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          species: { type: 'string' },
          breed: { type: 'string' },
          birthDate: { type: 'string', format: 'date' },
          weight: { type: 'number', nullable: true },
          color: { type: 'string', nullable: true },
          microchipNumber: { type: 'string', nullable: true },
          ownerId: { type: 'string' },
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
  async getMyAnimals(
    @CurrentUser() user: User,
    @Query('clinicId') clinicId?: string,
  ) {
    return this.animalsService.findByOwnerAndClinic(user.id, clinicId);
  }

  // US-05a: View animal history
  // Access: OWNER of the animal, or VET/ASV/ADMIN_CLINIC of the same clinic
  @Get(':animalId/history')
  @ApiOperation({
    summary: "Obtenir l'historique d'un animal",
    description:
      "Récupère l'historique médical complet d'un animal (OWNER de l'animal ou VET/ASV/ADMIN_CLINIC de la même clinique)",
  })
  @ApiParam({
    name: 'animalId',
    description: "ID de l'animal",
    type: 'string',
  })
  @ApiOkResponse({
    description: "Historique médical de l'animal",
    schema: {
      type: 'object',
      properties: {
        animal: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            species: { type: 'string' },
            breed: { type: 'string' },
          },
        },
        appointments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              startsAt: { type: 'string', format: 'date-time' },
              status: { type: 'string' },
              report: { type: 'string', nullable: true },
              vetName: { type: 'string' },
              clinicName: { type: 'string' },
            },
          },
        },
        documents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              filename: { type: 'string' },
              description: { type: 'string', nullable: true },
              uploadedAt: { type: 'string', format: 'date-time' },
            },
          },
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
    description: 'Animal non trouvé',
  })
  async getAnimalHistory(
    @CurrentUser() user: User,
    @Param('animalId') animalId: string,
  ) {
    return this.animalsService.getAnimalHistory(user.id, animalId);
  }
}
