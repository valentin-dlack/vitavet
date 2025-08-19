import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { User } from '../users/entities/user.entity';
import {
  AccountDeletionRequest,
  DeletionRequestStatus,
} from './entities/account-deletion-request.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectRepository(AccountDeletionRequest)
    private readonly deletionRequestRepo: Repository<AccountDeletionRequest>,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, firstName, lastName } = registerDto;

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const user = await this.usersService.create(
      email,
      password,
      firstName,
      lastName,
    );

    const token = this.generateToken(user, ['OWNER'], []);

    const userWithoutPassword = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return {
      user: userWithoutPassword,
      token,
      message:
        'Utilisateur enregistré avec succès. Veuillez vérifier votre email pour la vérification.',
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const isPasswordValid = await this.usersService.validatePassword(
      user,
      password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const { roles, clinicIds } = await this.usersService.findRolesAndClinics(
      user.id,
    );
    if (!roles || !clinicIds) {
      throw new UnauthorizedException(
        "Impossible de récupérer les rôles ou les cliniques de l'utilisateur",
      );
    }
    const token = this.generateToken(user, roles, clinicIds);

    const primaryRole = await this.usersService.findPrimaryRole(user.id);

    const userWithoutPassword = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isEmailVerified: user.isEmailVerified,
      role: primaryRole || undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return {
      user: userWithoutPassword,
      token,
      message: 'Connexion réussie',
    };
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.usersService.findById(userId);
  }

  async getCurrentUser(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    const { roles, clinicIds } = await this.usersService.findRolesAndClinics(
      user.id,
    );

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: roles || [],
      clinics: clinicIds || [],
    };
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    if (updateProfileDto.email && updateProfileDto.email !== user.email) {
      const existingUser = await this.usersService.findByEmail(
        updateProfileDto.email,
      );
      if (existingUser) {
        throw new ConflictException('Email déjà utilisé');
      }
    }

    const updatedUser = await this.usersService.update(
      userId,
      updateProfileDto,
    );

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      message: 'Modification enregistrée avec succès',
    };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    const isCurrentPasswordValid = await this.usersService.validatePassword(
      user,
      changePasswordDto.currentPassword,
    );
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Mot de passe actuel incorrect');
    }

    if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
      throw new BadRequestException('Les mots de passe ne correspondent pas');
    }

    await this.usersService.updatePassword(
      userId,
      changePasswordDto.newPassword,
    );

    return {
      message: 'Mot de passe modifié avec succès',
    };
  }

  async requestAccountDeletion(
    userId: string,
    deleteAccountDto: DeleteAccountDto,
  ) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    const isPasswordValid = await this.usersService.validatePassword(
      user,
      deleteAccountDto.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Mot de passe incorrect');
    }

    const existingRequest = await this.deletionRequestRepo.findOne({
      where: {
        userId,
        status: DeletionRequestStatus.PENDING,
      },
    });

    if (existingRequest) {
      throw new BadRequestException(
        'Vous avez déjà une demande de suppression en attente',
      );
    }

    const deletionRequest = this.deletionRequestRepo.create({
      userId,
      reason: deleteAccountDto.reason,
      status: DeletionRequestStatus.PENDING,
    });

    await this.deletionRequestRepo.save(deletionRequest);

    return {
      message:
        'Demande de suppression de compte soumise avec succès. Vous serez informé de la décision.',
      requestId: deletionRequest.id,
    };
  }

  async getDeletionRequestStatus(userId: string) {
    const request = await this.deletionRequestRepo.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return request
      ? {
          id: request.id,
          status: request.status,
          reason: request.reason,
          createdAt: request.createdAt,
          adminNotes: request.adminNotes,
          processedAt: request.processedAt,
        }
      : null;
  }

  private generateToken(
    user: User,
    roles: string[],
    clinicIds: string[],
  ): string {
    const payload = {
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles,
      clinicIds,
    };

    return this.jwtService.sign(payload);
  }
}
