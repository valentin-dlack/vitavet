import { vi, describe, afterEach, it, expect } from 'vitest';
import { appointmentsService } from '../appointments.service';
import { httpService } from '../http.service';

vi.mock('../http.service', () => ({
  httpService: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('appointments.service', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('createAppointment posts to /appointments', async () => {
    (httpService.post as any).mockResolvedValue({ id: 'a1' });
    const res = await appointmentsService.createAppointment({
      clinicId: 'c1',
      animalId: 'an1',
      vetUserId: 'v1',
      startsAt: '2024-01-01T09:00:00Z',
    });
    expect(httpService.post).toHaveBeenCalledWith('/appointments', expect.any(Object));
    expect(res).toEqual({ id: 'a1' });
  });

  it('getMyUpcoming hits /appointments/me', async () => {
    (httpService.get as any).mockResolvedValue([]);
    await appointmentsService.getMyUpcoming();
    expect(httpService.get).toHaveBeenCalledWith('/appointments/me');
  });

  it('getMyAppointments builds status query when provided', async () => {
    (httpService.get as any).mockResolvedValue([]);
    await appointmentsService.getMyAppointments('PENDING');
    expect(httpService.get).toHaveBeenCalledWith('/appointments/me?status=PENDING');
  });

  it('getPendingAppointments constructs params', async () => {
    (httpService.get as any).mockResolvedValue({ appointments: [], total: 0 });
    await appointmentsService.getPendingAppointments('c1', 10, 5);
    expect(httpService.get).toHaveBeenCalledWith('/appointments/pending?clinicId=c1&limit=10&offset=5');
  });

  it('confirmAppointment PATCHes correct URL', async () => {
    (httpService.patch as any).mockResolvedValue({ id: 'a1' });
    await appointmentsService.confirmAppointment('a1');
    expect(httpService.patch).toHaveBeenCalledWith('/appointments/a1/confirm');
  });

  it('completeAppointment PATCHes with body', async () => {
    (httpService.patch as any).mockResolvedValue({ id: 'a1' });
    await appointmentsService.completeAppointment('a1', { notes: 'n' });
    expect(httpService.patch).toHaveBeenCalledWith('/appointments/a1/complete', { notes: 'n' });
  });
});


