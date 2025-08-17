import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';
import type { UserRole } from '../guards/roles.guard';

interface JwtPayload {
  sub: string;
  email: string;
}

interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  roles: UserRole[];
  clinicIds: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser | null> {
    const user = await this.authService.validateUser(payload.sub);
    if (!user) {
      return null;
    }

    // Load primary role and all roles (MVP: first match as primary, plus list)
    const primaryRole =
      (await this.usersService.findPrimaryRole(user.id)) || 'OWNER';
    // For future: include clinicIds if needed; left empty for now
    const result: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: primaryRole,
      roles: [primaryRole],
      clinicIds: [],
    };
    return result;
  }
}
