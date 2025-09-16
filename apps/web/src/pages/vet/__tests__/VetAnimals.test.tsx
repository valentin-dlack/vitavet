import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { VetAnimals } from '../../vet/VetAnimals';
import { agendaService } from '../../../services/agenda.service';

vi.mock('../../../services/agenda.service', () => ({
  agendaService: {
    getMyMonth: vi.fn(),
  },
}));

vi.mock('../../../services/animals.service', () => ({
  animalsService: {
    getHistory: vi.fn().mockResolvedValue({ animal: { id: 'an1', name: 'Rex' }, appointments: [] }),
  },
}));

vi.mock('../../../services/documents.service', () => ({
  documentsService: {
    getDocumentsForAppointment: vi.fn().mockResolvedValue([]),
  },
}));

describe('VetAnimals page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderPage() {
    return render(
      <MemoryRouter initialEntries={["/vet/animals"]}>
        <Routes>
          <Route path="/vet/animals" element={<VetAnimals />} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('lists animals deduplicated from monthly agenda and opens details modal', async () => {
    (agendaService.getMyMonth as any).mockResolvedValue([
      { id: 'a1', startsAt: new Date().toISOString(), endsAt: new Date().toISOString(), status: 'CONFIRMED', animal: { id: 'an1', name: 'Rex', species: 'Chien', breed: 'Berger' } },
      { id: 'a2', startsAt: new Date().toISOString(), endsAt: new Date().toISOString(), status: 'CONFIRMED', animal: { id: 'an1', name: 'Rex', species: 'Chien', breed: 'Berger' } },
      { id: 'a3', startsAt: new Date().toISOString(), endsAt: new Date().toISOString(), status: 'PENDING', animal: { id: 'an2', name: 'Misty', species: 'Chat', breed: 'Européen' } },
    ]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Rex')).toBeInTheDocument();
      expect(screen.getByText('Misty')).toBeInTheDocument();
    });

    // Open details modal on click
    fireEvent.click(screen.getByText('Rex'));
    await waitFor(() => {
      // Modal title shows animal name (heading inside modal)
      expect(screen.getByRole('heading', { name: 'Rex' })).toBeInTheDocument();
    });
  });
});


