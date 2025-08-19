import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnimalDetailsModal } from '../AnimalDetailsModal';
import { animalsService } from '../../services/animals.service';
import { documentsService } from '../../services/documents.service';

// Mock the services
vi.mock('../../services/animals.service', () => ({
  animalsService: {
    getHistory: vi.fn(),
  },
}));

vi.mock('../../services/documents.service', () => ({
  documentsService: {
    getDocumentsForAppointment: vi.fn(),
  },
}));

const mockAnimalsService = vi.mocked(animalsService);
const mockDocumentsService = vi.mocked(documentsService);

describe('AnimalDetailsModal', () => {
  const mockAnimal = {
    id: 'animal-123',
    name: 'Milo',
    species: 'chien',
    breed: 'Labrador',
    birthdate: '2020-01-15',
    sex: 'MALE' as const,
    weightKg: 25.5,
    heightCm: 55,
    color: 'noir',
    chipId: '123456789',
    isSterilized: true,
    isNac: false,
    clinicId: 'clinic-123',
    ownerId: 'owner-123',
  };

  const mockHistory = {
    animal: mockAnimal,
    appointments: [
      {
        id: 'apt-1',
        startsAt: '2024-01-10T10:00:00Z',
        endsAt: '2024-01-10T11:00:00Z',
        status: 'COMPLETED',
        report: 'Animal en bonne santé',
        vet: { firstName: 'Dr', lastName: 'Smith' },
        type: { label: 'Consultation' },
      },
      {
        id: 'apt-2',
        startsAt: '2025-12-15T14:00:00Z',
        endsAt: '2025-12-15T15:00:00Z',
        status: 'SCHEDULED',
        vet: { firstName: 'Dr', lastName: 'Johnson' },
        type: { label: 'Vaccination' },
      },
    ],
  };

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    animal: mockAnimal,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAnimalsService.getHistory.mockResolvedValue(mockHistory);
    mockDocumentsService.getDocumentsForAppointment.mockResolvedValue([]);
  });

  it('renders the modal when open with animal details', async () => {
    render(<AnimalDetailsModal {...defaultProps} />);

    expect(screen.getByText('Milo')).toBeInTheDocument();
    expect(screen.getByText('chien • Labrador')).toBeInTheDocument();

    // Wait for history to load
    await waitFor(() => {
      expect(mockAnimalsService.getHistory).toHaveBeenCalledWith('animal-123');
    });
  });

  it('displays animal details correctly', async () => {
    render(<AnimalDetailsModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Détails')).toBeInTheDocument();
      expect(screen.getByText(/5 ans/)).toBeInTheDocument(); // Age calculation
      expect(screen.getByText('MALE')).toBeInTheDocument();
      expect(screen.getByText('25.5 kg')).toBeInTheDocument();
      expect(screen.getByText('55 cm')).toBeInTheDocument();
      expect(screen.getByText('noir')).toBeInTheDocument();
      expect(screen.getByText('123456789')).toBeInTheDocument();
      expect(screen.getByText('Oui')).toBeInTheDocument(); // Sterilized
      expect(screen.getByText('Non')).toBeInTheDocument(); // NAC
    });
  });

  it('displays upcoming appointments', async () => {
    render(<AnimalDetailsModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Prochains RDV')).toBeInTheDocument();
      expect(screen.getByText(/Vaccination/)).toBeInTheDocument();
    });
  });

  it('displays recent reports', async () => {
    render(<AnimalDetailsModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Rapports récents')).toBeInTheDocument();
      expect(screen.getByText('Rapport: Animal en bonne santé')).toBeInTheDocument();
    });
  });

  it('does not render when closed', () => {
    render(<AnimalDetailsModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Milo')).not.toBeInTheDocument();
  });

  it('does not render when no animal is provided', () => {
    render(<AnimalDetailsModal {...defaultProps} animal={null} />);

    expect(screen.queryByText('Milo')).not.toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockAnimalsService.getHistory.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<AnimalDetailsModal {...defaultProps} />);

    expect(screen.getAllByText('Chargement…')[0]).toBeInTheDocument();
  });

  it('shows error state', async () => {
    mockAnimalsService.getHistory.mockRejectedValue(new Error('Failed to load'));

    render(<AnimalDetailsModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load')).toBeInTheDocument();
    });
  });
});
