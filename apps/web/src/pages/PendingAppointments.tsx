import { useEffect, useState } from 'react';
import { appointmentsService, type AppointmentResponse } from '../services/appointments.service';

export function PendingAppointments() {
	const [items, setItems] = useState<AppointmentResponse[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [confirmingId, setConfirmingId] = useState<string | null>(null);

	useEffect(() => {
		setLoading(true);
		setError(null);
		appointmentsService
			.getPendingAppointments()
			.then(setItems)
			.catch((e) => setError(e instanceof Error ? e.message : 'Failed to load appointments'))
			.finally(() => setLoading(false));
	}, []);

	const confirm = async (id: string) => {
		try {
			setConfirmingId(id);
			await appointmentsService.confirmAppointment(id);
			setItems((prev) => prev.filter((a) => a.id !== id));
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Failed to confirm');
		} finally {
			setConfirmingId(null);
		}
	};

	return (
		<div className="max-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
			<div className="sm:mx-auto sm:w-full sm:max-w-3xl">
				<h1 className="text-center text-3xl font-extrabold text-gray-900">RDV en attente</h1>
				<p className="mt-2 text-center text-sm text-gray-600">Validez les demandes reçues</p>
			</div>
			<div className="mt-8 sm:mx-auto sm:w-full sm:max-w-3xl">
				<div className="bg-white py-6 px-4 shadow sm:rounded-lg sm:px-6">
					{loading ? <div>Chargement…</div> : null}
					{error ? <div className="text-red-600 mb-4">{error}</div> : null}

					<ul className="divide-y">
						{items.map((a) => {
							const start = new Date(a.startsAt);
							const end = new Date(a.endsAt);
							return (
								<li key={a.id} className="py-3 flex items-center gap-4">
									<div className="flex-1">
										<div className="font-medium text-gray-900">
											{start.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
											{' '}•{' '}
											{start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
											{' '}→{' '}
											{end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
										</div>
										<div className="text-sm text-gray-600">Animal: {a.animalId} • Vétérinaire: {a.vetUserId}</div>
									</div>
									<button
										className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
										disabled={confirmingId === a.id}
										onClick={() => confirm(a.id)}
									>
										{confirmingId === a.id ? 'Validation…' : 'Confirmer'}
									</button>
								</li>
							);
						})}
						{!loading && !error && items.length === 0 ? (
							<li className="py-6 text-center text-gray-600">Aucun rendez-vous en attente.</li>
						) : null}
					</ul>
				</div>
			</div>
		</div>
	);
}


