import { describe, beforeEach, vi, afterAll, it, expect } from 'vitest';
import { slotsService } from '../slots.service';

describe('slots.service', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.restoreAllMocks();
    delete (window as any).location;
    (window as any).location = { origin: 'http://localhost' };
  });

  afterAll(() => {
    (window as any).location = originalLocation;
  });

  it('builds URL with query params and returns json', async () => {
    const payload = [{ id: 's1', startsAt: '', endsAt: '', durationMinutes: 30 }];
    const fetchSpy = vi.spyOn(global, 'fetch' as any).mockResolvedValue({
      ok: true,
      json: async () => payload,
    } as Response);

    const res = await slotsService.getAvailableSlots({ clinicId: 'c1', date: '2024-01-10', vetUserId: 'v1' });
    expect(fetchSpy).toHaveBeenCalled();
    const url = new URL((fetchSpy.mock.calls[0][0] as string));
    expect(url.pathname).toBe('/api/slots');
    expect(url.searchParams.get('clinicId')).toBe('c1');
    expect(url.searchParams.get('date')).toBe('2024-01-10');
    expect(url.searchParams.get('vetUserId')).toBe('v1');
    expect(res).toEqual(payload);
  });

  it('throws when response not ok', async () => {
    vi.spyOn(global, 'fetch' as any).mockResolvedValue({ ok: false } as Response);
    await expect(
      slotsService.getAvailableSlots({ clinicId: 'c1', date: '2024-01-10' }),
    ).rejects.toThrow('Failed to fetch slots');
  });
});


