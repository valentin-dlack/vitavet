import { useState } from 'react';
import { appointmentsService, type CreateAppointmentData } from '../services/appointments.service';

interface AppointmentModalProps {
	isOpen: boolean;
	onClose: () => void;
	slot: {
		id: string;
		startsAt: string;
		endsAt: string;
		vetUserId?: string;
	};
	clinicId: string;
	onSuccess: (appointmentId: string) => void;
}

export function AppointmentModal({ isOpen, onClose, slot, clinicId, onSuccess }: AppointmentModalProps) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleConfirm = async () => {
		if (!slot.vetUserId) {
			setError('Vétérinaire non sélectionné');
			return;
		}

		setLoading(true);
		setError(null);

		try {
			// For MVP, we'll use a mock animal ID
			// In a real app, this would come from user's animals list
			const appointmentData: CreateAppointmentData = {
				clinicId,
				animalId: '550e8400-e29b-41d4-a716-446655440001', // Mock animal
				vetUserId: slot.vetUserId,
				startsAt: slot.startsAt,
			};

			const result = await appointmentsService.createAppointment(appointmentData);
			onSuccess(result.id);
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Erreur lors de la création du rendez-vous');
		} finally {
			setLoading(false);
		}
	};

	if (!isOpen) return null;

	const slotTime = new Date(slot.startsAt).toLocaleTimeString([], {
		hour: '2-digit',
		minute: '2-digit',
	});

	const slotDate = new Date(slot.startsAt).toLocaleDateString('fr-FR', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
			<div className="bg-white rounded-lg p-6 max-w-md w-full">
				<h2 className="text-xl font-semibold mb-4">Confirmer le rendez-vous</h2>
				
				<div className="mb-4">
					<p className="text-gray-600 mb-2">Détails du rendez-vous :</p>
					<div className="bg-gray-50 p-3 rounded">
						<p><strong>Date :</strong> {slotDate}</p>
						<p><strong>Heure :</strong> {slotTime}</p>
						<p><strong>Durée :</strong> 30 minutes</p>
					</div>
				</div>

				{error && (
					<div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
						{error}
					</div>
				)}

				<div className="flex gap-3">
					<button
						onClick={onClose}
						disabled={loading}
						className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50"
					>
						Annuler
					</button>
					<button
						onClick={handleConfirm}
						disabled={loading}
						className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
					>
						{loading ? 'Création...' : 'Confirmer'}
					</button>
				</div>
			</div>
		</div>
	);
}
