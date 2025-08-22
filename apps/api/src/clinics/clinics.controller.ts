import {
  Controller,
  Get,
  Query,
  Post,
  Param,
  UseGuards,
  Body,
  HttpCode,
  HttpStatus,
  Patch,
  Delete,
} from '@nestjs/common';
import { ClinicsService } from './clinics.service';
import { GetVetsDto } from './dto/get-vets.dto';
import { Vet } from './clinics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { Clinic } from './entities/clinic.entity';
import { AssignRoleDto } from './dto/assign-role.dto';
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
  ApiNoContentResponse,
} from '@nestjs/swagger';

@Controller('clinics')
@ApiTags('clinics')
@ApiBearerAuth('JWT-auth')
export class ClinicsController {
  seedDemoData() {
    throw new Error('Method not implemented.');
  }
  constructor(private readonly clinicsService: ClinicsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('WEBMASTER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer une nouvelle clinique',
    description:
      'Crée une nouvelle clinique vétérinaire (WEBMASTER uniquement)',
  })
  @ApiBody({
    type: CreateClinicDto,
    description: 'Informations de la clinique à créer',
  })
  @ApiCreatedResponse({
    description: 'Clinique créée avec succès',
    type: Clinic,
  })
  @ApiBadRequestResponse({
    description: 'Données de la clinique invalides',
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT invalide ou manquant',
  })
  @ApiForbiddenResponse({
    description: 'Permissions insuffisantes (WEBMASTER requis)',
  })
  async create(@Body() createClinicDto: CreateClinicDto): Promise<Clinic> {
    return this.clinicsService.create(createClinicDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('WEBMASTER')
  @ApiOperation({
    summary: 'Mettre à jour une clinique',
    description:
      "Modifie les informations d'une clinique existante (WEBMASTER uniquement)",
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la clinique à modifier',
    type: 'string',
  })
  @ApiBody({
    type: CreateClinicDto,
    description: 'Nouvelles informations de la clinique',
  })
  @ApiOkResponse({
    description: 'Clinique mise à jour avec succès',
    type: Clinic,
  })
  @ApiBadRequestResponse({
    description: 'Données de mise à jour invalides',
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT invalide ou manquant',
  })
  @ApiForbiddenResponse({
    description: 'Permissions insuffisantes (WEBMASTER requis)',
  })
  @ApiNotFoundResponse({
    description: 'Clinique non trouvée',
  })
  update(
    @Param('id') id: string,
    @Body() updateClinicDto: Partial<CreateClinicDto>,
  ) {
    return this.clinicsService.update(id, updateClinicDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('WEBMASTER')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Supprimer une clinique',
    description: 'Supprime définitivement une clinique (WEBMASTER uniquement)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la clinique à supprimer',
    type: 'string',
  })
  @ApiNoContentResponse({
    description: 'Clinique supprimée avec succès',
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT invalide ou manquant',
  })
  @ApiForbiddenResponse({
    description: 'Permissions insuffisantes (WEBMASTER requis)',
  })
  @ApiNotFoundResponse({
    description: 'Clinique non trouvée',
  })
  remove(@Param('id') id: string) {
    return this.clinicsService.remove(id);
  }

  @Post(':id/roles')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('WEBMASTER', 'ADMIN_CLINIC')
  @ApiOperation({
    summary: 'Assigner un rôle à un utilisateur dans une clinique',
    description:
      'Attribue un rôle spécifique à un utilisateur dans une clinique donnée',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la clinique',
    type: 'string',
  })
  @ApiBody({
    type: AssignRoleDto,
    description: "Informations d'assignation de rôle",
  })
  @ApiOkResponse({
    description: 'Rôle assigné avec succès',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Role assigned successfully' },
        userClinicRole: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            clinicId: { type: 'string' },
            role: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: "Données d'assignation invalides",
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT invalide ou manquant',
  })
  @ApiForbiddenResponse({
    description: 'Permissions insuffisantes',
  })
  @ApiNotFoundResponse({
    description: 'Clinique ou utilisateur non trouvé',
  })
  assignRole(
    @Param('id') clinicId: string,
    @Body() assignRoleDto: AssignRoleDto,
  ) {
    return this.clinicsService.assignRole(clinicId, assignRoleDto);
  }

  @Get(':id/roles')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('WEBMASTER', 'ADMIN_CLINIC')
  @ApiOperation({
    summary: "Obtenir les rôles d'une clinique",
    description:
      'Récupère la liste des utilisateurs et leurs rôles dans une clinique',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la clinique',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'Liste des rôles de la clinique',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          userEmail: { type: 'string' },
          userName: { type: 'string' },
          role: { type: 'string' },
          assignedAt: { type: 'string', format: 'date-time' },
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
    description: 'Clinique non trouvée',
  })
  getClinicRoles(@Param('id') clinicId: string) {
    return this.clinicsService.getClinicRoles(clinicId);
  }

  @Get()
  @ApiOperation({
    summary: 'Rechercher des cliniques',
    description:
      'Recherche des cliniques par code postal et/ou services, ou récupère toutes les cliniques',
  })
  @ApiQuery({
    name: 'postcode',
    required: false,
    description: 'Code postal pour filtrer les cliniques',
    type: 'string',
  })
  @ApiQuery({
    name: 'services',
    required: false,
    description: 'Services requis (séparés par des virgules)',
    type: 'string',
    example: 'vaccination,consultation',
  })
  @ApiOkResponse({
    description: 'Liste des cliniques trouvées',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          city: { type: 'string' },
          postcode: { type: 'string' },
        },
      },
    },
  })
  async search(
    @Query('postcode') postcode?: string,
    @Query('services') servicesCsv?: string,
  ) {
    if (postcode || servicesCsv) {
      const serviceSlugs = servicesCsv
        ? servicesCsv
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;
      const results = await this.clinicsService.searchByPostcode(
        postcode || '',
        serviceSlugs,
      );
      return results.map((c) => ({
        id: c.id,
        name: c.name,
        city: c.city,
        postcode: c.postcode,
      }));
    } else {
      const results = await this.clinicsService.getAllClinics();
      return results.map((c) => ({
        id: c.id,
        name: c.name,
        city: c.city,
        postcode: c.postcode,
      }));
    }
  }

  @Get(':clinicId/vets')
  @ApiOperation({
    summary: "Obtenir les vétérinaires d'une clinique",
    description:
      'Récupère la liste des vétérinaires travaillant dans une clinique',
  })
  @ApiParam({
    name: 'clinicId',
    description: 'ID de la clinique',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'Liste des vétérinaires',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          email: { type: 'string' },
          specialty: { type: 'string', nullable: true },
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Clinique non trouvée',
  })
  async getVetsByClinic(@Param() params: GetVetsDto): Promise<Vet[]> {
    return this.clinicsService.getVetsByClinic(params.clinicId);
  }

  @Get('services/list')
  @ApiOperation({
    summary: 'Lister tous les services disponibles',
    description:
      'Récupère la liste complète des services vétérinaires disponibles',
  })
  @ApiOkResponse({
    description: 'Liste des services',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          slug: { type: 'string' },
          label: { type: 'string' },
        },
      },
    },
  })
  async listServices() {
    return this.clinicsService.listServices();
  }

  @Get(':id')
  @ApiOperation({
    summary: "Obtenir les détails d'une clinique",
    description:
      "Récupère les informations détaillées d'une clinique spécifique",
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la clinique',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'Détails de la clinique',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        postcode: { type: 'string' },
        city: { type: 'string' },
        addressLine1: { type: 'string', nullable: true },
        addressLine2: { type: 'string', nullable: true },
        country: { type: 'string', nullable: true },
        phone: { type: 'string', nullable: true },
        email: { type: 'string', nullable: true },
        website: { type: 'string', nullable: true },
        latitude: { type: 'number', nullable: true },
        longitude: { type: 'number', nullable: true },
        openingHours: { type: 'string', nullable: true },
        services: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              slug: { type: 'string' },
              label: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Clinique non trouvée',
  })
  async getById(@Param('id') id: string) {
    const c = await this.clinicsService.getById(id);
    if (!c) return null;
    return {
      id: c.id,
      name: c.name,
      postcode: c.postcode,
      city: c.city,
      addressLine1: c.addressLine1 || null,
      addressLine2: c.addressLine2 || null,
      country: c.country || null,
      phone: c.phone || null,
      email: c.email || null,
      website: c.website || null,
      latitude: c.latitude ?? null,
      longitude: c.longitude ?? null,
      openingHours: c.openingHours || null,
      services: (c.services || []).map((s) => ({
        id: s.id,
        slug: s.slug,
        label: s.label,
      })),
    };
  }
}
