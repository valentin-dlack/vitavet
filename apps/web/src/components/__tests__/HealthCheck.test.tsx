import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HealthCheck } from '../HealthCheck';

// Mock fetch
global.fetch = vi.fn();

describe('HealthCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading state initially', () => {
    render(<HealthCheck />);
    expect(screen.getByTestId('health-loading')).toBeInTheDocument();
  });

  it('should show health status when API call succeeds', async () => {
    const mockHealthData = {
      status: 'ok',
      timestamp: '2024-01-01T00:00:00.000Z',
      uptime: 123.456,
      environment: 'test'
    };

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockHealthData,
    });

    render(<HealthCheck />);

    await waitFor(() => {
      expect(screen.getByTestId('health-status')).toBeInTheDocument();
    });

    expect(screen.getByText('API Health Status')).toBeInTheDocument();
    expect(screen.getByText('Status: ok')).toBeInTheDocument();
    expect(screen.getByText('Environment: test')).toBeInTheDocument();
  });

  it('should show error when API call fails', async () => {
    (fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(<HealthCheck />);

    await waitFor(() => {
      expect(screen.getByTestId('health-error')).toBeInTheDocument();
    });

    expect(screen.getByText('Error: Network error')).toBeInTheDocument();
  });

  it('should show error when API returns non-ok status', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(<HealthCheck />);

    await waitFor(() => {
      expect(screen.getByTestId('health-error')).toBeInTheDocument();
    });

    expect(screen.getByText('Error: HTTP error! status: 500')).toBeInTheDocument();
  });
});
