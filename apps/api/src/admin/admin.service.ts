import {
  Injectable,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { ClinicsService } from '../clinics/clinics.service';
import { User } from '../users/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateClinicDto } from '../clinics/dto/create-clinic.dto';
import { Clinic } from '../clinics/entities/clinic.entity';
import { UserRole } from '../auth/guards/roles.guard';

@Injectable()
export class AdminService {
  constructor(
    private readonly usersService: UsersService,
    private readonly clinicsService: ClinicsService,
  ) {}

  async createUser(
    createUserDto: CreateUserDto,
  ): Promise<Omit<User, 'password'>> {
    const { email, password, firstName, lastName, role, clinicId } =
      createUserDto;

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Validate clinic role requires clinicId
    if (this.isClinicRole(role) && !clinicId) {
      throw new BadRequestException(`Clinic role ${role} requires a clinicId`);
    }

    // Validate global role doesn't have clinicId
    if (this.isGlobalRole(role) && clinicId) {
      throw new BadRequestException(
        `Global role ${role} cannot have a clinicId`,
      );
    }

    // Create the user with the specified role
    const user = await this.usersService.create(
      email,
      password,
      firstName,
      lastName,
      role,
      clinicId || '',
    );

    return user;
  }

  async updateUser(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<Omit<User, 'password'>> {
    const { role, clinicId, ...userData } = updateUserDto;

    // Update user basic info
    const user = await this.usersService.update(userId, userData);

    // Update role if provided
    if (role !== undefined) {
      // Validate clinic role requires clinicId
      if (this.isClinicRole(role) && !clinicId) {
        throw new BadRequestException(
          `Clinic role ${role} requires a clinicId`,
        );
      }

      // Validate global role doesn't have clinicId
      if (this.isGlobalRole(role) && clinicId) {
        throw new BadRequestException(
          `Global role ${role} cannot have a clinicId`,
        );
      }

      // Remove all existing roles
      await this.usersService.removeAllRoles(userId);

      // Assign new role
      if (this.isGlobalRole(role)) {
        await this.usersService.assignGlobalRole(
          userId,
          role as 'OWNER' | 'WEBMASTER',
        );
      } else if (clinicId) {
        await this.usersService.assignClinicRole(userId, role, clinicId);
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user;
    return { ...result, fullName: `${result.firstName} ${result.lastName}` };
  }

  // Overloaded signatures for backward compatibility
  async removeUser(targetUserId: string): Promise<void>;
  async removeUser(
    requesterId: string | undefined,
    targetUserId: string,
  ): Promise<void>;
  async removeUser(arg1: string | undefined, arg2?: string): Promise<void> {
    const requesterId = arg2 ? arg1 : undefined;
    const targetUserId = arg2 ? arg2 : (arg1 as string);

    // Do not allow self-deletion (only if requesterId is provided)
    if (requesterId && requesterId === targetUserId) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    // Prevent deleting another webmaster (only if we can resolve role)
    const maybeFindPrimaryRole: any = (this.usersService as any)
      .findPrimaryRole;
    if (typeof maybeFindPrimaryRole === 'function') {
      const targetPrimaryRole = await (
        maybeFindPrimaryRole as (userId: string) => Promise<string>
      ).call(this.usersService, targetUserId);
      if (targetPrimaryRole === 'WEBMASTER') {
        throw new ForbiddenException('You cannot delete a webmaster');
      }
    }

    return this.usersService.remove(targetUserId);
  }

  async updateClinic(
    clinicId: string,
    updateClinicDto: Partial<CreateClinicDto>,
  ): Promise<Clinic> {
    return this.clinicsService.update(clinicId, updateClinicDto);
  }

  findAllUsers() {
    return this.usersService.findAll();
  }

  findAllClinics() {
    return this.clinicsService.findAll();
  }

  private isGlobalRole(role: UserRole): boolean {
    return role === 'OWNER' || role === 'WEBMASTER';
  }

  private isClinicRole(role: UserRole): boolean {
    return role === 'VET' || role === 'ASV' || role === 'ADMIN_CLINIC';
  }
}
