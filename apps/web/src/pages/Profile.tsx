import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/auth.service';

export function Profile() {
	const { user, isAuthenticated } = useAuth();

	if (!isAuthenticated || !user) {
		return (
			<div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-6">
				<p className="text-gray-700 mb-4">Vous n'êtes pas connecté.</p>
				<Link className="px-4 py-2 bg-blue-600 text-white rounded" to="/login">Se connecter</Link>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
			<div className="sm:mx-auto sm:w-full sm:max-w-md">
				<h1 className="text-center text-3xl font-extrabold text-gray-900">Profil</h1>
			</div>
			<div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
				<div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
					<div className="space-y-2">
						<div><span className="text-gray-500">Prénom:</span> {user.firstName}</div>
						<div><span className="text-gray-500">Nom:</span> {user.lastName}</div>
						<div><span className="text-gray-500">Email:</span> {user.email}</div>
					</div>
					<button onClick={() => authService.logout()} className="mt-6 w-full px-4 py-2 border rounded">
						Se déconnecter
					</button>
				</div>
			</div>
		</div>
	);
}


