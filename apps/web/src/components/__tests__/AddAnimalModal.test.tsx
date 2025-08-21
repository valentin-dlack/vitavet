import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { animalsService } from '../../services/animals.service';
import { clinicsService } from '../../services/clinics.service';
import { AddAnimalModal } from '../AddAnimalModal';

// Mock the services
vi.mock('../../services/animals.service', () => ({
  animalsService: {
    createAnimal: vi.fn(),
  },
}));

vi.mock('../../services/clinics.service', () => ({
  clinicsService: {
    search: vi.fn(),
  },
}));

const mockAnimalsService = vi.mocked(animalsService);
const mockClinicsService = vi.mocked(clinicsService);

describe('AddAnimalModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  };

  const mockClinics = [
    { id: 'clinic-1', name: 'Clinique A', city: 'Paris', postcode: '75001' },
    { id: 'clinic-2', name: 'Clinique B', city: 'Lyon', postcode: '69001' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockClinicsService.search.mockResolvedValue(mockClinics);
  });

  it('renders the modal when open', async () => {
    await act(async () => {
      render(<AddAnimalModal {...defaultProps} />);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Ajouter un animal')).toBeInTheDocument();
    });
    
    expect(screen.getByRole('textbox', { name: /nom/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/clinique/i)).toBeInTheDocument();
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
      clinicId: 'clinic-1',
      species: 'chien',
      breed: 'Labrador',
      ownerId: 'owner-123',
      birthdate: '',
      color: '',
      chipId: '',
      weightKg: undefined,
      heightCm: undefined,
    };
    
    mockAnimalsService.createAnimal.mockResolvedValue(mockAnimal);

    await act(async () => {
      render(<AddAnimalModal {...defaultProps} />);
    });

    // Wait for clinics to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('Sélectionner une clinique…')).toBeInTheDocument();
    });

    // Select a clinic
    fireEvent.change(screen.getByLabelText(/clinique/i), {
      target: { value: 'clinic-1' },
    });

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
        clinicId: 'clinic-1',
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

    await act(async () => {
      render(<AddAnimalModal {...defaultProps} />);
    });

    // Wait for clinics to load and select one
    await waitFor(() => {
      expect(screen.getByDisplayValue('Sélectionner une clinique…')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/clinique/i), {
      target: { value: 'clinic-1' },
    });

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
    await act(async () => {
      render(<AddAnimalModal {...defaultProps} />);
    });

    // Wait for clinics to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('Sélectionner une clinique…')).toBeInTheDocument();
    });

    // Try to submit without filling required fields
    fireEvent.click(screen.getByText('Créer l\'animal'));

    // The form should not submit due to HTML5 validation
    expect(mockAnimalsService.createAnimal).not.toHaveBeenCalled();
  });

  it('handles close button click', async () => {
    await act(async () => {
      render(<AddAnimalModal {...defaultProps} />);
    });

    // Wait for clinics to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('Sélectionner une clinique…')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Fermer'));

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('handles cancel button click', async () => {
    await act(async () => {
      render(<AddAnimalModal {...defaultProps} />);
    });

    // Wait for clinics to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('Sélectionner une clinique…')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Annuler'));

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('handles escape key', async () => {
    await act(async () => {
      render(<AddAnimalModal {...defaultProps} />);
    });

    // Wait for clinics to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('Sélectionner une clinique…')).toBeInTheDocument();
    });

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('focuses on name input when opened', async () => {
    await act(async () => {
      render(<AddAnimalModal {...defaultProps} />);
    });

    // Wait for clinics to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('Sélectionner une clinique…')).toBeInTheDocument();
    });

    const nameInput = screen.getByRole('textbox', { name: /nom/i });
    expect(nameInput).toHaveFocus();
  });

  it('handles numeric inputs correctly', async () => {
    mockAnimalsService.createAnimal.mockResolvedValue({ id: 'animal-123', name: 'Milo', clinicId: 'clinic-1', ownerId: 'owner-123' });

    await act(async () => {
      render(<AddAnimalModal {...defaultProps} />);
    });

    // Wait for clinics to load and select one
    await waitFor(() => {
      expect(screen.getByDisplayValue('Sélectionner une clinique…')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/clinique/i), {
      target: { value: 'clinic-1' },
    });

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
          clinicId: 'clinic-1',
          weightKg: 25.5,
          heightCm: 55,
        })
      );
    });
  });

  it('handles checkbox inputs correctly', async () => {
    mockAnimalsService.createAnimal.mockResolvedValue({ id: 'animal-123', name: 'Milo', clinicId: 'clinic-1', ownerId: 'owner-123' });

    await act(async () => {
      render(<AddAnimalModal {...defaultProps} />);
    });

    // Wait for clinics to load and select one
    await waitFor(() => {
      expect(screen.getByDisplayValue('Sélectionner une clinique…')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/clinique/i), {
      target: { value: 'clinic-1' },
    });

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
          clinicId: 'clinic-1',
          isSterilized: true,
          isNac: true,
        })
      );
    });
  });

  it('handles select input correctly', async () => {
    mockAnimalsService.createAnimal.mockResolvedValue({ id: 'animal-123', name: 'Milo', clinicId: 'clinic-1', ownerId: 'owner-123' });

    await act(async () => {
      render(<AddAnimalModal {...defaultProps} />);
    });

    // Wait for clinics to load and select one
    await waitFor(() => {
      expect(screen.getByDisplayValue('Sélectionner une clinique…')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/clinique/i), {
      target: { value: 'clinic-1' },
    });

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
          clinicId: 'clinic-1',
          sex: 'MALE',
        })
      );
    });
  });
});
