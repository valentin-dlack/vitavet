import { useEffect, useState } from 'react';
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
	// animal selection (lazy import to avoid circulars in tests)
	const [animals, setAnimals] = useState<{ id: string; name: string }[]>([]);
	const [animalId, setAnimalId] = useState<string>('');

	// load user's animals for the clinic when opening
	// use dynamic import to avoid static dependency for tests
	if (isOpen && animals.length === 0 && typeof window !== 'undefined') {
		(void (async () => {
			try {
				const mod = await import('../services/animals.service');
				const list = await mod.animalsService.getMyAnimals(clinicId);
				setAnimals(list.map((a) => ({ id: a.id, name: a.name })));
				setAnimalId((prev) => prev || (list[0]?.id || ''));
			} catch {
				// ignore if not owner / none found
			}
		})());
	}

	useEffect(() => {
		if (isOpen && animals.length === 0 && typeof window !== 'undefined') {
			(void (async () => {
				try {
					const mod = await import('../services/animals.service');
					const list = await mod.animalsService.getMyAnimals(clinicId);
					setAnimals(list.map((a) => ({ id: a.id, name: a.name })));
					setAnimalId((prev) => prev || (list[0]?.id || ''));
				} catch {
					// ignore if not owner / none found
				}
			})());
		}
	}, [isOpen, clinicId, animals.length]);

	const handleConfirm = async () => {
		if (!slot.vetUserId) {
			setError('Vétérinaire non sélectionné');
			return;
		}
		if (!animalId) {
			setError('Veuillez sélectionner un animal');
			return;
		}

		setLoading(true);
		setError(null);

		try {
			const appointmentData: CreateAppointmentData = {
				clinicId,
				animalId,
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

				<div className="mb-4">
					<label htmlFor="animal" className="block text-sm font-medium text-gray-700">Animal</label>
					<select
						id="animal"
						value={animalId}
						onChange={(e) => setAnimalId(e.target.value)}
						className="mt-1 w-full border rounded p-2"
						required
					>
						{animals.length === 0 ? (
							<option value="">Aucun animal enregistré</option>
						) : (
							animals.map((a) => (
								<option key={a.id} value={a.id}>{a.name}</option>
							))
						)}
					</select>
					{animals.length === 0 && (
						<p className="text-xs text-gray-600 mt-1">Aucun animal trouvé. Ajoutez un animal depuis votre espace pour réserver.</p>
					)}
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
						disabled={loading || !animalId || animals.length === 0}
						className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
					>
						{loading ? 'Création...' : 'Confirmer'}
					</button>
				</div>
			</div>
		</div>
	);
}
