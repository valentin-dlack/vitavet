import { render, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HealthCheck } from '../HealthCheck';

vi.mock('../../services/http.service', () => ({
  httpService: {
    get: vi.fn(),
  },
}));

import { httpService } from '../../services/http.service';

describe('HealthCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logs health to console on success', async () => {
    const mockHealthData = {
      status: 'ok',
      timestamp: '2024-01-01T00:00:00.000Z',
      uptime: 123.456,
      environment: 'test',
    };
    (httpService.get as any).mockResolvedValueOnce(mockHealthData);
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    render(<HealthCheck />);

    await waitFor(() => {
      expect(infoSpy).toHaveBeenCalledWith('[VitaVet] API health', mockHealthData);
    });
  });

  it('logs error to console on failure', async () => {
    (httpService.get as any).mockRejectedValueOnce(new Error('Network error'));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(<HealthCheck />);

    await waitFor(() => {
      expect(warnSpy).toHaveBeenCalled();
      const firstArg = (warnSpy.mock.calls[0] || [])[1];
      expect(String(firstArg)).toContain('Network error');
    });
  });
});
