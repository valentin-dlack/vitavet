import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { AddAnimalModal } from '../AddAnimalModal';
import { animalsService } from '../../services/animals.service';

// Mock the animals service
vi.mock('../../services/animals.service', () => ({
  animalsService: {
    createAnimal: vi.fn(),
  },
}));

const mockAnimalsService = vi.mocked(animalsService);

describe('AddAnimalModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    clinicId: 'clinic-123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the modal when open', () => {
    render(<AddAnimalModal {...defaultProps} />);
    
    expect(screen.getByText('Ajouter un animal')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /nom/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Date de naissance')).toBeInTheDocument();
    expect(screen.getByLabelText('Espèce')).toBeInTheDocument();
    expect(screen.getByLabelText('Race')).toBeInTheDocument();
    expect(screen.getByLabelText('Sexe')).toBeInTheDocument();
    expect(screen.getByLabelText('Couleur')).toBeInTheDocument();
    expect(screen.getByLabelText('Numéro de puce')).toBeInTheDocument();
    expect(screen.getByLabelText('Poids (kg)')).toBeInTheDocument();
    expect(screen.getByLabelText('Taille (cm)')).toBeInTheDocument();
    expect(screen.getByLabelText('Stérilisé(e)')).toBeInTheDocument();
    expect(screen.getByLabelText('NAC (Nouveaux Animaux de Compagnie)')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<AddAnimalModal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Ajouter un animal')).not.toBeInTheDocument();
  });

  it('handles form submission successfully', async () => {
    const mockAnimal = {
      id: 'animal-123',
      name: 'Milo',
      clinicId: 'clinic-123',
      species: 'chien',
      breed: 'Labrador',
    };
    
    mockAnimalsService.createAnimal.mockResolvedValue(mockAnimal);

    render(<AddAnimalModal {...defaultProps} />);

    // Fill in required field
    fireEvent.change(screen.getByRole('textbox', { name: /nom/i }), {
      target: { value: 'Milo' },
    });

    // Fill in optional fields
    fireEvent.change(screen.getByLabelText('Espèce'), {
      target: { value: 'chien' },
    });
    fireEvent.change(screen.getByLabelText('Race'), {
      target: { value: 'Labrador' },
    });

    // Submit form
    fireEvent.click(screen.getByText('Créer l\'animal'));

    await waitFor(() => {
      expect(mockAnimalsService.createAnimal).toHaveBeenCalledWith({
        name: 'Milo',
        clinicId: 'clinic-123',
        species: 'chien',
        breed: 'Labrador',
        sex: 'UNKNOWN',
        isSterilized: false,
        isNac: false,
        birthdate: '',
        color: '',
        chipId: '',
        weightKg: undefined,
        heightCm: undefined,
      });
    });

    expect(defaultProps.onSuccess).toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('handles form submission error', async () => {
    const errorMessage = 'Failed to create animal';
    mockAnimalsService.createAnimal.mockRejectedValue(new Error(errorMessage));

    render(<AddAnimalModal {...defaultProps} />);

    // Fill in required field
    fireEvent.change(screen.getByRole('textbox', { name: /nom/i }), {
      target: { value: 'Milo' },
    });

    // Submit form
    fireEvent.click(screen.getByText('Créer l\'animal'));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    expect(defaultProps.onSuccess).not.toHaveBeenCalled();
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('validates required fields', async () => {
    render(<AddAnimalModal {...defaultProps} />);

    // Try to submit without filling required fields
    fireEvent.click(screen.getByText('Créer l\'animal'));

    // The form should not submit due to HTML5 validation
    expect(mockAnimalsService.createAnimal).not.toHaveBeenCalled();
  });

  it('handles close button click', () => {
    render(<AddAnimalModal {...defaultProps} />);

    fireEvent.click(screen.getByLabelText('Fermer'));

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('handles cancel button click', () => {
    render(<AddAnimalModal {...defaultProps} />);

    fireEvent.click(screen.getByText('Annuler'));

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('handles escape key', () => {
    render(<AddAnimalModal {...defaultProps} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('focuses on name input when opened', () => {
    render(<AddAnimalModal {...defaultProps} />);

    const nameInput = screen.getByRole('textbox', { name: /nom/i });
    expect(nameInput).toHaveFocus();
  });

  it('handles numeric inputs correctly', async () => {
    mockAnimalsService.createAnimal.mockResolvedValue({ id: 'animal-123', name: 'Milo' });

    render(<AddAnimalModal {...defaultProps} />);

    // Fill in required field
    fireEvent.change(screen.getByRole('textbox', { name: /nom/i }), {
      target: { value: 'Milo' },
    });

    // Fill in numeric fields
    fireEvent.change(screen.getByLabelText('Poids (kg)'), {
      target: { value: '25.5' },
    });
    fireEvent.change(screen.getByLabelText('Taille (cm)'), {
      target: { value: '55' },
    });

    // Submit form
    fireEvent.click(screen.getByText('Créer l\'animal'));

    await waitFor(() => {
      expect(mockAnimalsService.createAnimal).toHaveBeenCalledWith(
        expect.objectContaining({
          weightKg: 25.5,
          heightCm: 55,
        })
      );
    });
  });

  it('handles checkbox inputs correctly', async () => {
    mockAnimalsService.createAnimal.mockResolvedValue({ id: 'animal-123', name: 'Milo' });

    render(<AddAnimalModal {...defaultProps} />);

    // Fill in required field
    fireEvent.change(screen.getByRole('textbox', { name: /nom/i }), {
      target: { value: 'Milo' },
    });

    // Check checkboxes
    fireEvent.click(screen.getByLabelText('Stérilisé(e)'));
    fireEvent.click(screen.getByLabelText('NAC (Nouveaux Animaux de Compagnie)'));

    // Submit form
    fireEvent.click(screen.getByText('Créer l\'animal'));

    await waitFor(() => {
      expect(mockAnimalsService.createAnimal).toHaveBeenCalledWith(
        expect.objectContaining({
          isSterilized: true,
          isNac: true,
        })
      );
    });
  });

  it('handles select input correctly', async () => {
    mockAnimalsService.createAnimal.mockResolvedValue({ id: 'animal-123', name: 'Milo' });

    render(<AddAnimalModal {...defaultProps} />);

    // Fill in required field
    fireEvent.change(screen.getByRole('textbox', { name: /nom/i }), {
      target: { value: 'Milo' },
    });

    // Change sex selection
    fireEvent.change(screen.getByLabelText('Sexe'), {
      target: { value: 'MALE' },
    });

    // Submit form
    fireEvent.click(screen.getByText('Créer l\'animal'));

    await waitFor(() => {
      expect(mockAnimalsService.createAnimal).toHaveBeenCalledWith(
        expect.objectContaining({
          sex: 'MALE',
        })
      );
    });
  });
});
