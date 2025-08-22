import { vi, describe, afterEach, it, expect } from 'vitest';
import { documentsService } from '../documents.service';
import { httpService } from '../http.service';

vi.mock('../http.service', () => ({
  httpService: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('documents.service', () => {
  afterEach(() => vi.clearAllMocks());

  it('uploadDocument posts FormData to upload endpoint', async () => {
    (httpService.post as any).mockResolvedValue({ id: 'd1' });
    const file = new File(['x'], 'a.txt', { type: 'text/plain' });
    await documentsService.uploadDocument('apt1', file, 'desc');
    const call = (httpService.post as any).mock.calls[0];
    expect(call[0]).toBe('/documents/upload/appointment/apt1');
    expect(call[1]).toBeInstanceOf(FormData);
  });

  it('getDocumentsForAppointment calls GET on /appointments/:id/documents', async () => {
    (httpService.get as any).mockResolvedValue([]);
    await documentsService.getDocumentsForAppointment('apt1');
    expect(httpService.get).toHaveBeenCalledWith('/appointments/apt1/documents');
  });
});


