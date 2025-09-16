import { useEffect, useMemo, useState, useRef } from 'react';
import type { AnimalDto, AnimalHistoryDto } from '../services/animals.service';
import { animalsService } from '../services/animals.service';
import { documentsService } from '../services/documents.service';
import { httpService } from '../services/http.service';

const STATUS_LABELS: Record<string, string> = {
    PENDING: 'En attente',
    CONFIRMED: 'Confirmé',
    REJECTED: 'Refusé',
    CANCELLED: 'Annulé',
    COMPLETED: 'Terminé',
};
function statusLabel(status: string): string {
    return STATUS_LABELS[status] ?? status;
}

interface AnimalDetailsModalProps {
	isOpen: boolean;
	onClose: () => void;
	animal: AnimalDto | null;
	onDeleted?: () => void;
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

export function AnimalDetailsModal({ isOpen, onClose, animal, onDeleted }: AnimalDetailsModalProps) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [history, setHistory] = useState<AnimalHistoryDto | null>(null);
	const [documents, setDocuments] = useState<Record<string, { id: string; filename: string }[]>>({});
	const [isEditing, setIsEditing] = useState(false);
	const [editError, setEditError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);
	interface EditForm {
		name: string;
		birthdate: string | '';
		species: string;
		breed: string;
		sex: 'MALE' | 'FEMALE' | 'UNKNOWN';
		isSterilized: boolean;
		color: string;
		chipId: string;
		weightKg: number | '';
		heightCm: number | '';
		isNac: boolean;
	}
	const [form, setForm] = useState<EditForm>({
		name: animal?.name || '',
		birthdate: animal?.birthdate || '',
		species: animal?.species || '',
		breed: animal?.breed || '',
		sex: (animal?.sex as 'MALE' | 'FEMALE' | 'UNKNOWN') || 'UNKNOWN',
		isSterilized: Boolean(animal?.isSterilized),
		color: animal?.color || '',
		chipId: animal?.chipId || '',
		weightKg: (animal?.weightKg as number | null) ?? '',
		heightCm: (animal?.heightCm as number | null) ?? '',
		isNac: Boolean(animal?.isNac),
	});
	const [expanded, setExpanded] = useState<Record<string, boolean>>({});
	const nameInputRef = useRef<HTMLInputElement | null>(null);

