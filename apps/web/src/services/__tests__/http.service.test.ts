import { vi, describe, beforeEach, afterAll, it, expect } from 'vitest';
import { httpService } from '../http.service';
import { authService } from '../auth.service';

vi.mock('../auth.service', () => ({
  authService: {
    getToken: vi.fn(),
    logout: vi.fn(),
  },
}));

describe('http.service', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.restoreAllMocks();
    delete (window as any).location;
    (window as any).location = { href: '' };
  });

  afterAll(() => {
    // restore location
    (window as any).location = originalLocation;
  });

  it('adds JSON Content-Type and Authorization header when token exists', async () => {
    (authService.getToken as any).mockReturnValue('abc');
    const fetchSpy = vi.spyOn(global, 'fetch' as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    } as Response);

    await httpService.post('/x', { a: 1 });
    const call = fetchSpy.mock.calls[0];
    const url = call[0] as string;
    const init = call[1] as RequestInit;
    expect(url).toBe('/api/x');
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer abc');
  });

  it('does not force Content-Type for FormData', async () => {
    (authService.getToken as any).mockReturnValue(undefined);
    const fetchSpy = vi.spyOn(global, 'fetch' as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    } as Response);

    const fd = new FormData();
    fd.append('f', new Blob(['x'], { type: 'text/plain' }), 'a.txt');
    await httpService.post('/upload', fd as any);
    const init = fetchSpy.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>)?.['Content-Type']).toBeUndefined();
  });

  it('handles 204 No Content as undefined', async () => {
    vi.spyOn(global, 'fetch' as any).mockResolvedValue({
      ok: true,
      status: 204,
      json: async () => undefined,
    } as Response);
    const res = await httpService.delete('/things/1');
    expect(res).toBeUndefined();
  });

  it('on 401, logs out and redirects to /login', async () => {
    (authService.getToken as any).mockReturnValue('t');
    const logoutSpy = vi.spyOn(authService, 'logout').mockImplementation(() => {});
    vi.spyOn(global, 'fetch' as any).mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'unauthorized',
    } as Response);
    await expect(httpService.get('/secure')).rejects.toThrow('Authentication required');
    expect(logoutSpy).toHaveBeenCalled();
    expect(window.location.href).toBe('/login');
  });

  it('parses error JSON message; falls back to text', async () => {
    // JSON path with {message}
    vi.spyOn(global, 'fetch' as any).mockResolvedValueOnce({
      ok: false,
      status: 400,
      clone: () => ({ json: async () => ({ message: 'bad' }) }),
      text: async () => 'bad text',
    } as any);
    await expect(httpService.get('/err1')).rejects.toThrow('bad');

    // JSON path with {error}
    vi.spyOn(global, 'fetch' as any).mockResolvedValueOnce({
      ok: false,
      status: 400,
      clone: () => ({ json: async () => ({ error: 'bad2' }) }),
      text: async () => 'bad text',
    } as any);
    await expect(httpService.get('/err2')).rejects.toThrow('bad2');

    // JSON path throws -> fallback to text
    vi.spyOn(global, 'fetch' as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      clone: () => ({ json: async () => { throw new Error('parse'); } }),
      text: async () => 'server boom',
    } as any);
    await expect(httpService.get('/err3')).rejects.toThrow('server boom');
  });

  it('download includes Authorization and returns blob or throws', async () => {
    (authService.getToken as any).mockReturnValue('zzz');
    const blob = new Blob(['x']);
    let call: any;
    vi.spyOn(global, 'fetch' as any).mockImplementation((...args: any[]) => {
      call = args;
      return Promise.resolve({ ok: true, status: 200, blob: async () => blob } as any);
    });
    const res = await httpService.download('/doc/1');
    expect(res).toBeInstanceOf(Blob);
    expect((call[1].headers as any).Authorization).toBe('Bearer zzz');

    vi.spyOn(global, 'fetch' as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => 'not found',
    } as any);
    await expect(httpService.download('/missing')).rejects.toThrow('HTTP 404: not found');
  });
});


