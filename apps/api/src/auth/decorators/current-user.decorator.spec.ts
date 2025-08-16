import { CurrentUser } from './current-user.decorator';

describe('CurrentUser decorator', () => {
  it('is a factory function produced by createParamDecorator', () => {
    expect(typeof CurrentUser).toBe('function');
    // Should return a decorator function when invoked in test context
    const mockExecutionContext = {
      switchToHttp: () => ({ getRequest: () => ({ user: {} }) }),
    };
    const result = CurrentUser(undefined, mockExecutionContext);
    expect(typeof result).toBe('function');
  });
});
