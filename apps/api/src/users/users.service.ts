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
      isEmailVerified: false,
    });

    return this.userRepository.save(user);
  }

  findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findPrimaryRole(
    userId: string,
  ): Promise<UserClinicRole['role'] | null> {
    const link = await this.userClinicRoleRepository.findOne({
      where: { userId },
    });
    return link?.role ?? null;
  }

  async findRolesAndClinics(
    userId: string,
  ): Promise<{ roles: UserClinicRole['role'][]; clinicIds: string[] }> {
    const links = await this.userClinicRoleRepository.find({
      where: { userId },
    });
    const roles = links.map((link) => link.role);
    const clinicIds = links.map((link) => link.clinicId);
    return { roles, clinicIds };
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
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

  async findAll(): Promise<Omit<User, 'password'>[]> {
    const users = await this.userRepository.find();
    return users.map((user) => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      fullName: user.fullName,
    }));
  }
}
