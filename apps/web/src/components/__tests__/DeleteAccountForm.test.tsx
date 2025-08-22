import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DeleteAccountForm from '../DeleteAccountForm';
import { authService } from '../../services/auth.service';

vi.mock('../../services/auth.service', () => ({
  authService: {
    requestAccountDeletion: vi.fn(),
  },
}));

describe('DeleteAccountForm', () => {
  it('disables continue button when reason < 10', async () => {
    render(<DeleteAccountForm onSuccess={vi.fn()} onError={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/Raison de la suppression/i), {
      target: { value: 'short' },
    });
    fireEvent.change(screen.getByLabelText(/Mot de passe/i), {
      target: { value: 'Password123!' },
    });
    const btn = screen.getByRole('button', { name: /Continuer/i });
    expect(btn).toBeDisabled();
  });

  it('shows confirmation and submits successfully', async () => {
    (authService.requestAccountDeletion as any).mockResolvedValue({ message: 'OK' });
    const onSuccess = vi.fn();
    render(<DeleteAccountForm onSuccess={onSuccess} onError={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/Raison de la suppression/i), {
      target: { value: 'raison suffisante' },
    });
    fireEvent.change(screen.getByLabelText(/Mot de passe/i), {
      target: { value: 'Password123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Continuer/i }));

    expect(await screen.findByText(/Confirmation finale/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Confirmer la demande/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('OK');
    });
  });

  it('handles error from service on submit', async () => {
    (authService.requestAccountDeletion as any).mockRejectedValue(new Error('boom'));
    const onError = vi.fn();
    render(<DeleteAccountForm onSuccess={vi.fn()} onError={onError} />);

    fireEvent.change(screen.getByLabelText(/Raison de la suppression/i), {
      target: { value: 'raison suffisante' },
    });
    fireEvent.change(screen.getByLabelText(/Mot de passe/i), {
      target: { value: 'Password123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Continuer/i }));
    expect(await screen.findByText(/Confirmation finale/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Confirmer la demande/i }));

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('boom');
    });
  });
});


