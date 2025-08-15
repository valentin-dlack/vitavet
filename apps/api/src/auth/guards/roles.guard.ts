import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

export type UserRole = 'OWNER' | 'VET' | 'ASV' | 'ADMIN_CLINIC' | 'WEBMASTER';

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

    const { user } = context.switchToHttp().getRequest();
    
    if (!user) {
      return false;
    }

    // For MVP, we'll use a simple role system
    // In a real app, this would check user roles from database
    const userRole = user.role || 'OWNER'; // Default to OWNER for MVP

    return requiredRoles.includes(userRole);
  }
}
