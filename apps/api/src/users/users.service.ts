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
import type { UserRole } from 'src/auth/guards/roles.guard';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserClinicRole)
    private readonly userClinicRoleRepository: Repository<UserClinicRole>,
  ) {}

  async create(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: UserRole = 'OWNER',
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
      globalRole: 'OWNER',
    });

    const savedUser = await this.userRepository.save(user);

    // If a role is provided and it's not the default 'OWNER',
    // we might need to create a UserClinicRole entry if a clinic context is required.
    // For now, let's keep it simple: the role is just a property on the user.
    // The complexity of UserClinicRole is for clinic-specific roles.
    // A default role on the user can be a fallback.
    // The US-08f will handle UserClinicRole creation.

    if (role !== 'OWNER') {
      // This part is tricky without a clinicId.
      // Let's assume for now that creating an ASV user doesn't link them to a clinic yet.
      // That will be the job of US-08f.
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
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return null;
    if (user.globalRole === 'WEBMASTER') return 'WEBMASTER';

    const link = await this.userClinicRoleRepository.findOne({
      where: { userId },
    });
    if (link?.role) return link.role;
    return 'OWNER';
  }

  async findRolesAndClinics(
    userId: string,
  ): Promise<{ roles: UserClinicRole['role'][]; clinicIds: string[] }> {
    const [user, links] = await Promise.all([
      this.userRepository.findOne({ where: { id: userId } }),
      this.userClinicRoleRepository.find({ where: { userId } }),
    ]);
    const clinicRoles = links.map((link) => link.role);
    const clinicIds = links.map((link) => link.clinicId);
    const roles = [user?.globalRole || 'OWNER', ...clinicRoles];
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
          globalRole: user.globalRole,
          role: primaryRole || 'OWNER', // Default to OWNER if no role found
        };
      }),
    );
    return usersWithRoles;
  }
}
