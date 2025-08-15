import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ClinicSearch } from '../../components/ClinicSearch';
import { clinicsService } from '../../services/clinics.service';

vi.mock('../../services/clinics.service', async () => {
  const actual = await vi.importActual<typeof import('../../services/clinics.service')>('../../services/clinics.service');
  return {
    ...actual,
    clinicsService: {
      search: vi.fn(),
    },
  };
});

describe('ClinicSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('searches clinics and shows results', async () => {
    (clinicsService.search as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { id: '1', name: 'Clinique A', city: 'Paris', postcode: '75001' },
    ]);

    render(<ClinicSearch />);

    fireEvent.change(screen.getByLabelText(/code postal/i), { target: { value: '75001' } });
    fireEvent.click(screen.getByRole('button', { name: /rechercher/i }));

    await waitFor(() => {
      expect(screen.getByText(/Clinique A/)).toBeInTheDocument();
      expect(screen.getByText(/75001 Paris/)).toBeInTheDocument();
    });
  });
});


