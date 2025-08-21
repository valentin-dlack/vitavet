import { Link } from "react-router-dom";
import { HealthCheck } from "../components/HealthCheck";
import { authService } from "../services/auth.service";
import { useEffect, useState } from "react";

export function Home() {
  const [isAuth, setIsAuth] = useState<boolean>(authService.isAuthenticated());
  const [fullName, setFullName] = useState<string>("");

  useEffect(() => {
    const user = authService.getUser();
    setIsAuth(authService.isAuthenticated());
    setFullName(user ? `${user.firstName} ${user.lastName}` : "");
  }, []);

  const handleLogout = () => {
    authService.logout();
    setIsAuth(false);
    setFullName("");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-extrabold text-gray-900">
          🐾 VitaVet
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          Gestion de santé pour vos animaux de compagnie
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Session */}
          {isAuth ? (
            <div className="mb-6" role="status" aria-live="polite">
              <p className="text-green-700 font-medium" data-testid="welcome-message">
                Bienvenue, {fullName} 👋
              </p>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-3 w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Se déconnecter
              </button>
            </div>
          ) : (
            <div className="mb-6 text-center text-sm text-gray-700">
              Vous n'êtes pas connecté.
            </div>
          )}

          {/* Health Check */}
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">État de l'API</h2>
            <HealthCheck />
          </div>

          {/* Navigation */}
          {!isAuth && (
            <div className="space-y-4">
              <Link
                to="/register"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Créer un compte
              </Link>
              
              <Link
                to="/login"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Se connecter
              </Link>
              <Link
                to="/clinics"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Rechercher une clinique
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
