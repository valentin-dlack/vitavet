import { CurrentUser } from './current-user.decorator';

describe('CurrentUser decorator', () => {
  it('is a function created by createParamDecorator', () => {
    expect(typeof CurrentUser).toBe('function');
  });

  it('returns a decorator factory when called (Nest usage)', () => {
    const mockExecutionContext = {
      switchToHttp: () => ({ getRequest: () => ({ user: { id: 'u' } }) }),
    } as any;
    const factory = (
      CurrentUser as unknown as (data: unknown, ctx: any) => unknown
    )(undefined, mockExecutionContext);
    expect(typeof factory).toBe('function');
  });
});
