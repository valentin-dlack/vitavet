import { useEffect, useState } from 'react';
import { appointmentsService, type AppointmentResponse } from '../../services/appointments.service';

export function OwnerAppointments() {
  const [items, setItems] = useState<AppointmentResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<AppointmentResponse['status'] | ''>('');

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await appointmentsService.getMyAppointments(status || undefined);
      setItems(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-3xl px-4">
        <h1 className="text-2xl font-semibold mb-4">Mes rendez-vous à venir</h1>
        <div className="flex items-end gap-3 mb-3">
          <div>
            <label className="block text-sm text-gray-700">Filtrer par statut</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as AppointmentResponse['status'])} className="mt-1 border rounded p-2">
              <option value="">Tous</option>
              <option value="PENDING">PENDING</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>
          <button type="button" className="px-3 py-2 border rounded" onClick={load} disabled={loading}>Rafraîchir</button>
        </div>
        {loading ? <div>Chargement…</div> : null}
        {error ? <div className="text-red-700 bg-red-50 border border-red-200 rounded p-2">{error}</div> : null}

        <div className="space-y-3">
          {items.map((a) => {
            const s = new Date(a.startsAt);
            const e = new Date(a.endsAt);
            return (
              <div key={a.id} className="border rounded p-3 bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{s.toLocaleDateString()} {s.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} → {e.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    <div className="text-sm text-gray-600">Vétérinaire: {a.vet ? `${a.vet.firstName} ${a.vet.lastName}` : '—'}</div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700">{a.status}</span>
                </div>
              </div>
            );
          })}
          {!loading && !error && items.length === 0 ? (
            <div className="text-gray-600">Aucun rendez-vous à venir.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}


