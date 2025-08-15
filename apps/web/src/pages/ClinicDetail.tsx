import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { clinicsService, type ClinicDto } from '../services/clinics.service';
import { VetSelector } from '../components/VetSelector';

export function ClinicDetail() {
	const { clinicId } = useParams();
	const navigate = useNavigate();
	const [clinic, setClinic] = useState<ClinicDto | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [selectedVetId, setSelectedVetId] = useState<string | undefined>(undefined);

	useEffect(() => {
		const load = async () => {
			if (!clinicId) return;
			setLoading(true);
			setError(null);
			try {
				// reuse search to get a single clinic if available; fallback to minimal info
				const all = await clinicsService.search('');
				const found = all.find((c) => c.id === clinicId) || null;
				setClinic(found);
			} catch (e) {
				setError(e instanceof Error ? e.message : 'Failed to load clinic');
			} finally {
				setLoading(false);
			}
		};
		load();
	}, [clinicId]);

	const goToAvailability = () => {
		if (!clinicId) return;
		navigate(`/clinics/${clinicId}/availability` + (selectedVetId ? `?vetUserId=${selectedVetId}` : ''));
	};

	return (
		<div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
			<div className="sm:mx-auto sm:w-full sm:max-w-md">
				<h1 className="text-center text-3xl font-extrabold text-gray-900">Clinique</h1>
				<p className="mt-2 text-center text-sm text-gray-600">Sélectionnez un vétérinaire</p>
			</div>
			<div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
				<div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
					{loading ? <div>Chargement…</div> : null}
					{error ? <div className="text-red-600">{error}</div> : null}
					{clinic ? (
						<div className="mb-4">
							<div className="font-medium">{clinic.name}</div>
							<div className="text-gray-600">{clinic.postcode} {clinic.city}</div>
						</div>
					) : null}
					{clinicId ? (
						<VetSelector
							clinicId={clinicId}
							selectedVetId={selectedVetId}
							onVetSelect={setSelectedVetId}
						/>
					) : null}
					<div className="mt-6 flex gap-2">
						<Link to="/clinics" className="px-4 py-2 border rounded">
							← Retour
						</Link>
						<button
							onClick={goToAvailability}
							className="px-4 py-2 bg-blue-600 text-white rounded"
						>
							Voir les disponibilités
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}


