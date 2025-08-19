import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RejectAppointmentModal } from '../RejectAppointmentModal';

describe('RejectAppointmentModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onReject: vi.fn(),
    appointmentId: 'apt-123',
    appointmentDetails: {
      animalName: 'Milo',
      ownerName: 'Jean Dupont',
      date: 'Lundi 15 janvier 2024 à 10:00',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the modal when open', () => {
    render(<RejectAppointmentModal {...defaultProps} />);

    expect(screen.getByText('Rejeter le rendez-vous')).toBeInTheDocument();
    expect(screen.getByText('Milo')).toBeInTheDocument();
    expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
    expect(screen.getByText('Lundi 15 janvier 2024 à 10:00')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<RejectAppointmentModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Rejeter le rendez-vous')).not.toBeInTheDocument();
  });

  it('shows appointment details when provided', () => {
    render(<RejectAppointmentModal {...defaultProps} />);

    expect(screen.getByText('Animal:')).toBeInTheDocument();
    expect(screen.getByText('Milo')).toBeInTheDocument();
    expect(screen.getByText('Propriétaire:')).toBeInTheDocument();
    expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
    expect(screen.getByText('Date:')).toBeInTheDocument();
    expect(screen.getByText('Lundi 15 janvier 2024 à 10:00')).toBeInTheDocument();
  });

  it('handles form submission with valid reason', async () => {
    const mockOnReject = vi.fn().mockResolvedValue(undefined);
    render(<RejectAppointmentModal {...defaultProps} onReject={mockOnReject} />);

    const textarea = screen.getByLabelText('Raison du rejet *');
    const submitButton = screen.getByText('Rejeter le RDV');

    fireEvent.change(textarea, {
      target: { value: 'Vétérinaire indisponible à cette date' },
    });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnReject).toHaveBeenCalledWith('Vétérinaire indisponible à cette date');
    });
  });

  it('validates form submission', async () => {
    render(<RejectAppointmentModal {...defaultProps} />);

    const submitButton = screen.getByText('Rejeter le RDV');
    
    // Button should be disabled initially (empty reason)
    expect(submitButton).toBeDisabled();
    
    // Button should be disabled with short reason
    const textarea = screen.getByLabelText('Raison du rejet *');
    fireEvent.change(textarea, { target: { value: 'Court' } });
    expect(submitButton).toBeDisabled();
    
    // Button should be enabled with valid reason
    fireEvent.change(textarea, { target: { value: 'Vétérinaire indisponible à cette date' } });
    expect(submitButton).not.toBeDisabled();
  });

  it('disables submit button when reason is too short', () => {
    render(<RejectAppointmentModal {...defaultProps} />);

    const textarea = screen.getByLabelText('Raison du rejet *');
    const submitButton = screen.getByText('Rejeter le RDV');

    fireEvent.change(textarea, { target: { value: 'Court' } });

    expect(submitButton).toBeDisabled();
  });

  it('shows character count', () => {
    render(<RejectAppointmentModal {...defaultProps} />);

    const textarea = screen.getByLabelText('Raison du rejet *');
    fireEvent.change(textarea, { target: { value: 'Test reason' } });

    expect(screen.getByText('11/500 caractères (minimum 10)')).toBeInTheDocument();
  });

  it('handles close button click', () => {
    const mockOnClose = vi.fn();
    render(<RejectAppointmentModal {...defaultProps} onClose={mockOnClose} />);

    const closeButton = screen.getByLabelText('Fermer');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('handles cancel button click', () => {
    const mockOnClose = vi.fn();
    render(<RejectAppointmentModal {...defaultProps} onClose={mockOnClose} />);

    const cancelButton = screen.getByText('Annuler');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows loading state during submission', async () => {
    const mockOnReject = vi.fn().mockImplementation(() => new Promise(() => {})); // Never resolves
    render(<RejectAppointmentModal {...defaultProps} onReject={mockOnReject} />);

    const textarea = screen.getByLabelText('Raison du rejet *');
    const submitButton = screen.getByText('Rejeter le RDV');

    fireEvent.change(textarea, {
      target: { value: 'Vétérinaire indisponible à cette date' },
    });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Rejet en cours...')).toBeInTheDocument();
    });
  });

  it('shows error from onReject rejection', async () => {
    const mockOnReject = vi.fn().mockRejectedValue(new Error('API Error'));
    render(<RejectAppointmentModal {...defaultProps} onReject={mockOnReject} />);

    const textarea = screen.getByLabelText('Raison du rejet *');
    const submitButton = screen.getByText('Rejeter le RDV');

    fireEvent.change(textarea, {
      target: { value: 'Vétérinaire indisponible à cette date' },
    });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });

  it('focuses textarea when modal opens', () => {
    render(<RejectAppointmentModal {...defaultProps} />);

    const textarea = screen.getByLabelText('Raison du rejet *');
    expect(textarea).toHaveFocus();
  });
});
