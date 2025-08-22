import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';

@Controller('auth')
@ApiTags('auth')
@ApiBearerAuth('JWT-auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: "Inscription d'un nouvel utilisateur",
    description:
      'Crée un nouveau compte utilisateur avec les informations fournies',
  })
  @ApiBody({
    type: RegisterDto,
    description: "Informations d'inscription de l'utilisateur",
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
        message: { type: 'string', example: 'User registered successfully' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: "Données d'inscription invalides",
    schema: {
      type: 'object',
      properties: {
        message: { type: 'array', items: { type: 'string' } },
        error: { type: 'string' },
        statusCode: { type: 'number' },
      },
    },
  })
  @ApiConflictResponse({
    description: 'Email déjà utilisé',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Email already exists' },
        error: { type: 'string' },
        statusCode: { type: 'number' },
      },
    },
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Connexion utilisateur',
    description: 'Authentifie un utilisateur et retourne un token JWT',
  })
  @ApiBody({
    type: LoginDto,
    description: 'Identifiants de connexion',
  })
  @ApiOkResponse({
    description: 'Connexion réussie',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string', description: 'JWT token' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Identifiants invalides',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Invalid credentials' },
        error: { type: 'string' },
        statusCode: { type: 'number' },
      },
    },
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: "Obtenir les informations de l'utilisateur connecté",
    description:
      "Récupère les informations du profil de l'utilisateur authentifié",
  })
  @ApiOkResponse({
    description: 'Informations utilisateur récupérées',
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
          example: ['OWNER', 'VET'],
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT invalide ou manquant',
  })
  async getCurrentUser(@CurrentUser() user: User) {
    return this.authService.getCurrentUser(user.id);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Mettre à jour le profil utilisateur',
    description: "Modifie les informations du profil de l'utilisateur connecté",
  })
  @ApiBody({
    type: UpdateProfileDto,
    description: 'Nouvelles informations du profil',
  })
  @ApiOkResponse({
    description: 'Profil mis à jour avec succès',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        email: { type: 'string' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        message: { type: 'string', example: 'Profile updated successfully' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Données de mise à jour invalides',
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT invalide ou manquant',
  })
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user.id, updateProfileDto);
  }

  @Patch('password')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Changer le mot de passe',
    description: "Modifie le mot de passe de l'utilisateur connecté",
  })
  @ApiBody({
    type: ChangePasswordDto,
    description: 'Ancien et nouveau mot de passe',
  })
  @ApiOkResponse({
    description: 'Mot de passe changé avec succès',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Password changed successfully' },
      },
    },
  })
  @ApiBadRequestResponse({
    description:
      'Ancien mot de passe incorrect ou nouveau mot de passe invalide',
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT invalide ou manquant',
  })
  async changePassword(
    @CurrentUser() user: User,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.id, changePasswordDto);
  }

  @Post('delete-account')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Demander la suppression du compte',
    description:
      'Initie une demande de suppression de compte avec confirmation par mot de passe',
  })
  @ApiBody({
    type: DeleteAccountDto,
    description: 'Mot de passe de confirmation',
  })
  @ApiOkResponse({
    description: 'Demande de suppression créée',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Account deletion request created',
        },
        requestId: { type: 'string' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Mot de passe incorrect',
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT invalide ou manquant',
  })
  async requestAccountDeletion(
    @CurrentUser() user: User,
    @Body() deleteAccountDto: DeleteAccountDto,
  ) {
    return this.authService.requestAccountDeletion(user.id, deleteAccountDto);
  }

  @Get('delete-account/status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Vérifier le statut de la demande de suppression',
    description: 'Récupère le statut de la demande de suppression de compte',
  })
  @ApiOkResponse({
    description: 'Statut de la demande de suppression',
    schema: {
      type: 'object',
      properties: {
        hasPendingRequest: { type: 'boolean' },
        requestDate: { type: 'string', format: 'date-time' },
        scheduledDeletionDate: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT invalide ou manquant',
  })
  async getDeletionRequestStatus(@CurrentUser() user: User) {
    return this.authService.getDeletionRequestStatus(user.id);
  }
}
