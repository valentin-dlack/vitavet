import { useEffect, useMemo, useState } from 'react';
import type { AnimalDto, AnimalHistoryDto } from '../services/animals.service';
import { animalsService } from '../services/animals.service';
import { documentsService } from '../services/documents.service';
import { httpService } from '../services/http.service';

interface AnimalDetailsModalProps {
	isOpen: boolean;
	onClose: () => void;
	animal: AnimalDto | null;
}

function formatDate(dateStr: string): string {
	try {
		return new Date(dateStr).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
	} catch {
		return dateStr;
	}
}

function computeAge(birthdate?: string | null): string | null {
	if (!birthdate) return null;
	const b = new Date(birthdate);
	if (Number.isNaN(b.getTime())) return null;
	const now = new Date();
	let years = now.getFullYear() - b.getFullYear();
	let months = now.getMonth() - b.getMonth();
	if (months < 0) {
		years -= 1;
		months += 12;
	}
	if (years <= 0) return `${months} mois`;
	return months > 0 ? `${years} ans ${months} mois` : `${years} ans`;
}

export function AnimalDetailsModal({ isOpen, onClose, animal }: AnimalDetailsModalProps) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [history, setHistory] = useState<AnimalHistoryDto | null>(null);
	const [documents, setDocuments] = useState<Record<string, { id: string; filename: string }[]>>({});

	useEffect(() => {
		let isCancelled = false;
		async function load() {
			if (!animal) return;
			setLoading(true);
			setError(null);
			try {
				const h = await animalsService.getHistory(animal.id);
				if (isCancelled) return;
				setHistory(h);
				// Fetch documents for completed appointments
				const completed = h.appointments.filter((a) => a.status === 'COMPLETED');
				for (const apt of completed) {
					try {
						const docs = await documentsService.getDocumentsForAppointment(apt.id);
						if (isCancelled) return;
						setDocuments((prev) => ({ ...prev, [apt.id]: Array.isArray(docs) ? docs : [] }));
					} catch {
						setDocuments((prev) => ({ ...prev, [apt.id]: [] }));
					}
				}
			} catch (e) {
				setError(e instanceof Error ? e.message : 'Erreur lors du chargement');
			} finally {
				if (!isCancelled) setLoading(false);
			}
		}
		if (isOpen && animal) {
			load();
		}
		return () => {
			isCancelled = true;
		};
	}, [isOpen, animal]);

	const upcomingAppointments = useMemo(() => {
		if (!history) return [] as NonNullable<AnimalHistoryDto>['appointments'];
		const now = Date.now();
		return history.appointments
			.filter((a) => new Date(a.startsAt).getTime() >= now && a.status !== 'CANCELLED')
			.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
			.slice(0, 3);
	}, [history]);

	const recentReports = useMemo(() => {
		if (!history) return [] as NonNullable<AnimalHistoryDto>['appointments'];
		return history.appointments
			.filter((a) => a.report && a.report.length > 0)
			.sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())
			.slice(0, 5);
	}, [history]);

	const handleDownloadDocument = async (documentId: string, filename: string) => {
		try {
			const response = await httpService.download(`/documents/download/${documentId}`);
			const blob = new Blob([response]);
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = filename;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
		} catch (e) {
			// eslint-disable-next-line no-alert
			alert('Erreur lors du téléchargement du document');
			console.error(e);
		}
	};

	if (!isOpen || !animal) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true">
			<div className="bg-white rounded-lg p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto" role="document">
				<div className="flex justify-between items-start gap-3 mb-4">
					<div>
						<h2 className="text-xl font-semibold mb-1">{animal.name}</h2>
						<div className="text-sm text-gray-600">
							{animal.species || '—'}{animal.breed ? ` • ${animal.breed}` : ''}
						</div>
					</div>
					<button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl font-bold" aria-label="Fermer">×</button>
				</div>

				{loading ? <div>Chargement…</div> : null}
				{error ? <div className="text-red-700 bg-red-50 border border-red-200 rounded p-2 mb-3">{error}</div> : null}

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="border rounded p-4">
						<div className="font-medium mb-2">Détails</div>
						<ul className="text-sm space-y-1 text-gray-700">
							<li><span className="text-gray-500">Âge:</span> {computeAge(animal.birthdate) || '—'}</li>
							<li><span className="text-gray-500">Sexe:</span> {animal.sex || '—'}</li>
							<li><span className="text-gray-500">Poids:</span> {animal.weightKg != null ? `${animal.weightKg} kg` : '—'}</li>
							<li><span className="text-gray-500">Taille:</span> {animal.heightCm != null ? `${animal.heightCm} cm` : '—'}</li>
							<li><span className="text-gray-500">Couleur:</span> {animal.color || '—'}</li>
							<li><span className="text-gray-500">Puce:</span> {animal.chipId || '—'}</li>
							<li><span className="text-gray-500">Stérilisé:</span> {animal.isSterilized ? 'Oui' : 'Non'}</li>
							<li><span className="text-gray-500">NAC:</span> {animal.isNac ? 'Oui' : 'Non'}</li>
						</ul>
					</div>

					<div className="border rounded p-4">
						<div className="font-medium mb-2">Prochains RDV</div>
						{upcomingAppointments.length === 0 ? (
							<div className="text-sm text-gray-600">Aucun RDV à venir</div>
						) : (
							<ul className="text-sm space-y-2">
								{upcomingAppointments.map((a) => (
									<li key={a.id} className="flex items-center justify-between">
										<span>{formatDate(a.startsAt)}</span>
										<span className="text-gray-600">{a.type?.label || 'RDV'} — {a.status}</span>
									</li>
								))}
							</ul>
						)}
					</div>

					<div className="border rounded p-4 md:col-span-2">
						<div className="font-medium mb-2">Rapports récents</div>
						{recentReports.length === 0 ? (
							<div className="text-sm text-gray-600">Aucun rapport</div>
						) : (
							<ul className="text-sm space-y-3">
								{recentReports.map((a) => (
									<li key={a.id} className="border-b pb-2 last:border-b-0">
										<div className="flex items-center justify-between">
											<span className="text-gray-500">{formatDate(a.startsAt)}</span>
											<span className="text-gray-600">{a.type?.label || 'RDV'} — {a.status}</span>
										</div>
										{a.report ? <p className="mt-1">Rapport: {a.report}</p> : null}
									</li>
								))}
							</ul>
						)}
					</div>

					<div className="border rounded p-4 md:col-span-2">
						<div className="font-medium mb-2">Documents</div>
						{!history ? (
							<div className="text-sm text-gray-600">Chargement…</div>
						) : (
							<div className="space-y-3">
								{history.appointments
									.filter((a) => a.status === 'COMPLETED')
									.map((apt) => (
										<div key={apt.id}>
											<div className="text-sm font-medium mb-1">{formatDate(apt.startsAt)} — {apt.type?.label || 'RDV'}</div>
											{documents[apt.id] && documents[apt.id].length > 0 ? (
												<ul className="text-sm list-disc pl-5">
													{documents[apt.id].map((doc) => (
														<li key={doc.id}>
															<button
																onClick={() => handleDownloadDocument(doc.id, doc.filename)}
																className="text-blue-600 hover:underline bg-transparent border-none p-0 cursor-pointer"
															>
																📄 {doc.filename}
															</button>
														</li>
													))}
												</ul>
											) : (
												<div className="text-sm text-gray-600">Aucun document</div>
											)}
										</div>
									))}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}


