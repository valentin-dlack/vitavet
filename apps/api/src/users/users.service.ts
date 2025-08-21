import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { UserClinicRole } from './entities/user-clinic-role.entity';
import { UserGlobalRole } from './entities/user-global-role.entity';
import { UserRole } from 'src/auth/guards/roles.guard';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserClinicRole)
    private readonly userClinicRoleRepository: Repository<UserClinicRole>,
    @InjectRepository(UserGlobalRole)
    private readonly userGlobalRoleRepository: Repository<UserGlobalRole>,
  ) {}

  async create(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: UserRole = 'OWNER',
    clinicId: string = '',
  ): Promise<User> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      isEmailVerified: false, // Admins can create users, but they need to verify
    });

    const savedUser = await this.userRepository.save(user);

    //if no role is provided, assign OWNER role by default
    if (!role && !clinicId) {
      await this.assignGlobalRole(savedUser.id, 'OWNER');
    } else if (role === 'WEBMASTER') {
      await this.assignGlobalRole(savedUser.id, 'WEBMASTER');
    } else if (role === 'OWNER') {
      await this.assignGlobalRole(savedUser.id, 'OWNER');
    } else {
      await this.assignClinicRole(savedUser.id, role, clinicId);
    }

    return savedUser;
  }

  findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async update(
    id: string,
    updateUserDto: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<User> {
    const user = await this.userRepository.preload({
      id,
      ...updateUserDto,
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async findPrimaryRole(
    userId: string,
  ): Promise<UserClinicRole['role'] | null> {
    // Check for global roles first (WEBMASTER takes precedence)
    const globalRole = await this.userGlobalRoleRepository.findOne({
      where: { userId, role: 'WEBMASTER' },
    });
    if (globalRole) return 'WEBMASTER';

    // Check for clinic roles
    const clinicRole = await this.userClinicRoleRepository.findOne({
      where: { userId },
    });
    if (clinicRole?.role) return clinicRole.role;

    // Check if user has OWNER global role
    const ownerRole = await this.userGlobalRoleRepository.findOne({
      where: { userId, role: 'OWNER' },
    });
    if (ownerRole) return 'OWNER';

    return null; // No role assigned
  }

  async findRolesAndClinics(
    userId: string,
  ): Promise<{ roles: UserClinicRole['role'][]; clinicIds: string[] }> {
    const [globalRoles, clinicRoles] = await Promise.all([
      this.userGlobalRoleRepository.find({ where: { userId } }),
      this.userClinicRoleRepository.find({ where: { userId } }),
    ]);

    const globalRoleNames = globalRoles.map((role) => role.role);
    const clinicRoleNames = clinicRoles.map((role) => role.role);
    const clinicIds = clinicRoles.map((role) => role.clinicId);

    // Combine global and clinic roles
    const roles = [...globalRoleNames, ...clinicRoleNames];
    return { roles, clinicIds };
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    user.password = hashedPassword;
    await this.userRepository.save(user);
  }

  async updateEmailVerification(
    userId: string,
    isVerified: boolean,
  ): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isEmailVerified = isVerified;
    return this.userRepository.save(user);
  }

  async assignGlobalRole(
    userId: string,
    role: 'OWNER' | 'WEBMASTER',
  ): Promise<void> {
    const existingRole = await this.userGlobalRoleRepository.findOne({
      where: { userId, role },
    });

    if (!existingRole) {
      const globalRole = this.userGlobalRoleRepository.create({ userId, role });
      await this.userGlobalRoleRepository.save(globalRole);
    }
  }

  async assignClinicRole(
    userId: string,
    role: UserRole,
    clinicId: string,
  ): Promise<void> {
    const existingRole = await this.userClinicRoleRepository.findOne({
      where: { userId, role, clinicId },
    });

    if (!existingRole) {
      const clinicRole = this.userClinicRoleRepository.create({
        userId,
        role,
        clinicId,
      });
      await this.userClinicRoleRepository.save(clinicRole);
    }
  }

  async removeClinicRole(userId: string, clinicId: string): Promise<void> {
    const existingRole = await this.userClinicRoleRepository.findOne({
      where: { userId, clinicId },
    });

    if (existingRole) {
      await this.userClinicRoleRepository.delete(existingRole);
    }
  }

  async removeAllRoles(userId: string): Promise<void> {
    // Remove all global roles
    await this.userGlobalRoleRepository.delete({ userId });

    // Remove all clinic roles
    await this.userClinicRoleRepository.delete({ userId });
  }

  async findAll(): Promise<(Omit<User, 'password'> & { role?: string })[]> {
    const users = await this.userRepository.find();
    const usersWithRoles = await Promise.all(
      users.map(async (user) => {
        const primaryRole = await this.findPrimaryRole(user.id);
        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          fullName: user.fullName,
          role: primaryRole || undefined, // No default role
        };
      }),
    );
    return usersWithRoles;
  }
}
