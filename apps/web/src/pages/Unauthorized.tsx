import { Link } from 'react-router-dom';

export function Unauthorized() {
	return (
		<div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
			<div className="sm:mx-auto sm:w-full sm:max-w-md">
				<div className="text-center">
					<h1 className="text-6xl font-bold text-red-600">401</h1>
					<h2 className="mt-4 text-2xl font-semibold text-gray-900">
						Accès non autorisé
					</h2>
					<p className="mt-2 text-gray-600">
						Vous n'avez pas les permissions nécessaires pour accéder à cette page.
					</p>
				</div>

				<div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
					<div className="space-y-4">
						<Link
							to="/"
							className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
						>
							Retour à l'accueil
						</Link>
						<Link
							to="/login"
							className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
						>
							Se connecter avec un autre compte
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
