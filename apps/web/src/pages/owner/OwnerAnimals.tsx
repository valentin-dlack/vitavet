import { useEffect, useState } from 'react';
import { animalsService, type AnimalDto, type AnimalHistoryDto } from '../../services/animals.service';

export function OwnerAnimals() {
  const [animals, setAnimals] = useState<AnimalDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [history, setHistory] = useState<Record<string, AnimalHistoryDto | undefined>>({});

  useEffect(() => {
    setLoading(true);
    setError(null);
    animalsService
      .getMyAnimals('')
      .then(setAnimals)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erreur'))
      .finally(() => setLoading(false));
  }, []);

  async function toggleHistory(id: string) {
    if (openId === id) {
      setOpenId(null);
      return;
    }
    setOpenId(id);
    if (!history[id]) {
      try {
        const h = await animalsService.getHistory(id);
        setHistory((prev) => ({ ...prev, [id]: h }));
      } catch (e) {
        console.error(e);
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-3xl px-4">
        <h1 className="text-2xl font-semibold mb-4">Mes animaux</h1>
        {loading ? <div>Chargement…</div> : null}
        {error ? <div className="text-red-700 bg-red-50 border border-red-200 rounded p-2">{error}</div> : null}
        <div className="space-y-3">
          {animals.map((an) => {
            const h = history[an.id];
            return (
              <div key={an.id} className="border rounded bg-white">
                <button className="w-full text-left p-3 flex items-center justify-between" onClick={() => toggleHistory(an.id)}>
                  <div>
                    <div className="font-medium">{an.name}</div>
                    <div className="text-sm text-gray-600">{an.birthdate ? new Date(an.birthdate).toLocaleDateString() : '—'}</div>
                  </div>
                  <span aria-hidden>{openId === an.id ? '▲' : '▼'}</span>
                </button>
                {openId === an.id && (
                  <div className="p-3 border-t">
                    <div className="font-medium mb-2">Historique</div>
                    {h ? (
                      h.appointments.length ? (
                        <ul className="space-y-1 text-sm">
                          {h.appointments.slice(0, 10).map((apt) => (
                            <li key={apt.id} className="flex items-center justify-between">
                              <span>{new Date(apt.startsAt).toLocaleDateString()} {new Date(apt.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              <span className="text-gray-600">{apt.type?.label || 'RDV'} — {apt.status}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-gray-600 text-sm">Aucun historique</div>
                      )
                    ) : (
                      <div className="text-gray-500 text-sm">Chargement…</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {!loading && !error && animals.length === 0 ? (
            <div className="text-gray-600">Aucun animal.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}


