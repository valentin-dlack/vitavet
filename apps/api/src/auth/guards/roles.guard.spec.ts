import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

function createExecutionContext(user?: { role?: string }): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let reflector: Reflector;
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('allows when no roles are required', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(undefined as any);
    const ctx = createExecutionContext();
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('denies when user missing', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['VET']);
    const ctx = createExecutionContext(undefined);
    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('allows when user role included', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ASV', 'VET']);
    const ctx = createExecutionContext({ role: 'ASV' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('denies when user role not included', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['ADMIN_CLINIC']);
    const ctx = createExecutionContext({ role: 'OWNER' });
    expect(guard.canActivate(ctx)).toBe(false);
  });
});
