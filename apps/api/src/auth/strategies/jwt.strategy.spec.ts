import { JwtStrategy } from './jwt.strategy';
import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';

describe('JwtStrategy', () => {
  const authService = {
    validateUser: jest.fn<Promise<any>, [string]>(),
  };
  const usersService = {
    findPrimaryRole: jest.fn<Promise<string | null>, [string]>(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns mapped user with role when valid', async () => {
    authService.validateUser.mockResolvedValue({
      id: 'u1',
      email: 'a@b.c',
      password: 'hash',
      firstName: 'A',
      lastName: 'B',
      isEmailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      get fullName() {
        return 'A B';
      },
    } as any);

    const strat = new JwtStrategy(
      authService as unknown as AuthService,
      usersService as unknown as UsersService,
    );
    const res = await strat.validate({
      sub: 'u1',
      email: 'a@b.c',
      roles: ['VET'],
      clinicIds: ['c1'],
    } as any);
    expect(res).toEqual({
      id: 'u1',
      email: 'a@b.c',
      firstName: 'A',
      lastName: 'B',
      role: 'VET',
      roles: ['VET'],
      clinicIds: ['c1'],
    });
  });
  it('returns null when user invalid', async () => {
    authService.validateUser.mockResolvedValue(null);
    const strat = new JwtStrategy(
      authService as unknown as AuthService,
      usersService as unknown as UsersService,
    );
    await expect(
      strat.validate({ sub: 'nope', email: 'x@y.z' } as any),
    ).resolves.toBeNull();
  });
});
