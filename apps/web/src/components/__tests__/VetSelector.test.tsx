import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { VetSelector } from '../VetSelector';
import { clinicsService } from '../../services/clinics.service';

// Mock the clinics service
vi.mock('../../services/clinics.service', () => ({
  clinicsService: {
    getVetsByClinic: vi.fn(),
  },
}));

const mockClinicsService = vi.mocked(clinicsService);

describe('VetSelector', () => {
  const mockVets = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      firstName: 'Dr. Martin',
      lastName: 'Dubois',
      email: 'martin.dubois@vitavet.fr',
      specialty: 'Chirurgie générale',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      firstName: 'Dr. Sophie',
      lastName: 'Leroy',
      email: 'sophie.leroy@vitavet.fr',
      specialty: 'Dermatologie',
    },
  ];

  const defaultProps = {
    clinicId: '550e8400-e29b-41d4-a716-446655440000',
    onVetSelect: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    mockClinicsService.getVetsByClinic.mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    render(<VetSelector {...defaultProps} />);

    expect(screen.getByText('Vétérinaire')).toBeInTheDocument();
    expect(screen.getByText('Chargement des vétérinaires...')).toBeInTheDocument();
  });

  it('should render vets dropdown when data is loaded', async () => {
    mockClinicsService.getVetsByClinic.mockResolvedValue(mockVets);

    render(<VetSelector {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    expect(screen.getByText('Tous les vétérinaires')).toBeInTheDocument();
    expect(screen.getByText('Dr. Martin Dubois - Chirurgie générale')).toBeInTheDocument();
    expect(screen.getByText('Dr. Sophie Leroy - Dermatologie')).toBeInTheDocument();
  });

  it('should display vets in dropdown when data is loaded', async () => {
    mockClinicsService.getVetsByClinic.mockResolvedValue(mockVets);

    render(<VetSelector {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    expect(screen.getByText('Tous les vétérinaires')).toBeInTheDocument();
    expect(screen.getByText('Dr. Martin Dubois - Chirurgie générale')).toBeInTheDocument();
    expect(screen.getByText('Dr. Sophie Leroy - Dermatologie')).toBeInTheDocument();
  });

  it('should render error state when API call fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockClinicsService.getVetsByClinic.mockRejectedValue(new Error('API Error'));

    render(<VetSelector {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Erreur: API Error')).toBeInTheDocument();
    });
    consoleErrorSpy.mockRestore();
  });

  it('should be disabled when disabled prop is true', async () => {
    mockClinicsService.getVetsByClinic.mockResolvedValue(mockVets);

    render(<VetSelector {...defaultProps} disabled={true} />);

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeDisabled();
    });
  });

  it('should show selected vet when selectedVetId is provided', async () => {
    mockClinicsService.getVetsByClinic.mockResolvedValue(mockVets);

    render(<VetSelector {...defaultProps} selectedVetId="550e8400-e29b-41d4-a716-446655440001" />);

    await waitFor(() => {
      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('550e8400-e29b-41d4-a716-446655440001');
    });
  });
});
