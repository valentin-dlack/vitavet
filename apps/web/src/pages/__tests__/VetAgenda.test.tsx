import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { VetAgenda } from '../VetAgenda';
import { agendaService } from '../../services/agenda.service';

vi.mock('../../services/agenda.service', () => ({
  agendaService: {
    getMyDay: vi.fn(),
  },
}));

describe('VetAgenda', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderPage() {
    return render(
      <MemoryRouter initialEntries={["/vet/agenda"]}>
        <Routes>
          <Route path="/vet/agenda" element={<VetAgenda />} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('loads and groups items by hour, opens modal details', async () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0).toISOString();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 30).toISOString();
    (agendaService.getMyDay as any).mockResolvedValue([
      { id: 'i1', startsAt: start, endsAt: end, status: 'CONFIRMED', animal: { name: 'Rex', species: 'Chien' }, owner: { firstName: 'O', lastName: 'N', email: 'o@n' } },
    ]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Agenda du jour/)).toBeInTheDocument();
    });

    // The hour label can have spaces/split; assert on partial text
    expect(screen.getByText((content) => content.replace(/\s+/g, '').includes('09h'))).toBeInTheDocument();
    expect(screen.getByText(/Rex/)).toBeInTheDocument();

    fireEvent.click(screen.getByText('Détails'));
    await waitFor(() => {
      expect(screen.getByText(/Détails du rendez-vous/)).toBeInTheDocument();
      expect(screen.getByText(/Animal/)).toBeInTheDocument();
      expect(screen.getByText(/Propriétaire/)).toBeInTheDocument();
      expect(screen.getByText(/Rendez-vous/)).toBeInTheDocument();
    });
  });

  it('navigates dates with buttons', async () => {
    (agendaService.getMyDay as any).mockResolvedValue([]);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/Agenda du jour/)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Aujourd’hui'));
    fireEvent.click(screen.getByText('← Précédent'));
    fireEvent.click(screen.getByText('Suivant →'));
    expect(agendaService.getMyDay).toHaveBeenCalled();
  });
});


