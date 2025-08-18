import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../../App';
import * as useAuthHook from '../../hooks/useAuth';
import { appointmentsService } from '../../services/appointments.service';

vi.mock('../../services/appointments.service');

describe('App routing RBAC', () => {
  it('redirects to login when visiting protected pages unauthenticated', () => {
    vi.spyOn(useAuthHook, 'useAuth').mockReturnValue({ user: null, isAuthenticated: false } as any);
    window.history.pushState({}, '', '/asv/pending');
    render(<App />);
    // Login page heading
    expect(screen.getByRole('heading', { name: 'Se connecter' })).toBeInTheDocument();
  });

  it('allows ASV access to /asv/pending via anyOfRoles', async () => {
    vi.spyOn(useAuthHook, 'useAuth').mockReturnValue({ user: { role: 'ASV' }, isAuthenticated: true } as any);
    vi.mocked(appointmentsService.getPendingAppointments).mockResolvedValue({ appointments: [], total: 0 });
    window.history.pushState({}, '', '/asv/pending');
    render(<App />);
    // We should be on pending appointments page; assert on title fragment
    expect(await screen.findByText(/RDV en attente/i)).toBeInTheDocument();
  });

  it('blocks OWNER from /vet/agenda requiring VET', () => {
    vi.spyOn(useAuthHook, 'useAuth').mockReturnValue({ user: { role: 'OWNER' }, isAuthenticated: true } as any);
    window.history.pushState({}, '', '/vet/agenda');
    render(<App />);
    expect(screen.getByText('Accès non autorisé')).toBeInTheDocument();
  });
});


