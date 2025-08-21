import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PendingAppointments } from '../PendingAppointments';
import { appointmentsService } from '../../services/appointments.service';

vi.mock('../../services/appointments.service', () => ({
  appointmentsService: {
    getPendingAppointments: vi.fn(),
    confirmAppointment: vi.fn(),
  },
}));

describe('PendingAppointments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderPage() {
    return render(
      <MemoryRouter initialEntries={["/asv/pending"]}>
        <Routes>
          <Route path="/asv/pending" element={<PendingAppointments />} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('loads and displays paginated list', async () => {
    (appointmentsService.getPendingAppointments as any).mockResolvedValue({
      appointments: [
        { id: 'a1', startsAt: new Date().toISOString(), endsAt: new Date().toISOString(), vet: { firstName: 'V', lastName: 'One', email: 'v@a' }, animal: { name: 'Rex' }, owner: { firstName: 'O', lastName: 'N', email: 'o@n' } },
        { id: 'a2', startsAt: new Date().toISOString(), endsAt: new Date().toISOString(), vet: null, animal: null, owner: null },
        { id: 'a3', startsAt: new Date().toISOString(), endsAt: new Date().toISOString(), vet: null, animal: null, owner: null },
      ],
      total: 10,
    });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/rendez-vous en attente/i)).toBeInTheDocument();
    });

    expect(screen.getAllByText(/Confirmer|Validation/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Page 1 sur/i)).toBeInTheDocument();
  });

  it('confirms an appointment and reloads list', async () => {
    (appointmentsService.getPendingAppointments as any).mockResolvedValueOnce({
      appointments: [{ id: 'a1', startsAt: new Date().toISOString(), endsAt: new Date().toISOString() }], total: 1,
    });
    (appointmentsService.confirmAppointment as any).mockResolvedValue({});
    (appointmentsService.getPendingAppointments as any).mockResolvedValueOnce({
      appointments: [], total: 0,
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Confirmer/)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Confirmer'));
    await waitFor(() => {
      expect(appointmentsService.confirmAppointment).toHaveBeenCalledWith('a1');
    });
  });

  it('shows empty state when no appointments', async () => {
    (appointmentsService.getPendingAppointments as any).mockResolvedValue({ appointments: [], total: 0 });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/Aucun rendez-vous en attente/)).toBeInTheDocument();
    });
  });
});


