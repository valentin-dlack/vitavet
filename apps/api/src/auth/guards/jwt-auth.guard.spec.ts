import { JwtAuthGuard } from './jwt-auth.guard';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtAuthGuard', () => {
  it('returns user when provided by strategy', () => {
    const guard = new JwtAuthGuard();
    const user = guard.handleRequest(null, { id: 'u1' } as any);
    expect(user).toEqual({ id: 'u1' });
  });

  it('throws UnauthorizedException when no user', () => {
    const guard = new JwtAuthGuard();
    expect(() => guard.handleRequest(null, null as any)).toThrow(
      UnauthorizedException,
    );
  });
});
