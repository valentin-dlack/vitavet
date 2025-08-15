import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const cards = [
	{
		key: 'ASV_PENDING',
		roles: ['ASV', 'ADMIN_CLINIC'],
		to: '/asv/pending',
		title: 'RDV en attente',
		desc: 'Valider rapidement les demandes reçues',
		icon: (
			<span className="text-3xl" aria-hidden>📬</span>
		),
	},
	{
		key: 'VET_AGENDA',
		roles: ['VET'],
		to: '/vet/agenda',
		title: 'Emploi du temps',
		desc: 'Voir la journée de consultations',
		icon: (
			<span className="text-3xl" aria-hidden>📅</span>
		),
	},
	{
		key: 'OWNER_APPOINT',
		roles: ['OWNER'],
		to: '/clinics',
		title: 'Prendre un RDV',
		desc: 'Choisir une clinique et un créneau',
		icon: (
			<span className="text-3xl" aria-hidden>🩺</span>
		),
	},
];

export function RolePanel() {
	const { user } = useAuth();
	const role = user?.role || 'OWNER';
	const visible = cards.filter((c) => c.roles.includes(role));

	return (
		<div className="min-h-screen bg-gray-50 py-12">
			<div className="mx-auto max-w-5xl px-4">
				<h1 className="text-2xl font-bold mb-6">Espace {role}</h1>
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{visible.map((c) => (
						<Link key={c.key} to={c.to} className="group block rounded-lg border bg-white p-6 shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500">
							<div className="flex items-center gap-4">
								<div>{c.icon}</div>
								<div>
									<div className="font-semibold text-gray-900 group-hover:text-blue-700">{c.title}</div>
									<div className="text-sm text-gray-600">{c.desc}</div>
								</div>
							</div>
						</Link>
					))}
					{visible.length === 0 ? (
						<div className="text-gray-600">Aucun raccourci disponible pour votre rôle.</div>
					) : null}
				</div>
			</div>
		</div>
	);
}


