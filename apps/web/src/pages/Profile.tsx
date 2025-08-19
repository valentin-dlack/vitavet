import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, type CurrentUser } from '../services/auth.service';

const Profile: React.FC = () => {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Check if user is authenticated
        if (!authService.isAuthenticated()) {
          navigate('/login');
          return;
        }

        const userData = await authService.getCurrentUser();
        setUser(userData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
        // If token is invalid, redirect to login
        if (err instanceof Error && err.message.includes('token')) {
          authService.logout();
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Profil non trouvé</h2>
          <p className="text-gray-600 mb-4">Impossible de charger les informations du profil.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900" id="profile-title">
              Mon Profil
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Informations personnelles et paramètres de votre compte
            </p>
          </div>

          {/* Profile Information */}
          <div className="px-6 py-6">
            <div className="space-y-6">
              {/* Personal Information */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4" id="personal-info-section">
                  Informations personnelles
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      Prénom
                    </label>
                    <div className="mt-1 p-3 bg-gray-50 border border-gray-300 rounded-md">
                      <span id="firstName" aria-label="Prénom de l'utilisateur">
                        {user.firstName}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                      Nom
                    </label>
                    <div className="mt-1 p-3 bg-gray-50 border border-gray-300 rounded-md">
                      <span id="lastName" aria-label="Nom de l'utilisateur">
                        {user.lastName}
                      </span>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Adresse email
                    </label>
                    <div className="mt-1 p-3 bg-gray-50 border border-gray-300 rounded-md">
                      <span id="email" aria-label="Adresse email de l'utilisateur">
                        {user.email}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Roles */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4" id="roles-section">
                  Rôles et permissions
                </h2>
                <div className="space-y-2">
                  {user.roles.length > 0 ? (
                    user.roles.map((role, index) => (
                      <div key={index} className="inline-block mr-2 mb-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {role}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">Aucun rôle assigné</p>
                  )}
                </div>
              </div>

              {/* Clinics */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4" id="clinics-section">
                  Cliniques associées
                </h2>
                <div className="space-y-2">
                  {user.clinics.length > 0 ? (
                    <p className="text-sm text-gray-600">
                      Vous êtes associé à {user.clinics.length} clinique(s)
                    </p>
                  ) : (
                    <p className="text-gray-500 text-sm">Aucune clinique associée</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
            <div className="flex justify-between items-center">
              <button
                onClick={() => navigate('/')}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
                aria-label="Retour à l'accueil"
              >
                Retour
              </button>
              <button
                onClick={() => {
                  authService.logout();
                  navigate('/login');
                }}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                aria-label="Se déconnecter"
              >
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;


