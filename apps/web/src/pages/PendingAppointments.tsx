import { useCallback, useEffect, useState } from 'react';
import { appointmentsService, type PendingAppointmentsResponse } from '../services/appointments.service';
import { Pagination } from '../components/Pagination';
import { RejectAppointmentModal } from '../components/RejectAppointmentModal';

export function PendingAppointments() {
	const [data, setData] = useState<PendingAppointmentsResponse | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [confirmingId, setConfirmingId] = useState<string | null>(null);
	const [rejectingId, setRejectingId] = useState<string | null>(null);
	const [showRejectModal, setShowRejectModal] = useState(false);
	const [selectedAppointment, setSelectedAppointment] = useState<PendingAppointmentsResponse['appointments'][number] | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage] = useState(3); 

	const loadAppointments = useCallback(async (page: number = 1) => {
		setLoading(true);
		setError(null);
		try {
			const offset = (page - 1) * itemsPerPage;
			const result = await appointmentsService.getPendingAppointments(undefined, itemsPerPage, offset);
			setData(result);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Failed to load appointments');
		} finally {
			setLoading(false);
		}
	}, [itemsPerPage]);

	useEffect(() => {
		loadAppointments(currentPage);
	}, [currentPage, loadAppointments]);

	const handlePageChange = (page: number) => {
		setCurrentPage(page);
	};

	const confirm = async (id: string) => {
		try {
			setConfirmingId(id);
			await appointmentsService.confirmAppointment(id);
			// Recharger la page actuelle après confirmation
			await loadAppointments(currentPage);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Failed to confirm');
		} finally {
			setConfirmingId(null);
		}
	};

	const handleRejectClick = (appointment: PendingAppointmentsResponse['appointments'][number]) => {
		setSelectedAppointment(appointment);
		setShowRejectModal(true);
	};

	const handleReject = async (rejectionReason: string) => {
		if (!selectedAppointment) return;
		
		try {
			setRejectingId(selectedAppointment.id);
			await appointmentsService.rejectAppointment(selectedAppointment.id, { rejectionReason });
			await loadAppointments(currentPage);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Failed to reject');
		} finally {
			setRejectingId(null);
		}
	};

	const handleCloseRejectModal = () => {
		setShowRejectModal(false);
		setSelectedAppointment(null);
	};

	const items = data?.appointments || [];
	const totalItems = data?.total || 0;

	return (
		<div className="min-h-screen bg-gray-50 flex flex-col py-5 sm:px-6 lg:px-8">
			<div className="sm:mx-auto sm:w-full sm:max-w-4xl">
				<h1 className="text-center text-3xl font-extrabold text-gray-900">RDV en attente</h1>
				<p className="mt-2 text-center text-sm text-gray-600">Validez les demandes reçues</p>
			</div>
			
			<div className="mt-8 sm:mx-auto sm:w-full sm:max-w-4xl">
				<div className="bg-white py-6 px-4 shadow sm:rounded-lg sm:px-6">
					{loading && !data ? <div className="text-center py-8">Chargement…</div> : null}
					{error ? <div className="text-red-600 mb-4 p-3 bg-red-50 border border-red-200 rounded">{error}</div> : null}

					{/* En-tête avec statistiques */}
					<div className="mb-6 p-4 bg-blue-50 rounded-lg">
						<div className="flex items-center justify-between">
							<div>
								<h2 className="text-lg font-semibold text-blue-900">
									{totalItems} rendez-vous en attente de validation
								</h2>
								<p className="text-sm text-blue-700">
									Page {currentPage} sur {Math.ceil(totalItems / itemsPerPage)}
								</p>
							</div>
							{loading && data && (
								<div className="text-sm text-blue-600">Actualisation...</div>
							)}
						</div>
					</div>

					{/* Liste des rendez-vous */}
					<div className="space-y-4">
						{items.map((a) => {
							const start = new Date(a.startsAt);
							const end = new Date(a.endsAt);
							return (
								<div key={a.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
									<div className="flex items-center justify-between mb-3">
										<div className="flex-1">
											<div className="font-medium text-gray-900">
												{start.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
												{' '}•{' '}
												{start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
												{' '}→{' '}
												{end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
											</div>
										</div>
										<div className="flex space-x-2">
											<button
												className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
												disabled={rejectingId === a.id || confirmingId === a.id}
												onClick={() => handleRejectClick(a)}
											>
												{rejectingId === a.id ? 'Rejet…' : 'Rejeter'}
											</button>
											<button
												className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
												disabled={confirmingId === a.id || rejectingId === a.id}
												onClick={() => confirm(a.id)}
											>
												{confirmingId === a.id ? 'Validation…' : 'Confirmer'}
											</button>
										</div>
									</div>

									<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
										<div className="border rounded p-3 bg-white">
											<div className="text-xs uppercase text-gray-500 font-medium">Vétérinaire</div>
											<div className="mt-1 text-sm text-gray-900">{a.vet ? `${a.vet.firstName} ${a.vet.lastName}` : '—'}</div>
											<div className="text-xs text-gray-600">{a.vet?.email || ''}</div>
										</div>
										<div className="border rounded p-3 bg-white">
											<div className="text-xs uppercase text-gray-500 font-medium">Animal</div>
											<div className="mt-1 text-sm text-gray-900">{a.animal?.name || '—'}</div>
											<div className="text-xs text-gray-600">
												{a.animal?.species && `${a.animal.species}`}
												{a.animal?.breed && ` (${a.animal.breed})`}
												{a.animal?.weightKg && ` - ${a.animal.weightKg} kg`}
												{a.animal?.birthdate ? ` - Né(e) le ${new Date(a.animal.birthdate).toLocaleDateString('fr-FR')}` : ''}
											</div>
										</div>
										<div className="border rounded p-3 bg-white">
											<div className="text-xs uppercase text-gray-500 font-medium">Propriétaire</div>
											<div className="mt-1 text-sm text-gray-900">{a.owner ? `${a.owner.firstName} ${a.owner.lastName}` : '—'}</div>
											<div className="text-xs text-gray-600">{a.owner?.email || ''}</div>
										</div>
									</div>
								</div>
							);
						})}
						
						{!loading && !error && items.length === 0 ? (
							<div className="text-center py-12">
								<div className="text-gray-500 text-lg mb-2">Aucun rendez-vous en attente</div>
								<div className="text-gray-400 text-sm">Tous les rendez-vous ont été traités</div>
							</div>
						) : null}
					</div>

					{/* Pagination */}
					{data && totalItems > 0 && (
						<div className="mt-8 pt-6 border-t">
							<Pagination
								currentPage={currentPage}
								totalItems={totalItems}
								itemsPerPage={itemsPerPage}
								onPageChange={handlePageChange}
							/>
						</div>
					)}
				</div>
			</div>

			{/* Modal de rejet */}
			{showRejectModal && selectedAppointment && (
				<RejectAppointmentModal
					isOpen={showRejectModal}
					onClose={handleCloseRejectModal}
					onReject={async (rejectionReason: string) => {
						await handleReject(rejectionReason);
					}}
					appointmentId={selectedAppointment.id}
					appointmentDetails={{
						animalName: selectedAppointment.animal?.name,
						ownerName: selectedAppointment.owner ? `${selectedAppointment.owner.firstName} ${selectedAppointment.owner.lastName}` : undefined,
						date: new Date(selectedAppointment.startsAt).toLocaleDateString('fr-FR', { 
							weekday: 'long', 
							day: '2-digit', 
							month: '2-digit', 
							year: 'numeric',
							hour: '2-digit',
							minute: '2-digit'
						}),
					}}
				/>
			)}
		</div>
	);
}
