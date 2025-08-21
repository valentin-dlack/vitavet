import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { clinicsService, type ClinicDetailDto } from '../services/clinics.service';
import { VetSelector } from '../components/VetSelector';

export function ClinicDetail() {
	const { clinicId } = useParams();
	const navigate = useNavigate();
	const [clinic, setClinic] = useState<ClinicDetailDto | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [selectedVetId, setSelectedVetId] = useState<string | undefined>(undefined);

	useEffect(() => {
		const load = async () => {
			if (!clinicId) return;
			setLoading(true);
			setError(null);
			try {
				const detail = await clinicsService.getById(clinicId);
				setClinic(detail);
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
							{clinic.addressLine1 ? <div className="text-gray-700 text-sm">{clinic.addressLine1}</div> : null}
							{clinic.phone || clinic.email ? (
								<div className="text-gray-700 text-sm mt-1 flex flex-col">
									{clinic.phone ? <span>Téléphone: {clinic.phone}</span> : null}
									{clinic.email ? <span>Email: {clinic.email}</span> : null}
								</div>
							) : null}
							{clinic.services && clinic.services.length > 0 ? (
								<div className="mt-2 flex flex-wrap gap-2">
									{clinic.services.map((s) => (
										<span key={s.id} className="px-2 py-1 border rounded text-xs bg-gray-50">{s.label}</span>
									))}
								</div>
							) : null}
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


