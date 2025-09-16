import { describe, it, expect, vi, beforeEach } from 'vitest';
import { animalsService } from '../animals.service';
import { httpService } from '../http.service';

vi.mock('../http.service', () => ({
  httpService: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    download: vi.fn(),
  },
}));

describe('animalsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updateAnimal calls PATCH with dto', async () => {
    (httpService.patch as any).mockResolvedValue({ id: 'an1', name: 'New' });
    const res = await animalsService.updateAnimal('an1', { name: 'New', weightKg: 12.3 });
    expect(httpService.patch).toHaveBeenCalledWith('/animals/an1', { name: 'New', weightKg: 12.3 });
    expect(res).toMatchObject({ id: 'an1', name: 'New' });
  });

  it('deleteAnimal calls DELETE endpoint', async () => {
    (httpService.delete as any).mockResolvedValue(undefined);
    await animalsService.deleteAnimal('an1');
    expect(httpService.delete).toHaveBeenCalledWith('/animals/an1');
  });
});


