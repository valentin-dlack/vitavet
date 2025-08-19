import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, type CurrentUser, type DeletionRequestStatus } from '../services/auth.service';
import ProfileEditForm from '../components/ProfileEditForm';
import ChangePasswordForm from '../components/ChangePasswordForm';
import DeleteAccountForm from '../components/DeleteAccountForm';

const Profile: React.FC = () => {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletionRequest, setDeletionRequest] = useState<DeletionRequestStatus | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'deletion'>('profile');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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

        // Fetch deletion request status
        try {
          const deletionStatus = await authService.getDeletionRequestStatus();
          setDeletionRequest(deletionStatus);
        } catch {
          // Ignore error if no deletion request exists
        }
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

  const handleSuccess = (message: string) => {
    setSuccessMessage(message);
    setError(null);
    // Clear success message after 5 seconds
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setSuccessMessage(null);
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

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

  if (error && !user) {
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-green-400 text-xl">✅</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-400 text-xl">⚠️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow rounded-lg">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900" id="profile-title">
              Mon Profil
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Gérez vos informations personnelles et paramètres de compte
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                aria-label="Informations du profil"
              >
                Informations
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'password'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                aria-label="Changer le mot de passe"
              >
                Mot de passe
              </button>
              <button
                onClick={() => setActiveTab('deletion')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'deletion'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                aria-label="Demande de suppression de compte"
              >
                Supprimer le compte
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="px-6 py-6">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* Current Profile Info */}
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Informations actuelles</h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Prénom</label>
                      <div className="mt-1 p-3 bg-gray-50 border border-gray-300 rounded-md">
                        <span>{user.firstName}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nom</label>
                      <div className="mt-1 p-3 bg-gray-50 border border-gray-300 rounded-md">
                        <span>{user.lastName}</span>
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Adresse email</label>
                      <div className="mt-1 p-3 bg-gray-50 border border-gray-300 rounded-md">
                        <span>{user.email}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Roles and Clinics */}
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Rôles et permissions</h2>
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

                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Cliniques associées</h2>
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

                {/* Edit Profile Form */}
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Modifier les informations</h2>
                  <ProfileEditForm
                    user={user}
                    onSuccess={handleSuccess}
                    onError={handleError}
                  />
                </div>
              </div>
            )}

            {activeTab === 'password' && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Changer le mot de passe</h2>
                <ChangePasswordForm
                  onSuccess={handleSuccess}
                  onError={handleError}
                />
              </div>
            )}

            {activeTab === 'deletion' && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Demande de suppression de compte</h2>
                
                {/* Existing deletion request status */}
                {deletionRequest && (
                  <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <span className="text-yellow-400 text-xl">📋</span>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                          Demande en cours
                        </h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p><strong>Statut :</strong> {deletionRequest.status}</p>
                          <p><strong>Date de soumission :</strong> {new Date(deletionRequest.createdAt).toLocaleString('fr-FR')}</p>
                          {deletionRequest.adminNotes && (
                            <p><strong>Note de l'administrateur :</strong> {deletionRequest.adminNotes}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <DeleteAccountForm
                  onSuccess={handleSuccess}
                  onError={handleError}
                />
              </div>
            )}
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
                onClick={handleLogout}
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


