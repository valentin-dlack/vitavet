import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
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
