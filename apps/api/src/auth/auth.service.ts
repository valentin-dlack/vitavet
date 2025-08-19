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

    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Create new user
    const user = await this.usersService.create(
      email,
      password,
      firstName,
      lastName,
    );

    // Generate JWT token
    const token = this.generateToken(user, ['OWNER'], []);

    // Return user data without password
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
        'User registered successfully. Please check your email for verification.',
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Validate password
    const isPasswordValid = await this.usersService.validatePassword(
      user,
      password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { roles, clinicIds } = await this.usersService.findRolesAndClinics(
      user.id,
    );
    if (!roles || !clinicIds) {
      throw new UnauthorizedException(
        'Unable to retrieve user roles or clinics',
      );
    }
    // Generate JWT token
    const token = this.generateToken(user, roles, clinicIds);

    // Resolve primary role for convenience in frontend RBAC display
    const primaryRole = await this.usersService.findPrimaryRole(user.id);

    // Return user data without password
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
      message: 'Login successful',
    };
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.usersService.findById(userId);
  }

  async getCurrentUser(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
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
      throw new UnauthorizedException('User not found');
    }

    // Check if email is being changed and if it's already taken
    if (updateProfileDto.email && updateProfileDto.email !== user.email) {
      const existingUser = await this.usersService.findByEmail(
        updateProfileDto.email,
      );
      if (existingUser) {
        throw new ConflictException('Email already in use');
      }
    }

    // Update user
    const updatedUser = await this.usersService.update(
      userId,
      updateProfileDto,
    );

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      message: 'Profile updated successfully',
    };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Validate current password
    const isCurrentPasswordValid = await this.usersService.validatePassword(
      user,
      changePasswordDto.currentPassword,
    );
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Check if new password matches confirmation
    if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
      throw new BadRequestException(
        'New password and confirmation do not match',
      );
    }

    // Update password
    await this.usersService.updatePassword(
      userId,
      changePasswordDto.newPassword,
    );

    return {
      message: 'Password changed successfully',
    };
  }

  async requestAccountDeletion(
    userId: string,
    deleteAccountDto: DeleteAccountDto,
  ) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Validate password
    const isPasswordValid = await this.usersService.validatePassword(
      user,
      deleteAccountDto.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Password is incorrect');
    }

    // Check if there's already a pending request
    const existingRequest = await this.deletionRequestRepo.findOne({
      where: {
        userId,
        status: DeletionRequestStatus.PENDING,
      },
    });

    if (existingRequest) {
      throw new BadRequestException(
        'You already have a pending deletion request',
      );
    }

    // Create deletion request
    const deletionRequest = this.deletionRequestRepo.create({
      userId,
      reason: deleteAccountDto.reason,
      status: DeletionRequestStatus.PENDING,
    });

    await this.deletionRequestRepo.save(deletionRequest);

    return {
      message:
        'Account deletion request submitted successfully. You will be notified of the decision.',
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
