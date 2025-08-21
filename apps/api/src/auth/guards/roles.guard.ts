import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { User } from 'src/users/entities/user.entity';

export type UserRole = 'OWNER' | 'VET' | 'ASV' | 'ADMIN_CLINIC' | 'WEBMASTER';

interface RequestWithUser extends Request {
  user: User & { role?: UserRole; roles?: UserRole[] };
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<RequestWithUser>();

    if (!user) {
      return false;
    }

    // Support single primary role and multi-roles array
    const primaryRole = user.role;
    const roleList: UserRole[] = Array.isArray(user.roles) ? user.roles : [];

    if (primaryRole && requiredRoles.includes(primaryRole)) {
      return true;
    }

    return roleList.some((r) => requiredRoles.includes(r));
  }
}
