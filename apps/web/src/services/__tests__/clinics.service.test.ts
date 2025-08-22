import { afterEach, describe, expect, it, vi } from 'vitest';
import { clinicsService } from '../clinics.service';
import { httpService } from '../http.service';

vi.mock('../http.service', () => ({
  httpService: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('clinics.service', () => {
  afterEach(() => vi.clearAllMocks());

  it('createClinic posts to /clinics', async () => {
    (httpService.post as any).mockResolvedValue({ id: 'c1' });
    const res = await clinicsService.createClinic({ name: 'N', city: 'C', postcode: '75001' });
    expect(httpService.post).toHaveBeenCalledWith('/clinics', { name: 'N', city: 'C', postcode: '75001' });
    expect(res).toEqual({ id: 'c1' });
  });

  it('updateClinic patches clinic by id', async () => {
    (httpService.patch as any).mockResolvedValue({ id: 'c1', name: 'X' });
    await clinicsService.updateClinic('c1', { name: 'X' });
    expect(httpService.patch).toHaveBeenCalledWith('/clinics/c1', { name: 'X' });
  });

  it('deleteClinic calls delete endpoint', async () => {
    (httpService.delete as any).mockResolvedValue(undefined);
    await clinicsService.deleteClinic('c1');
    expect(httpService.delete).toHaveBeenCalledWith('/clinics/c1');
  });

  it('assignRole posts to /clinics/:id/roles', async () => {
    (httpService.post as any).mockResolvedValue({ userId: 'u1' });
    await clinicsService.assignRole('c1', 'u1', 'VET');
    expect(httpService.post).toHaveBeenCalledWith('/clinics/c1/roles', { userId: 'u1', role: 'VET' });
  });

  it('getClinicRoles GETs roles list', async () => {
    (httpService.get as any).mockResolvedValue([]);
    await clinicsService.getClinicRoles('c1');
    expect(httpService.get).toHaveBeenCalledWith('/clinics/c1/roles');
  });

  it('search builds query with postcode and services', async () => {
    (httpService.get as any).mockResolvedValue([]);
    await clinicsService.search('750', ['urgence', 'radio']);
    expect(httpService.get).toHaveBeenCalledWith('/clinics?postcode=750&services=urgence%2Cradio');
  });

  it('getVetsByClinic GETs vets', async () => {
    (httpService.get as any).mockResolvedValue([]);
    await clinicsService.getVetsByClinic('c1');
    expect(httpService.get).toHaveBeenCalledWith('/clinics/c1/vets');
  });

  it('getById GETs clinic detail', async () => {
    (httpService.get as any).mockResolvedValue({ id: 'c1' });
    await clinicsService.getById('c1');
    expect(httpService.get).toHaveBeenCalledWith('/clinics/c1');
  });

  it('listServices GETs services', async () => {
    (httpService.get as any).mockResolvedValue([]);
    await clinicsService.listServices();
    expect(httpService.get).toHaveBeenCalledWith('/clinics/services/list');
  });
});


