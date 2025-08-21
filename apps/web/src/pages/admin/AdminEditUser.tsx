import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminService } from '../../services/admin.service';
import type { AdminUserDto } from '../../services/admin.service';
import type { ClinicDto } from '../../services/clinics.service';

type UserRole = 'OWNER' | 'VET' | 'ASV' | 'ADMIN_CLINIC' | 'WEBMASTER';

const roleOptions: { value: UserRole; label: string; description: string }[] = [
  { value: 'OWNER', label: 'Propriétaire', description: 'Rôle global - Accès aux animaux et rendez-vous' },
  { value: 'VET', label: 'Vétérinaire', description: 'Rôle clinique - Accès aux rendez-vous et agenda' },
  { value: 'ASV', label: 'ASV', description: 'Rôle clinique - Assistant vétérinaire' },
  { value: 'ADMIN_CLINIC', label: 'Admin Clinique', description: 'Rôle clinique - Gestion de la clinique' },
  { value: 'WEBMASTER', label: 'Webmaster', description: 'Rôle global - Accès administrateur complet' },
];

export function AdminEditUser() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<AdminUserDto | null>(null);
  const [clinics, setClinics] = useState<ClinicDto[]>([]);
  
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'ASV' as UserRole,
    clinicId: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;

      setLoading(true);
      setError(null);
      try {
        const [users, clinicsData] = await Promise.all([
          adminService.getUsers(),
          adminService.getClinics(),
        ]);
        
        const userData = users.find(u => u.id === userId);
        if (!userData) {
          setError('Utilisateur non trouvé');
          return;
        }
        
        setUser(userData);
        setClinics(clinicsData);
        setFormData({
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: (userData.role as UserRole) || 'ASV',
          clinicId: '', // We'll need to fetch current clinic role separately
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch user');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setLoading(true);
    setError(null);

    // Validation
    const isGlobalRole = (role: UserRole) => role === 'OWNER' || role === 'WEBMASTER';
    const isClinicRole = (role: UserRole) => role === 'VET' || role === 'ASV' || role === 'ADMIN_CLINIC';

    if (isClinicRole(formData.role) && !formData.clinicId) {
      setError('Une clinique doit être sélectionnée pour ce rôle');
      setLoading(false);
      return;
    }

    if (isGlobalRole(formData.role) && formData.clinicId) {
      setError('Les rôles globaux ne peuvent pas être associés à une clinique');
      setLoading(false);
      return;
    }

    try {
      await adminService.updateUser(userId, {
        ...formData,
        clinicId: formData.clinicId || undefined
      });
      navigate('/admin/users');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear clinic selection if switching to global role
    if (name === 'role') {
      const newRole = value as UserRole;
      const isGlobalRole = newRole === 'OWNER' || newRole === 'WEBMASTER';
      if (isGlobalRole) {
        setFormData(prev => ({ ...prev, clinicId: '' }));
      }
    }
  };

  const isClinicRole = (role: UserRole) => role === 'VET' || role === 'ASV' || role === 'ADMIN_CLINIC';

  if (loading && !user) return <p>Chargement...</p>;
  if (error && !user) return <p className="text-red-500">{error}</p>;
  if (!user) return <p>Utilisateur non trouvé</p>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Modifier l'utilisateur</h1>
      
      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
            Prénom
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
            Nom
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">
            Rôle
          </label>
          <select 
            id="role" 
            name="role"
            value={formData.role} 
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            {roleOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label} - {option.description}
              </option>
            ))}
          </select>
        </div>

        {isClinicRole(formData.role) && (
          <div>
            <label htmlFor="clinicId" className="block text-sm font-medium text-gray-700">
              Clinique
            </label>
            <select 
              id="clinicId" 
              name="clinicId"
              value={formData.clinicId} 
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Sélectionner une clinique</option>
              {clinics.map(clinic => (
                <option key={clinic.id} value={clinic.id}>
                  {clinic.name} - {clinic.city}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {loading ? 'Mise à jour...' : 'Mettre à jour'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/users')}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
