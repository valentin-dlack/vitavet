import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { VetAgenda } from '../VetAgenda';
import { agendaService } from '../../services/agenda.service';

vi.mock('../../services/agenda.service', () => ({
  agendaService: {
    getMyDay: vi.fn(),
    getMyWeek: vi.fn(),
    getMyMonth: vi.fn(),
    block: vi.fn(),
  },
}));

vi.mock('../../services/clinics.service', () => ({
  clinicsService: {
    search: vi.fn().mockResolvedValue([
      { id: 'c1', name: 'Clinique A', postcode: '75001', city: 'Paris' },
      { id: 'c2', name: 'Clinique B', postcode: '69001', city: 'Lyon' },
    ]),
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

  it('loads items and opens modal details (robust to locale/timezone)', async () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0).toISOString();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 30).toISOString();
    (agendaService.getMyDay as any).mockResolvedValue([
      { id: 'i1', startsAt: start, endsAt: end, status: 'CONFIRMED', animal: { name: 'Rex', species: 'Chien' }, owner: { firstName: 'O', lastName: 'N', email: 'o@n' } },
    ]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Agenda du jour/)).toBeInTheDocument();
      // Items count text is stable regardless of locale
      expect(screen.getByText(/1\s*rendez-vous/i)).toBeInTheDocument();
      expect(screen.getByText(/Rex/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Détails'));
    await waitFor(() => {
      expect(screen.getByText(/Détails du rendez-vous/)).toBeInTheDocument();
      expect(screen.getByText(/Animal/)).toBeInTheDocument();
      expect(screen.getByText(/Propriétaire/)).toBeInTheDocument();
      expect(screen.getByText(/Rendez-vous/)).toBeInTheDocument();
    });
  });

  it('navigates dates with buttons and switches views', async () => {
    (agendaService.getMyDay as any).mockResolvedValue([]);
    (agendaService.getMyWeek as any) = vi.fn().mockResolvedValue([]);
    (agendaService.getMyWeek as any).mockResolvedValue([]);
    (agendaService.getMyMonth as any).mockResolvedValue([]);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/Agenda du jour/)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Aujourd’hui'));
    fireEvent.click(screen.getByText('← Précédent'));
    fireEvent.click(screen.getByText('Suivant →'));
    expect(agendaService.getMyDay).toHaveBeenCalled();
    fireEvent.click(screen.getByText('Semaine'));
    await waitFor(() => expect(agendaService.getMyWeek).toHaveBeenCalled());
    fireEvent.click(screen.getByText('Mois'));
    await waitFor(() => expect(agendaService.getMyMonth).toHaveBeenCalled());
  });

  it('opens block modal and submits block', async () => {
    (agendaService.getMyDay as any).mockResolvedValue([]);
    (agendaService.block as any) = vi.fn().mockResolvedValue({ id: 'b1' });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/Agenda du jour/)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Bloquer un créneau' }));
    // Modal title
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Bloquer un créneau' })).toBeInTheDocument());
    // Select a clinic from populated list
    const select = screen.getByLabelText('Clinique') as HTMLSelectElement;
    const firstOption = Array.from(select.options).find((o) => o.value);
    fireEvent.change(select, { target: { value: firstOption!.value } });
    fireEvent.click(screen.getByText('Bloquer'));
    await waitFor(() => expect(agendaService.block).toHaveBeenCalled());
  });
});


