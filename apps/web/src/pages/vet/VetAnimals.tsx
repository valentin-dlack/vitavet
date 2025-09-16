import { useCallback, useEffect, useMemo, useState } from 'react';
import { agendaService, type AgendaItem } from '../../services/agenda.service';
import type { AnimalDto } from '../../services/animals.service';
import { AnimalDetailsModal } from '../../components/AnimalDetailsModal';

function toYmd(d: Date) {
  return d.toISOString().split('T')[0];
}

export function VetAnimals() {
  const [date, setDate] = useState<string>(toYmd(new Date()));
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnimal, setSelectedAnimal] = useState<AnimalDto | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const month = await agendaService.getMyMonth(date);
      setItems(month);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  const animals = useMemo(() => {
    const map = new Map<string, AnimalDto>();
    for (const it of items) {
      if (it.animal?.id) {
        map.set(it.animal.id, {
          id: it.animal.id,
          clinicId: '',
          ownerId: '',
          name: it.animal.name,
          birthdate: it.animal.birthdate ?? undefined,
          species: it.animal.species ?? undefined,
          breed: it.animal.breed ?? undefined,
          weightKg: it.animal.weightKg ?? undefined,
        } as AnimalDto);
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  const emojiForSpecies = useMemo(() => {
    return (species?: string | null): string => {
      if (!species) return '🐾';
      const s = species.toLowerCase();
      if (s.includes('chien') || s.includes('dog')) return '🐶';
      if (s.includes('chat') || s.includes('cat')) return '🐱';
      if (s.includes('lapin') || s.includes('rabbit')) return '🐰';
      if (s.includes('hamster')) return '🐹';
      if (s.includes('oiseau') || s.includes('bird') || s.includes('perruche')) return '🐦';
      if (s.includes('poisson') || s.includes('fish')) return '🐟';
      if (s.includes('cheval') || s.includes('horse')) return '🐴';
      if (s.includes('tortue') || s.includes('turtle')) return '🐢';
      if (s.includes('serpent') || s.includes('snake')) return '🐍';
      if (s.includes('furet')) return '🦦';
      if (s.includes('cochon d') || s.includes('guinea')) return '🐹';
      return '🐾';
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex items-end gap-3 mb-4">
          <div>
            <label className="block text-sm text-gray-700">Mois</label>
            <input type="month" value={date.slice(0,7)} onChange={(e) => {
              const v = e.target.value; // yyyy-mm
              const d = new Date(v + '-01');
              setDate(toYmd(d));
            }} className="mt-1 border rounded p-2" />
          </div>
          <button type="button" className="ml-auto px-3 py-2 border rounded" onClick={load} disabled={loading}>Rafraîchir</button>
        </div>
        {loading ? <div>Chargement…</div> : null}
        {error ? <div className="text-red-700 bg-red-50 border border-red-200 rounded p-2">{error}</div> : null}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {animals.map((an) => (
            <button
              key={an.id}
              className="border rounded-lg p-4 bg-white hover:bg-gray-50 text-left flex items-center gap-4"
              onClick={() => setSelectedAnimal(an)}
            >
              <div className="text-3xl" aria-hidden>{emojiForSpecies(an.species)}</div>
              <div>
                <div className="font-medium text-lg">{an.name}</div>
                <div className="text-sm text-gray-600">
                  {an.species && an.breed ? `${an.species} • ${an.breed}` : an.species || an.breed || '—'}
                </div>
              </div>
            </button>
          ))}
        </div>
        {!loading && !error && animals.length === 0 ? (
          <div className="text-gray-600 mt-3">Aucun animal suivi ce mois-ci.</div>
        ) : null}

        <AnimalDetailsModal
          isOpen={selectedAnimal != null}
          onClose={() => setSelectedAnimal(null)}
          animal={selectedAnimal}
        />
      </div>
    </div>
  );
}

export default VetAnimals;


