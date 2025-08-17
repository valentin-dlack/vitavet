import { useEffect, useMemo, useState } from 'react';
import { agendaService, type AgendaItem } from '../services/agenda.service';

function toYmd(d: Date) {
  return d.toISOString().split('T')[0];
}

export function VetAgenda() {
  const [date, setDate] = useState<string>(toYmd(new Date()));
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<'day' | 'week' | 'month'>('day');

  useEffect(() => {
    setLoading(true);
    setError(null);
    const fetcher = range === 'day' ? agendaService.getMyDay : range === 'week' ? agendaService.getMyWeek : agendaService.getMyMonth;
    fetcher.call(agendaService, date)
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load agenda'))
      .finally(() => setLoading(false));
  }, [date, range]);

  const byHour = useMemo(() => {
    const map = new Map<string, AgendaItem[]>();
    items.forEach((it) => {
      const h = new Date(it.startsAt).toLocaleTimeString([], { hour: '2-digit' });
      if (!map.has(h)) map.set(h, []);
      map.get(h)!.push(it);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [items]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4">
        <h1 className="text-2xl font-semibold mb-4">📅 Agenda {range === 'day' ? 'du jour' : range === 'week' ? 'de la semaine' : 'du mois'}</h1>
        <div className="flex items-end gap-3 mb-4">
          <div>
            <label htmlFor="date" className="block text-sm text-gray-700">Date</label>
            <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 border rounded p-2" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white border rounded p-1">
              <button className={`px-2 py-1 rounded ${range==='day'?'bg-blue-600 text-white':'text-gray-700'}`} onClick={() => setRange('day')}>Jour</button>
              <button className={`px-2 py-1 rounded ${range==='week'?'bg-blue-600 text-white':'text-gray-700'}`} onClick={() => setRange('week')}>Semaine</button>
              <button className={`px-2 py-1 rounded ${range==='month'?'bg-blue-600 text-white':'text-gray-700'}`} onClick={() => setRange('month')}>Mois</button>
            </div>
            <button
              type="button"
              className="px-3 py-2 border rounded"
              onClick={() => setDate(toYmd(new Date(new Date(date).getTime() - 24 * 60 * 60 * 1000)))}
            >
              ← Précédent
            </button>
            <button
              type="button"
              className="px-3 py-2 border rounded"
              onClick={() => setDate(toYmd(new Date()))}
            >
              Aujourd’hui
            </button>
            <button
              type="button"
              className="px-3 py-2 border rounded"
              onClick={() => setDate(toYmd(new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000)))}
            >
              Suivant →
            </button>
          </div>
        </div>

        {loading ? <div>Chargement…</div> : null}
        {error ? <div className="text-red-600">{error}</div> : null}

        <div className="text-sm text-gray-600">{items.length} rendez-vous</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          {byHour.map(([hour, rows]) => (
            <div key={hour} className="border rounded p-3">
              <div className="font-medium mb-2">{hour}h</div>
              <div className="space-y-2">
                {rows.map((r) => (
                  <AgendaRow key={r.id} item={r} />
                ))}
              </div>
            </div>
          ))}
          {!loading && !error && items.length === 0 ? (
            <div className="text-gray-600">Aucun rendez-vous pour cette date.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function AgendaRow({ item }: { item: AgendaItem }) {
  const [open, setOpen] = useState(false);
  const start = new Date(item.startsAt);
  const end = new Date(item.endsAt);
  return (
    <div className="border rounded p-2">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-900">
            {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {' '}→{' '}
            {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-xs text-gray-600">{item.animal?.name || 'Animal'}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded ${item.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : item.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
            {item.status}
          </span>
          <button className="text-blue-600 text-sm hover:underline" onClick={() => setOpen(true)}>Détails</button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold">Détails du rendez-vous</h3>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setOpen(false)}>✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="border rounded p-3">
                <div className="font-medium mb-1">Animal</div>
                <div className="text-sm text-gray-700">Nom: {item.animal?.name || '—'}</div>
                <div className="text-sm text-gray-700">Espèce: {item.animal?.species || '—'}</div>
                <div className="text-sm text-gray-700">Race: {item.animal?.breed || '—'}</div>
                <div className="text-sm text-gray-700">Poids: {item.animal?.weightKg != null ? `${item.animal.weightKg} kg` : '—'}</div>
                <div className="text-sm text-gray-700">Naissance: {item.animal?.birthdate ? new Date(item.animal.birthdate).toLocaleDateString() : '—'}</div>
              </div>

              <div className="border rounded p-3">
                <div className="font-medium mb-1">Propriétaire</div>
                <div className="text-sm text-gray-700">{item.owner ? `${item.owner.firstName} ${item.owner.lastName}` : '—'}</div>
                <div className="text-sm text-gray-700">{item.owner?.email || '—'}</div>
              </div>

              <div className="border rounded p-3 md:col-span-2">
                <div className="font-medium mb-1">Rendez-vous</div>
                <div className="text-sm text-gray-700">Heure: {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} → {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                <div className="text-sm text-gray-700">Statut: {item.status}</div>
                {/* futur: type de rendez-vous, motif, notes */}
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button className="px-4 py-2 border rounded" onClick={() => setOpen(false)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
