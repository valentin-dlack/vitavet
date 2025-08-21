import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/admin.service';
import { clinicsService } from '../../services/clinics.service';
import type { ClinicDto } from '../../services/clinics.service';

type UserRole = 'OWNER' | 'VET' | 'ASV' | 'ADMIN_CLINIC' | 'WEBMASTER';

const roleOptions: { value: UserRole; label: string; description: string }[] = [
  { value: 'OWNER', label: 'Propriétaire', description: 'Rôle global - Accès aux animaux et rendez-vous' },
  { value: 'VET', label: 'Vétérinaire', description: 'Rôle clinique - Accès aux rendez-vous et agenda' },
  { value: 'ASV', label: 'ASV', description: 'Rôle clinique - Assistant vétérinaire' },
  { value: 'ADMIN_CLINIC', label: 'Admin Clinique', description: 'Rôle clinique - Gestion de la clinique' },
  { value: 'WEBMASTER', label: 'Webmaster', description: 'Rôle global - Accès administrateur complet' },
];

export function AdminCreateUser() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('ASV');
  const [clinicId, setClinicId] = useState<string>('');
  const [clinics, setClinics] = useState<ClinicDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const clinicsData = await adminService.getClinics();
        setClinics(clinicsData);
      } catch (err) {
        console.error('Failed to fetch clinics:', err);
      }
    };
    fetchClinics();
  }, []);

  const isGlobalRole = (role: UserRole) => role === 'OWNER' || role === 'WEBMASTER';
  const isClinicRole = (role: UserRole) => role === 'VET' || role === 'ASV' || role === 'ADMIN_CLINIC';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation
    if (isClinicRole(role) && !clinicId) {
      setError('Une clinique doit être sélectionnée pour ce rôle');
      setLoading(false);
      return;
    }

    if (isGlobalRole(role) && clinicId) {
      setError('Les rôles globaux ne peuvent pas être associés à une clinique');
      setLoading(false);
      return;
    }

    try {
      await adminService.createUser({ 
        email, 
        firstName, 
        lastName, 
        password, 
        role,
        clinicId: clinicId || undefined
      });
      navigate('/admin/users');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    // Clear clinic selection if switching to global role
    if (isGlobalRole(newRole)) {
      setClinicId('');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Créer un nouvel utilisateur</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
          <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
        </div>
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">Prénom</label>
          <input type="text" id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Nom</label>
          <input type="text" id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">Mot de passe</label>
          <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
        </div>
        
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">Rôle</label>
          <select 
            id="role" 
            value={role} 
            onChange={(e) => handleRoleChange(e.target.value as UserRole)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            {roleOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label} - {option.description}
              </option>
            ))}
          </select>
        </div>

        {isClinicRole(role) && (
          <div>
            <label htmlFor="clinicId" className="block text-sm font-medium text-gray-700">Clinique</label>
            <select 
              id="clinicId" 
              value={clinicId} 
              onChange={(e) => setClinicId(e.target.value)}
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

        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50">
          {loading ? 'Création...' : 'Créer l\'utilisateur'}
        </button>
      </form>
    </div>
  );
}
