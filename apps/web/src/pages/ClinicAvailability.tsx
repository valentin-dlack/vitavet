import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { slotsService, type AvailableSlot } from '../services/slots.service';
import { AppointmentModal } from '../components/AppointmentModal';

function toYyyyMmDd(date: Date): string {
	return date.toISOString().split('T')[0];
}

export function ClinicAvailability() {
	const { clinicId } = useParams();
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const [date, setDate] = useState<string>(() => searchParams.get('date') || toYyyyMmDd(new Date()));
	const [vetUserId] = useState<string | undefined>(() => searchParams.get('vetUserId') || undefined);
	const [slots, setSlots] = useState<AvailableSlot[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
	const [showModal, setShowModal] = useState(false);

	useEffect(() => {
		if (!clinicId || !date) return;
		setLoading(true);
		setError(null);
		slotsService
			.getAvailableSlots({ clinicId, date, vetUserId })
			.then(setSlots)
			.catch((e) => setError(e instanceof Error ? e.message : 'Failed to load slots'))
			.finally(() => setLoading(false));
	}, [clinicId, date, vetUserId]);

	useEffect(() => {
		const next = new URLSearchParams(searchParams);
		next.set('date', date);
		if (vetUserId) next.set('vetUserId', vetUserId); else next.delete('vetUserId');
		setSearchParams(next, { replace: true });
	}, [date, searchParams, setSearchParams, vetUserId]);

	const sortedSlots = useMemo(() => {
		return [...slots].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
	}, [slots]);

	return (
		<div className="max-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
			<div className="sm:mx-auto sm:w-full sm:max-w-2xl">
				<h1 className="text-center text-3xl font-extrabold text-gray-900">Disponibilités</h1>
				<p className="mt-2 text-center text-sm text-gray-600">Choisissez une date et un créneau</p>
			</div>
			<div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
				<div className="bg-white py-6 px-4 shadow sm:rounded-lg sm:px-6">
					<div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
						<div>
							<label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
							<input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 border rounded p-2" />
						</div>
						<div className="ml-auto flex gap-2">
							<Link to={clinicId ? `/clinics/${clinicId}` : '/clinics'} className="px-3 py-2 border rounded">← Changer de vétérinaire</Link>
						</div>
					</div>

					{loading ? <div className="mt-4">Chargement…</div> : null}
					{error ? <div className="mt-4 text-red-600">{error}</div> : null}

					<div className="mt-4 flex flex-wrap gap-2">
						{sortedSlots.map((s) => (
							<button 
								key={s.id} 
								onClick={() => {
									setSelectedSlot(s);
									setShowModal(true);
								}}
								className="px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100"
							>
								{new Date(s.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
							</button>
						))}
						{!loading && !error && slots.length === 0 ? (
							<div className="text-gray-600">Aucun créneau disponible pour cette date.</div>
						) : null}
					</div>

					{selectedSlot && (
						<AppointmentModal
							isOpen={showModal}
							onClose={() => {
								setShowModal(false);
								setSelectedSlot(null);
							}}
							slot={selectedSlot}
							clinicId={clinicId!}
							onSuccess={(appointmentId) => {
								// Redirect to success page or show success message
								navigate('/', { state: { message: `Rendez-vous créé avec succès (ID: ${appointmentId})` } });
							}}
						/>
					)}
				</div>
			</div>
		</div>
	);
}


