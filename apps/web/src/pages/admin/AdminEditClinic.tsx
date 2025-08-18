import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminService } from '../../services/admin.service';
import type { AdminClinicDto } from '../../services/admin.service';

export function AdminEditClinic() {
  const { clinicId } = useParams<{ clinicId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clinic, setClinic] = useState<AdminClinicDto | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    postcode: '',
  });

  useEffect(() => {
    if (!clinicId) return;

    const fetchClinic = async () => {
      setLoading(true);
      setError(null);
      try {
        const clinics = await adminService.getClinics();
        const clinicData = clinics.find(c => c.id === clinicId);
        if (!clinicData) {
          setError('Clinique non trouvée');
          return;
        }
        setClinic(clinicData);
        setFormData({
          name: clinicData.name,
          city: clinicData.city,
          postcode: clinicData.postcode,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch clinic');
      } finally {
        setLoading(false);
      }
    };

    fetchClinic();
  }, [clinicId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicId) return;

    setLoading(true);
    setError(null);
    try {
      await adminService.updateClinic(clinicId, formData);
      navigate('/admin/clinics');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update clinic');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading && !clinic) return <p>Chargement...</p>;
  if (error && !clinic) return <p className="text-red-500">{error}</p>;
  if (!clinic) return <p>Clinique non trouvée</p>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Modifier la clinique</h1>
      
      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Nom de la clinique
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700">
            Ville
          </label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="postcode" className="block text-sm font-medium text-gray-700">
            Code postal
          </label>
          <input
            type="text"
            id="postcode"
            name="postcode"
            value={formData.postcode}
            onChange={handleChange}
            required
            pattern="[0-9]{5}"
            title="Code postal français (5 chiffres)"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Modification...' : 'Modifier'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/clinics')}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
