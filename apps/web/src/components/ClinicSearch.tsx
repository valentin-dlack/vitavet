import { useState } from 'react';
import { clinicsService, type ClinicDto } from '../services/clinics.service';

export function ClinicSearch() {
  const [postcode, setPostcode] = useState('');
  const [results, setResults] = useState<ClinicDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await clinicsService.search(postcode.trim());
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
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
        {error ? (
          <p id="postcode-error" className="text-red-600 text-sm mt-1" role="alert">{error}</p>
        ) : null}
      </form>

      <ul className="mt-4" aria-live="polite">
        {results.map((c) => (
          <li key={c.id} className="border-b py-2">
            <span className="font-medium">{c.name}</span>
            <span className="text-gray-600"> — {c.postcode} {c.city}</span>
          </li>
        ))}
        {(!loading && results.length === 0 && postcode.trim()) && (
          <li className="text-gray-600">Aucun résultat</li>
        )}
      </ul>
    </div>
  );
}


