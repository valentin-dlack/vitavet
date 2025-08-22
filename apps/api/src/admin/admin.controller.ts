import {
  Controller,
  Get,
  UseGuards,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminService } from './admin.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateClinicDto } from '../clinics/dto/create-clinic.dto';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiParam,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiNoContentResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('admin')
@ApiBearerAuth('JWT-auth')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('users')
  @Roles('WEBMASTER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer un nouvel utilisateur',
    description:
      'Crée un nouvel utilisateur avec des rôles spécifiques (WEBMASTER uniquement)',
  })
  @ApiBody({
    type: CreateUserDto,
    description: "Informations de l'utilisateur à créer",
  })
  @ApiCreatedResponse({
    description: 'Utilisateur créé avec succès',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        email: { type: 'string' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        roles: {
          type: 'array',
          items: { type: 'string' },
        },
        message: { type: 'string', example: 'User created successfully' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: "Données de l'utilisateur invalides",
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT invalide ou manquant',
  })
  @ApiForbiddenResponse({
    description: 'Permissions insuffisantes (WEBMASTER requis)',
  })
  @ApiConflictResponse({
    description: 'Email déjà utilisé',
  })
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.adminService.createUser(createUserDto);
  }

  @Patch('users/:id')
  @Roles('WEBMASTER')
  @ApiOperation({
    summary: 'Mettre à jour un utilisateur',
    description:
      "Modifie les informations d'un utilisateur existant (WEBMASTER uniquement)",
  })
  @ApiParam({
    name: 'id',
    description: "ID de l'utilisateur à modifier",
    type: 'string',
  })
  @ApiBody({
    type: UpdateUserDto,
    description: "Nouvelles informations de l'utilisateur",
  })
  @ApiOkResponse({
    description: 'Utilisateur mis à jour avec succès',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        email: { type: 'string' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        roles: {
          type: 'array',
          items: { type: 'string' },
        },
        message: { type: 'string', example: 'User updated successfully' },
      },
    },
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
    description: 'Utilisateur non trouvé',
  })
  updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.adminService.updateUser(id, updateUserDto);
  }

  @Delete('users/:id')
  @Roles('WEBMASTER')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Supprimer un utilisateur',
    description:
      'Supprime définitivement un utilisateur (WEBMASTER uniquement)',
  })
  @ApiParam({
    name: 'id',
    description: "ID de l'utilisateur à supprimer",
    type: 'string',
  })
  @ApiNoContentResponse({
    description: 'Utilisateur supprimé avec succès',
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT invalide ou manquant',
  })
  @ApiForbiddenResponse({
    description: 'Permissions insuffisantes (WEBMASTER requis)',
  })
  @ApiNotFoundResponse({
    description: 'Utilisateur non trouvé',
  })
  removeUser(@Param('id') id: string) {
    return this.adminService.removeUser(id);
  }

  @Patch('clinics/:id')
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
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        message: { type: 'string', example: 'Clinic updated successfully' },
      },
    },
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
  updateClinic(
    @Param('id') id: string,
    @Body() updateClinicDto: Partial<CreateClinicDto>,
  ) {
    return this.adminService.updateClinic(id, updateClinicDto);
  }

  @Get('users')
  @Roles('WEBMASTER')
  @ApiOperation({
    summary: 'Lister tous les utilisateurs',
    description:
      'Récupère la liste complète de tous les utilisateurs (WEBMASTER uniquement)',
  })
  @ApiOkResponse({
    description: 'Liste de tous les utilisateurs',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          roles: {
            type: 'array',
            items: { type: 'string' },
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT invalide ou manquant',
  })
  @ApiForbiddenResponse({
    description: 'Permissions insuffisantes (WEBMASTER requis)',
  })
  findAllUsers() {
    return this.adminService.findAllUsers();
  }

  @Get('clinics')
  @Roles('WEBMASTER')
  @ApiOperation({
    summary: 'Lister toutes les cliniques',
    description:
      'Récupère la liste complète de toutes les cliniques (WEBMASTER uniquement)',
  })
  @ApiOkResponse({
    description: 'Liste de toutes les cliniques',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          city: { type: 'string' },
          postcode: { type: 'string' },
          email: { type: 'string', nullable: true },
          phone: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT invalide ou manquant',
  })
  @ApiForbiddenResponse({
    description: 'Permissions insuffisantes (WEBMASTER requis)',
  })
  findAllClinics() {
    return this.adminService.findAllClinics();
  }
}
