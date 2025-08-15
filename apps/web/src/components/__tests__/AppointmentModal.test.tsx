import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AppointmentModal } from '../AppointmentModal';
import { appointmentsService } from '../../services/appointments.service';

// Mock the appointments service
vi.mock('../../services/appointments.service');
const mockAppointmentsService = appointmentsService as any;

describe('AppointmentModal', () => {
	const mockSlot = {
		id: 'slot-1',
		startsAt: '2024-01-15T10:00:00Z',
		endsAt: '2024-01-15T10:30:00Z',
		vetUserId: 'vet-1',
	};

	const mockProps = {
		isOpen: true,
		onClose: vi.fn(),
		slot: mockSlot,
		clinicId: 'clinic-1',
		onSuccess: vi.fn(),
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should render when open', () => {
		render(<AppointmentModal {...mockProps} />);

		expect(screen.getByText('Confirmer le rendez-vous')).toBeInTheDocument();
		expect(screen.getByText('Date :')).toBeInTheDocument();
		expect(screen.getByText('Heure :')).toBeInTheDocument();
		expect(screen.getByText('Durée :')).toBeInTheDocument();
	});

	it('should not render when closed', () => {
		render(<AppointmentModal {...mockProps} isOpen={false} />);

		expect(screen.queryByText('Confirmer le rendez-vous')).not.toBeInTheDocument();
	});

	it('should call onClose when cancel button is clicked', () => {
		render(<AppointmentModal {...mockProps} />);

		fireEvent.click(screen.getByText('Annuler'));

		expect(mockProps.onClose).toHaveBeenCalled();
	});

	it('should create appointment when confirm button is clicked', async () => {
		const mockAppointmentResponse = {
			id: 'appointment-1',
			clinicId: 'clinic-1',
			animalId: 'animal-1',
			vetUserId: 'vet-1',
			status: 'PENDING' as const,
			startsAt: '2024-01-15T10:00:00Z',
			endsAt: '2024-01-15T10:30:00Z',
			createdAt: '2024-01-15T09:00:00Z',
		};

		mockAppointmentsService.createAppointment = vi.fn().mockResolvedValue(mockAppointmentResponse);

		render(<AppointmentModal {...mockProps} />);

		fireEvent.click(screen.getByText('Confirmer'));

		await waitFor(() => {
			expect(mockAppointmentsService.createAppointment).toHaveBeenCalledWith({
				clinicId: 'clinic-1',
				animalId: '550e8400-e29b-41d4-a716-446655440001', // Mock animal ID
				vetUserId: 'vet-1',
				startsAt: '2024-01-15T10:00:00Z',
			});
		});

		expect(mockProps.onSuccess).toHaveBeenCalledWith('appointment-1');
		expect(mockProps.onClose).toHaveBeenCalled();
	});

	it('should show error when appointment creation fails', async () => {
		mockAppointmentsService.createAppointment = vi.fn().mockRejectedValue(new Error('API Error'));

		render(<AppointmentModal {...mockProps} />);

		fireEvent.click(screen.getByText('Confirmer'));

		await waitFor(() => {
			expect(screen.getByText('API Error')).toBeInTheDocument();
		});

		expect(mockProps.onSuccess).not.toHaveBeenCalled();
		expect(mockProps.onClose).not.toHaveBeenCalled();
	});

	it('should show error when vet is not selected', () => {
		const slotWithoutVet = { ...mockSlot, vetUserId: undefined };
		render(<AppointmentModal {...mockProps} slot={slotWithoutVet} />);

		fireEvent.click(screen.getByText('Confirmer'));

		expect(screen.getByText('Vétérinaire non sélectionné')).toBeInTheDocument();
		expect(mockProps.onSuccess).not.toHaveBeenCalled();
		expect(mockProps.onClose).not.toHaveBeenCalled();
	});

	it('should show loading state during appointment creation', async () => {
		let resolvePromise: (value: any) => void;
		const promise = new Promise((resolve) => {
			resolvePromise = resolve;
		});

		mockAppointmentsService.createAppointment = vi.fn().mockReturnValue(promise);

		render(<AppointmentModal {...mockProps} />);

		fireEvent.click(screen.getByText('Confirmer'));

		expect(screen.getByText('Création...')).toBeInTheDocument();
		expect(screen.getByText('Annuler')).toBeDisabled();

		// Resolve the promise
		resolvePromise!({
			id: 'appointment-1',
			clinicId: 'clinic-1',
			animalId: 'animal-1',
			vetUserId: 'vet-1',
			status: 'PENDING',
			startsAt: '2024-01-15T10:00:00Z',
			endsAt: '2024-01-15T10:30:00Z',
			createdAt: '2024-01-15T09:00:00Z',
		});

		await waitFor(() => {
			expect(screen.queryByText('Création...')).not.toBeInTheDocument();
		});
	});
});
