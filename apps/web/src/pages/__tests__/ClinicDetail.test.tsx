import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ClinicDetail } from '../ClinicDetail';
import { clinicsService } from '../../services/clinics.service';

vi.mock('../../services/clinics.service', () => ({
  clinicsService: {
    getById: vi.fn(),
    getVetsByClinic: vi.fn(),
  },
}));

describe('ClinicDetail', () => {
  const mockClinic = {
    id: 'c1',
    name: 'Clinique A',
    postcode: '75001',
    city: 'Paris',
    addressLine1: '1 rue de Paris',
    phone: '0102030405',
    email: 'contact@clinique-a.fr',
    services: [{ id: 's1', slug: 'consultation', label: 'Consultations' }],
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock to avoid VetSelector crashing
    (clinicsService.getVetsByClinic as any).mockResolvedValue([]);
  });

  function renderAtClinic(clinicId = 'c1') {
    return render(
      <MemoryRouter initialEntries={[`/clinics/${clinicId}`]}>
        <Routes>
          <Route path="/clinics/:clinicId" element={<ClinicDetail />} />
          <Route path="/clinics/:clinicId/availability" element={<div>Availability</div>} />
          <Route path="/clinics" element={<div>List</div>} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('loads and displays clinic details with services', async () => {
    (clinicsService.getById as any).mockResolvedValue(mockClinic);

    renderAtClinic();

    expect(screen.getByText('Chargement…')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Clinique A')).toBeInTheDocument();
    });

    expect(screen.getByText('75001 Paris')).toBeInTheDocument();
    expect(screen.getByText('Téléphone: 0102030405')).toBeInTheDocument();
    expect(screen.getByText('Email: contact@clinique-a.fr')).toBeInTheDocument();
    expect(screen.getByText('Consultations')).toBeInTheDocument();
  });

  it('navigates to availability with selected vet', async () => {
    (clinicsService.getById as any).mockResolvedValue(mockClinic);
    (clinicsService.getVetsByClinic as any).mockResolvedValue([]);

    renderAtClinic();

    await waitFor(() => {
      expect(screen.getByText('Clinique A')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Voir les disponibilités'));
    expect(screen.getByText('Availability')).toBeInTheDocument();
  });

  it('shows error on load failure', async () => {
    (clinicsService.getById as any).mockRejectedValue(new Error('Boom'));
    (clinicsService.getVetsByClinic as any).mockResolvedValue([]);
    renderAtClinic();
    await waitFor(() => {
      expect(screen.getByText('Boom')).toBeInTheDocument();
    });
  });
});


