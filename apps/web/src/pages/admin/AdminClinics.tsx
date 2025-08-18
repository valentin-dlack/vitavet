import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/admin.service';
import type { AdminClinicDto } from '../../services/admin.service';
import { clinicsService } from '../../services/clinics.service';

export function AdminClinics() {
  const [clinics, setClinics] = useState<AdminClinicDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClinics = () => {
    setLoading(true);
    setError(null);
    adminService
      .getClinics()
      .then((data) => {
        setClinics(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        console.error('Error fetching clinics:', e);
        setError(e instanceof Error ? e.message : 'An error occurred');
        setClinics([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchClinics();
  }, []);

  const handleDelete = async (clinicId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette clinique ?')) {
      try {
        await clinicsService.deleteClinic(clinicId);
        fetchClinics(); // Refresh list
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete clinic');
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Gestion des cliniques</h1>
        <Link
          to="/admin/clinics/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
        >
          Créer une clinique
        </Link>
      </div>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className='text-left'>
              <th className="py-2 px-4 border-b">ID</th>
              <th className="py-2 px-4 border-b">Nom</th>
              <th className="py-2 px-4 border-b">Ville</th>
              <th className="py-2 px-4 border-b">Code postal</th>
              <th className="py-2 px-4 border-b">Actif</th>
              <th className="py-2 px-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clinics && clinics.length > 0 ? (
              clinics.map((clinic) => (
                <tr key={clinic.id}>
                  <td className="py-2 px-4 border-b">{clinic.id}</td>
                  <td className="py-2 px-4 border-b">{clinic.name}</td>
                  <td className="py-2 px-4 border-b">{clinic.city}</td>
                  <td className="py-2 px-4 border-b">{clinic.postcode}</td>
                  <td className="py-2 px-4 border-b">{clinic.active ? 'Oui' : 'Non'}</td>
                  <td className="py-2 px-4 border-b space-x-2">
                    <Link to={`/admin/clinics/${clinic.id}/roles`} className="text-blue-600 hover:underline">Rôles</Link>
                    <Link to={`/admin/clinics/${clinic.id}/edit`} className="text-green-600 hover:underline">Modifier</Link>
                    <button onClick={() => handleDelete(clinic.id)} className="text-red-600 hover:underline">Supprimer</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-4 px-4 text-center text-gray-500">
                  {loading ? 'Chargement des cliniques...' : 'Aucune clinique trouvée'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
