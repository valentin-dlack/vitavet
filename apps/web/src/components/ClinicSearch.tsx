import { useEffect, useState } from 'react';
import { Link, useInRouterContext } from 'react-router-dom';
import { clinicsService, type ClinicDto, type ServiceDto } from '../services/clinics.service';

export function ClinicSearch() {
  const [postcode, setPostcode] = useState('');
  const [results, setResults] = useState<ClinicDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const inRouter = useInRouterContext();

  const onSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await clinicsService.search(postcode.trim(), selectedServices);
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // load services once
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const list = await clinicsService.listServices();
        if (isMounted) setServices(list);
      } catch {
        // ignore
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleService = (slug: string) => {
    setSelectedServices((prev) => prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]);
  };

  return (
    <div>
      <form onSubmit={onSearch} aria-label="Search clinics">
        <label htmlFor="postcode" className="block font-medium mb-1">Code postal</label>
        <div className="flex gap-2">
          <input
            id="postcode"
            name="postcode"
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
            className="border rounded p-2 flex-1"
            placeholder="Ex: 75001"
            aria-describedby={error ? 'postcode-error' : undefined}
          />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded" disabled={loading}>
            {loading ? 'Recherche...' : 'Rechercher'}
          </button>
        </div>
        {services.length > 0 && (
          <div className="mt-3">
            <div className="text-sm text-gray-700 mb-1">Services</div>
            <div className="flex flex-wrap gap-2">
              {services.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleService(s.slug)}
                  className={`px-2 py-1 border rounded text-sm ${selectedServices.includes(s.slug) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700'}`}
                  aria-pressed={selectedServices.includes(s.slug)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}
        {error ? (
          <p id="postcode-error" className="text-red-600 text-sm mt-1" role="alert">{error}</p>
        ) : null}
      </form>

      <ul className="mt-4" aria-live="polite">
        {results.map((c) => (
          <li key={c.id} className="border rounded p-4 mb-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{c.name}</div>
              <div className="text-gray-600">{c.postcode} {c.city}</div>
            </div>
            {inRouter ? (
              <Link
                to={`/clinics/${c.id}`}
                className="px-3 py-2 bg-blue-600 text-white rounded"
              >
                Choisir
              </Link>
            ) : (
              <button type="button" className="px-3 py-2 bg-blue-600 text-white rounded" aria-label={`Choisir ${c.name}`}>
                Choisir
              </button>
            )}
          </li>
        ))}
        {(!loading && results.length === 0 && postcode.trim()) && (
          <li className="text-gray-600">Aucun résultat</li>
        )}
      </ul>
    </div>
  );
}