	// Sync form values with current animal when entering edit mode and focus first input
	useEffect(() => {
		if (!isEditing || !animal) return;
		setForm({
			name: animal.name || '',
			birthdate: animal.birthdate || '',
			species: animal.species || '',
			breed: animal.breed || '',
			sex: (animal.sex as 'MALE' | 'FEMALE' | 'UNKNOWN') || 'UNKNOWN',
			isSterilized: Boolean(animal.isSterilized),
			color: animal.color || '',
			chipId: animal.chipId || '',
			weightKg: (animal.weightKg as number | null) ?? '',
			heightCm: (animal.heightCm as number | null) ?? '',
			isNac: Boolean(animal.isNac),
		});
		nameInputRef.current?.focus();
	}, [isEditing, animal]);

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
			.filter((a) => new Date(a.startsAt).getTime() > now && a.status === 'CONFIRMED')
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
			alert('Erreur lors du téléchargement du document');
			console.error(e);
		}
	};

	if (!isOpen || !animal) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="animal-details-title">
			<div className="bg-white rounded-lg p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto" role="document">
				<div className="flex justify-between items-start gap-3 mb-4">
					<div>
						<h2 id="animal-details-title" className="text-xl font-semibold mb-1">{animal.name}</h2>
						<div className="text-sm text-gray-600">
							{animal.species || '—'}{animal.breed ? ` • ${animal.breed}` : ''}
						</div>
					</div>
					<div className="flex items-center gap-2">
						<button
							className="text-sm px-3 py-1 border rounded"
							onClick={() => setIsEditing((v) => !v)}
							aria-pressed={isEditing}
							aria-controls="animal-edit-form"
						>
							{isEditing ? 'Annuler' : 'Modifier'}
						</button>
						<button
							type="button"
							className="text-sm px-3 py-1 border rounded text-red-700 border-red-300 hover:bg-red-50 disabled:opacity-50"
							disabled={deleting}
							onClick={async () => {
								if (!window.confirm('Supprimer définitivement cet animal ? Cette action est irréversible.')) return;
								try {
									setDeleting(true);
									await animalsService.deleteAnimal(animal.id);
									onDeleted?.();
									onClose();
								} catch (e) {
									setError(e instanceof Error ? e.message : 'Erreur lors de la suppression');
								} finally {
									setDeleting(false);
								}
							}}
							aria-label="Supprimer l'animal"
						>
							{deleting ? 'Suppression…' : 'Supprimer'}
						</button>
						<button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl font-bold" aria-label="Fermer">×</button>
					</div>
				</div>

				{loading ? <div>Chargement…</div> : null}
				{error ? <div className="text-red-700 bg-red-50 border border-red-200 rounded p-2 mb-3">{error}</div> : null}

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="border rounded p-4">
						<div className="font-medium mb-2">Détails</div>
						{!isEditing ? (
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
						) : (
							<form id="animal-edit-form" onSubmit={async (e) => {
								e.preventDefault();
								setSaving(true);
								setEditError(null);
								try {
									const payload = {
										...form,
										weightKg: form.weightKg === '' ? undefined : Number(form.weightKg),
										heightCm: form.heightCm === '' ? undefined : Number(form.heightCm),
									};
									await animalsService.updateAnimal(animal.id, payload);
									// shallow update client-side view
									setIsEditing(false);
								} catch (e) {
									setEditError(e instanceof Error ? e.message : 'Erreur lors de la sauvegarde');
								} finally {
									setSaving(false);
								}
							}} className="space-y-3">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
									<label className="text-sm">Nom<input ref={nameInputRef} className="mt-1 border rounded p-2 w-full" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
									<label className="text-sm">Naissance<input type="date" className="mt-1 border rounded p-2 w-full" value={form.birthdate || ''} onChange={(e) => setForm({ ...form, birthdate: e.target.value })} /></label>
									<label className="text-sm">Espèce<input className="mt-1 border rounded p-2 w-full" value={form.species} onChange={(e) => setForm({ ...form, species: e.target.value })} /></label>
									<label className="text-sm">Race<input className="mt-1 border rounded p-2 w-full" value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} /></label>
									<label className="text-sm">Sexe<select className="mt-1 border rounded p-2 w-full" value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value as 'MALE' | 'FEMALE' | 'UNKNOWN' })}><option value="UNKNOWN">Non déterminé</option><option value="MALE">Mâle</option><option value="FEMALE">Femelle</option></select></label>
									<label className="text-sm">Couleur<input className="mt-1 border rounded p-2 w-full" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></label>
									<label className="text-sm">Puce<input className="mt-1 border rounded p-2 w-full" value={form.chipId || ''} onChange={(e) => setForm({ ...form, chipId: e.target.value })} /></label>
									<label className="text-sm">Poids (kg)<input type="number" min={0} step={0.1} className="mt-1 border rounded p-2 w-full" value={form.weightKg === '' ? '' : String(form.weightKg)} onChange={(e) => setForm({ ...form, weightKg: e.target.value === '' ? '' : Number(e.target.value) })} /></label>
									<label className="text-sm">Taille (cm)<input type="number" min={0} className="mt-1 border rounded p-2 w-full" value={form.heightCm === '' ? '' : String(form.heightCm)} onChange={(e) => setForm({ ...form, heightCm: e.target.value === '' ? '' : Number(e.target.value) })} /></label>
								</div>
								<div className="flex items-center gap-4">
									<label className="text-sm inline-flex items-center gap-2"><input type="checkbox" checked={form.isSterilized} onChange={(e) => setForm({ ...form, isSterilized: e.target.checked })} /> Stérilisé(e)</label>
									<label className="text-sm inline-flex items-center gap-2"><input type="checkbox" checked={form.isNac} onChange={(e) => setForm({ ...form, isNac: e.target.checked })} /> NAC</label>
								</div>
								{editError ? <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">{editError}</div> : null}
								<div className="flex justify-end gap-2">
									<button type="submit" className="px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-50" disabled={saving}>{saving ? 'Sauvegarde…' : 'Enregistrer'}</button>
								</div>
							</form>
						)}
					</div>

					<div className="border rounded p-4">
						<div className="font-medium mb-2">Prochains RDV</div>
						{upcomingAppointments.length === 0 ? (
							<div className="text-sm text-gray-600">Aucun RDV à venir</div>
						) : (
							<ul className="text-sm space-y-2">
								{upcomingAppointments.map((a) => (
									<li key={a.id} className="">
										<div className="flex items-center justify-between gap-3">
											<span>{formatDate(a.startsAt)}</span>
											<div className="flex items-center gap-2">
												<span className="text-gray-600">{a.type?.label || 'RDV'} — {statusLabel(a.status)}</span>
												<button
													type="button"
													className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
													onClick={() => setExpanded((prev) => ({ ...prev, [a.id]: !prev[a.id] }))}
												>
													{expanded[a.id] ? 'Masquer' : 'Détails'}
												</button>
											</div>
										</div>
										{expanded[a.id] ? (
											<div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
												{a.notes ? (
													<div className="bg-yellow-50 border border-yellow-200 rounded p-2">
														<div className="text-xs font-medium text-yellow-800">Notes internes</div>
														<p className="text-sm text-yellow-900 whitespace-pre-wrap">{a.notes}</p>
													</div>
												) : null}
												{a.report ? (
													<div className="bg-green-50 border border-green-200 rounded p-2">
														<div className="text-xs font-medium text-green-800">Compte-rendu</div>
														<p className="text-sm text-green-900 whitespace-pre-wrap">{a.report}</p>
													</div>
												) : null}
												{documents[a.id] && documents[a.id].length > 0 ? (
													<div className="bg-gray-50 border border-gray-200 rounded p-2 md:col-span-2">
														<div className="text-xs font-medium text-gray-700">Documents</div>
														<ul className="mt-1 text-sm list-disc pl-5">
															{documents[a.id].map((doc) => (
																<li key={doc.id}>📄 {doc.filename}</li>
															))}
														</ul>
													</div>
												) : null}
											</div>
										) : null}
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
										<div className="flex items-center justify-between gap-3">
											<span className="text-gray-500">{formatDate(a.startsAt)}</span>
											<div className="flex items-center gap-2">
												<span className="text-gray-600">{a.type?.label || 'RDV'} — {statusLabel(a.status)}</span>
												<button
													type="button"
													className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
													onClick={() => setExpanded((prev) => ({ ...prev, [a.id]: !prev[a.id] }))}
												>
													{expanded[a.id] ? 'Masquer' : 'Détails'}
												</button>
											</div>
										</div>
										{expanded[a.id] ? (
											<div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
												{a.notes ? (
													<div className="bg-yellow-50 border border-yellow-200 rounded p-2">
														<div className="text-xs font-medium text-yellow-800">Notes internes</div>
														<p className="text-sm text-yellow-900 whitespace-pre-wrap">{a.notes}</p>
													</div>
												) : null}
												{a.report ? (
													<div className="bg-green-50 border border-green-200 rounded p-2">
														<div className="text-xs font-medium text-green-800">Compte-rendu</div>
														<p className="text-sm text-green-900 whitespace-pre-wrap">{a.report}</p>
													</div>
												) : null}
												{documents[a.id] && documents[a.id].length > 0 ? (
													<div className="bg-gray-50 border border-gray-200 rounded p-2 md:col-span-2">
														<div className="text-xs font-medium text-gray-700">Documents</div>
														<ul className="mt-1 text-sm list-disc pl-5">
															{documents[a.id].map((doc) => (
																<li key={doc.id}>📄 {doc.filename}</li>
															))}
														</ul>
													</div>
												) : null}
											</div>
										) : null}
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


