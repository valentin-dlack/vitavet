import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfileEditForm from '../ProfileEditForm';
import { authService } from '../../services/auth.service';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../services/auth.service', () => ({
  authService: {
    updateProfile: vi.fn(),
  },
}));

const user = {
  id: 'u1',
  email: 'a@a.com',
  firstName: 'A',
  lastName: 'B',
  roles: ['OWNER'],
  clinics: [],
};

describe('ProfileEditForm', () => {
  it('submits successfully', async () => {
    (authService.updateProfile as any).mockResolvedValue({ message: 'OK' });
    const onSuccess = vi.fn();
    render(
      <ProfileEditForm user={user as any} onSuccess={onSuccess} onError={vi.fn()} />,
    );

    fireEvent.change(screen.getByLabelText(/Prénom/i), {
      target: { value: 'John' },
    });
    fireEvent.change(screen.getByLabelText('Nom'), {
      target: { value: 'Doe' },
    });
    fireEvent.change(screen.getByLabelText(/Adresse email/i), {
      target: { value: 'john@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Mettre à jour/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('OK');
    });
  });

  it('handles service error', async () => {
    (authService.updateProfile as any).mockRejectedValue(new Error('boom'));
    const onError = vi.fn();
    render(
      <ProfileEditForm user={user as any} onSuccess={vi.fn()} onError={onError} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Mettre à jour/i }));
    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('boom');
    });
  });
});


