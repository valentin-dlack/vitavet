import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import ProfileEditModal from '../ProfileEditModal';
import { authService } from '../../services/auth.service';

// Mock the auth service
vi.mock('../../services/auth.service', () => ({
  authService: {
    updateProfile: vi.fn(),
  },
}));

describe('ProfileEditModal', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    roles: ['OWNER'],
    clinics: [],
  };

  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the modal with user information', () => {
    render(
      <ProfileEditModal
        user={mockUser}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    expect(screen.getByText('Modifier le profil')).toBeInTheDocument();
    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
  });

  it('should close modal when backdrop is clicked', () => {
    render(
      <ProfileEditModal
        user={mockUser}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    const backdrop = screen.getByTestId('modal-backdrop');
    fireEvent.click(backdrop);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should close modal when close button is clicked', () => {
    render(
      <ProfileEditModal
        user={mockUser}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    const closeButton = screen.getByLabelText('Fermer');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should update form data when inputs change', () => {
    render(
      <ProfileEditModal
        user={mockUser}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    const firstNameInput = screen.getByDisplayValue('John');
    fireEvent.change(firstNameInput, { target: { value: 'Jane' } });

    expect(firstNameInput).toHaveValue('Jane');
  });

  it('should submit form successfully', async () => {
    vi.mocked(authService.updateProfile).mockResolvedValue({
      message: 'Profile updated successfully',
    });

    render(
      <ProfileEditModal
        user={mockUser}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    const submitButton = screen.getByText('Mettre à jour');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(authService.updateProfile).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
      });
      expect(mockOnSuccess).toHaveBeenCalledWith('Profile updated successfully');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should handle form submission error', async () => {
    const errorMessage = 'Failed to update profile';
    vi.mocked(authService.updateProfile).mockRejectedValue(new Error(errorMessage));

    render(
      <ProfileEditModal
        user={mockUser}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    const submitButton = screen.getByText('Mettre à jour');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(errorMessage);
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  it('should show loading state during submission', async () => {
    vi.mocked(authService.updateProfile).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <ProfileEditModal
        user={mockUser}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    const submitButton = screen.getByRole('button', { name: /mettre à jour/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Mise à jour...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  it('should disable submit button when form is invalid', () => {
    render(
      <ProfileEditModal
        user={mockUser}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    const firstNameInput = screen.getByDisplayValue('John');
    fireEvent.change(firstNameInput, { target: { value: '' } });

    const submitButton = screen.getByRole('button', { name: /mettre à jour/i });
    expect(submitButton).toBeDisabled();
  });

  it('should have proper accessibility attributes', () => {
    render(
      <ProfileEditModal
        user={mockUser}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    expect(screen.getByLabelText('Fermer')).toBeInTheDocument();
    expect(screen.getByLabelText('Prénom *')).toBeInTheDocument();
    expect(screen.getByLabelText('Nom *')).toBeInTheDocument();
    expect(screen.getByLabelText('Adresse email *')).toBeInTheDocument();
  });
});
