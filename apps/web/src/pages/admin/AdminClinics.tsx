import { useEffect, useState } from 'react';
import { adminService } from '../../services/admin.service';
import type { AdminClinicDto } from '../../services/admin.service';

export function AdminClinics() {
  const [clinics, setClinics] = useState<AdminClinicDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Gestion des cliniques</h1>
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
