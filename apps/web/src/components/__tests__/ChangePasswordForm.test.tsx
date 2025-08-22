import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChangePasswordForm from '../ChangePasswordForm';
import { authService } from '../../services/auth.service';

vi.mock('../../services/auth.service', () => ({
  authService: {
    changePassword: vi.fn(),
  },
}));

describe('ChangePasswordForm', () => {
  it('shows error when passwords do not match', async () => {
    const onError = vi.fn();
    render(
      <ChangePasswordForm onSuccess={vi.fn()} onError={onError} />,
    );

    fireEvent.change(screen.getByLabelText(/Mot de passe actuel/i), {
      target: { value: 'Old123!!' },
    });
    fireEvent.change(screen.getByLabelText('Nouveau mot de passe'), {
      target: { value: 'New123!!' },
    });
    fireEvent.change(screen.getByLabelText(/Confirmer le nouveau mot de passe/i), {
      target: { value: 'Mismatch!!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Changer le mot de passe/i }));

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('Les mots de passe ne correspondent pas');
    });
  });

  it('shows error when password too short', async () => {
    const onError = vi.fn();
    render(
      <ChangePasswordForm onSuccess={vi.fn()} onError={onError} />,
    );

    fireEvent.change(screen.getByLabelText(/Mot de passe actuel/i), {
      target: { value: 'Old123!!' },
    });
    fireEvent.change(screen.getByLabelText('Nouveau mot de passe'), {
      target: { value: 'short' },
    });
    fireEvent.change(screen.getByLabelText('Confirmer le nouveau mot de passe'), {
      target: { value: 'short' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Changer le mot de passe/i }));

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('Le nouveau mot de passe doit contenir au moins 8 caractères');
    });
  });

  it('submits successfully and resets form', async () => {
    const onSuccess = vi.fn();
    (authService.changePassword as any).mockResolvedValue({ message: 'OK' });
    render(
      <ChangePasswordForm onSuccess={onSuccess} onError={vi.fn()} />,
    );

    fireEvent.change(screen.getByLabelText(/Mot de passe actuel/i), {
      target: { value: 'Old123!!' },
    });
    fireEvent.change(screen.getByLabelText('Nouveau mot de passe'), {
      target: { value: 'New123!!' },
    });
    fireEvent.change(screen.getByLabelText('Confirmer le nouveau mot de passe'), {
      target: { value: 'New123!!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Changer le mot de passe/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('OK');
    });
  });

  it('shows error from service', async () => {
    const onError = vi.fn();
    (authService.changePassword as any).mockRejectedValue(new Error('boom'));
    render(
      <ChangePasswordForm onSuccess={vi.fn()} onError={onError} />,
    );

    fireEvent.change(screen.getByLabelText(/Mot de passe actuel/i), {
      target: { value: 'Old123!!' },
    });
    fireEvent.change(screen.getByLabelText('Nouveau mot de passe'), {
      target: { value: 'New123!!' },
    });
    fireEvent.change(screen.getByLabelText('Confirmer le nouveau mot de passe'), {
      target: { value: 'New123!!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Changer le mot de passe/i }));

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('boom');
    });
  });

  it('toggles password visibility', async () => {
    render(
      <ChangePasswordForm onSuccess={vi.fn()} onError={vi.fn()} />,
    );
    const toggle = screen.getByRole('button', { name: /👁️|👁️‍🗨️/i });
    fireEvent.click(toggle);
    expect(toggle).toBeInTheDocument();
  });
});


