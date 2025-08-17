import { useEffect, useMemo, useState, type JSX } from 'react';
import { agendaService, type AgendaItem } from '../services/agenda.service';
import { clinicsService } from '../services/clinics.service';

function toYmd(d: Date) {
  return d.toISOString().split('T')[0];
}

export function VetAgenda() {
  const [date, setDate] = useState<string>(toYmd(new Date()));
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<'day' | 'week' | 'month'>('day');
  const [blockOpen, setBlockOpen] = useState(false);
  const [blockForm, setBlockForm] = useState<{ clinicId: string; start: string; end: string; reason: string }>({ clinicId: '', start: `${date}T09:00`, end: `${date}T10:00`, reason: '' });
  const [blockLoading, setBlockLoading] = useState(false);
  const [blockError, setBlockError] = useState<string | null>(null);
  const [clinics, setClinics] = useState<Array<{ id: string; name: string; city?: string; postcode?: string }>>([]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const fetcher = range === 'day' ? agendaService.getMyDay : range === 'week' ? agendaService.getMyWeek : agendaService.getMyMonth;
    fetcher.call(agendaService, date)
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load agenda'))
      .finally(() => setLoading(false));
  }, [date, range]);

  // Load clinics list lazily when opening block modal
  useEffect(() => {
    if (blockOpen && clinics.length === 0) {
      clinicsService
        .search('')
        .then((all) => setClinics(all))
        .catch(() => setClinics([]));
    }
  }, [blockOpen, clinics.length]);

  function stepDate(direction: -1 | 1): void {
    const current = new Date(date);
    if (range === 'day') {
      const shifted = new Date(current.getTime() + direction * 24 * 60 * 60 * 1000);
      setDate(toYmd(shifted));
      return;
    }
    if (range === 'week') {
      const shifted = new Date(current.getTime() + direction * 7 * 24 * 60 * 60 * 1000);
      setDate(toYmd(shifted));
      return;
    }
    // month
    const shifted = new Date(current);
    shifted.setMonth(shifted.getMonth() + direction);
    setDate(toYmd(shifted));
  }

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
              onClick={() => stepDate(-1)}
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
              onClick={() => stepDate(1)}
            >
              Suivant →
            </button>
            <button type="button" className="px-3 py-2 border rounded bg-red-50 text-red-700" onClick={() => { setBlockOpen(true); setBlockForm((f) => ({ ...f, start: `${date}T09:00`, end: `${date}T10:00` })); }}>Bloquer un créneau</button>
          </div>
        </div>

        {loading ? <div>Chargement…</div> : null}
        {error ? <div className="text-red-600">{error}</div> : null}

        <div className="text-sm text-gray-600">{items.length} rendez-vous</div>

        {range === 'day' && (
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
        )}

        {range === 'week' && (
          <WeekGrid items={items} anchorDate={date} />
        )}

        {range === 'month' && (
          <MonthGrid items={items} anchorDate={date} />
        )}
      </div>

      {blockOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold">Bloquer un créneau</h3>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setBlockOpen(false)}>✕</button>
            </div>
            {blockError ? <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">{blockError}</div> : null}
            <div className="space-y-3">
              <div>
                <label htmlFor="block-clinic" className="block text-sm text-gray-700">Clinique</label>
                <select
                  id="block-clinic"
                  value={blockForm.clinicId}
                  onChange={(e) => setBlockForm({ ...blockForm, clinicId: e.target.value })}
                  className="mt-1 border rounded p-2 w-full bg-white"
                >
                  <option value="">Sélectionner…</option>
                  {clinics.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.postcode ? `(${c.postcode}` : ''}{c.city ? `${c.postcode ? ' ' : ''}${c.city}` : ''}{c.postcode ? ')' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700">Début</label>
                  <input type="datetime-local" value={blockForm.start} onChange={(e) => setBlockForm({ ...blockForm, start: e.target.value })} className="mt-1 border rounded p-2 w-full" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700">Fin</label>
                  <input type="datetime-local" value={blockForm.end} onChange={(e) => setBlockForm({ ...blockForm, end: e.target.value })} className="mt-1 border rounded p-2 w-full" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700">Motif (optionnel)</label>
                <input value={blockForm.reason} onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })} className="mt-1 border rounded p-2 w-full" placeholder="Congés, formation…" />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="px-4 py-2 border rounded" onClick={() => setBlockOpen(false)} disabled={blockLoading}>Annuler</button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white disabled:opacity-50"
                disabled={blockLoading || !blockForm.clinicId || !blockForm.start || !blockForm.end}
                onClick={async () => {
                  try {
                    setBlockLoading(true);
                    setBlockError(null);
                    await agendaService.block({ clinicId: blockForm.clinicId, startsAt: new Date(blockForm.start).toISOString(), endsAt: new Date(blockForm.end).toISOString(), reason: blockForm.reason || undefined });
                    setBlockOpen(false);
                    // refresh
                    const fetcher = range === 'day' ? agendaService.getMyDay : range === 'week' ? agendaService.getMyWeek : agendaService.getMyMonth;
                    setLoading(true);
                    const refreshed = await fetcher.call(agendaService, date);
                    setItems(refreshed);
                  } catch (e) {
                    setBlockError(e instanceof Error ? e.message : 'Erreur');
                  } finally {
                    setBlockLoading(false);
                    setLoading(false);
                  }
                }}
              >
                {blockLoading ? 'Blocage…' : 'Bloquer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WeekGrid({ items, anchorDate }: { items: AgendaItem[]; anchorDate: string }) {
  // Build week days from Monday to Sunday based on anchorDate
  const anchor = new Date(anchorDate);
  const day = anchor.getDay() || 7;
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() - (day - 1));
  monday.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 7 }, (_, i) => new Date(monday.getTime() + i * 24 * 60 * 60 * 1000));

  // Time grid configuration
  const startHour = 9;
  const endHour = 19;
  const slotMinutes = 30;
  const rowsCount = ((endHour - startHour) * 60) / slotMinutes; // e.g., 20 rows for 30-min slots
  const rowHeight = 32; // px per slot row (responsive-friendly constant)

  const [openItem, setOpenItem] = useState<AgendaItem | null>(null);

  const gridStyle = {
    gridTemplateColumns: '80px repeat(7, 1fr)',
    gridTemplateRows: `repeat(${rowsCount}, ${rowHeight}px)`,
  } as React.CSSProperties;

  function computeRowIndex(d: Date): number {
    const minutes = d.getHours() * 60 + d.getMinutes();
    const fromStart = minutes - startHour * 60;
    return Math.max(0, Math.floor(fromStart / slotMinutes));
  }

  function computeRowSpan(s: Date, e: Date): { start: number; end: number } {
    const start = computeRowIndex(s) + 1; // grid rows start at 1
    const duration = Math.max(1, Math.ceil(((e.getTime() - s.getTime()) / 60000) / slotMinutes));
    const end = Math.min(rowsCount + 1, start + duration);
    return { start, end };
  }

  return (
    <div className="mt-4">
      {/* Header with day labels */}
      <div className="grid" style={{ gridTemplateColumns: '80px repeat(7, 1fr)' }}>
        <div />
        {days.map((d, idx) => (
          <div key={idx} className="text-sm font-medium text-gray-700 text-center py-1">
            {d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
          </div>
        ))}
      </div>

      {/* Unified grid for time rows and day columns */}
      <div className="mt-2 grid relative" style={gridStyle}>
        {/* Time labels column */}
        {Array.from({ length: rowsCount }).map((_, r) => {
          const isHour = r % (60 / slotMinutes) === 0;
          const labelHour = startHour + Math.floor((r * slotMinutes) / 60);
          const label = isHour ? `${String(labelHour).padStart(2, '0')}:00` : '';
          return (
            <div
              key={`t-${r}`}
              className="border-t px-1 text-xs text-gray-500 flex items-start"
              style={{ gridColumn: '1 / 2', gridRow: `${r + 1} / ${r + 2}` }}
            >
              {label}
            </div>
          );
        })}

        {/* Day columns background cells with top borders per slot */}
        {days.map((_, dIdx) =>
          Array.from({ length: rowsCount }).map((_, r) => (
            <div
              key={`c-${dIdx}-${r}`}
              className="border-t border-gray-200"
              style={{ gridColumn: `${dIdx + 2} / ${dIdx + 3}`, gridRow: `${r + 1} / ${r + 2}` }}
            />
          )),
        )}

        {/* Events placed on the same CSS grid for perfect alignment */}
        {items.map((it) => {
          const s = new Date(it.startsAt);
          const e = new Date(it.endsAt);
          const dayIndex = (new Date(s.getFullYear(), s.getMonth(), s.getDate()).getTime() - new Date(days[0].getFullYear(), days[0].getMonth(), days[0].getDate()).getTime()) / (24 * 60 * 60 * 1000);
          const isBlocked = it.status === 'BLOCKED';
          if (!isBlocked) {
            if (dayIndex < 0 || dayIndex > 6) return null; // outside current week
            const { start, end } = computeRowSpan(s, e);
            const content = `${it.animal?.name || 'RDV'} — ${it.status}`;
            return (
              <button
                type="button"
                key={`${it.id}-${start}`}
                className="rounded bg-blue-500/80 text-white text-xs px-2 py-1 overflow-hidden cursor-pointer hover:bg-blue-600 text-left"
                style={{ gridColumn: `${Number(dayIndex) + 2} / ${Number(dayIndex) + 3}`, gridRow: `${start} / ${end}`, margin: 2 }}
                title={content}
                onClick={() => setOpenItem(it)}
              >
                {content}
              </button>
            );
          }
          // For blocked periods, render on each overlapping day segment
          const blocks: JSX.Element[] = [];
          for (let i = 0; i < 7; i++) {
            const dayStart = new Date(days[0].getTime() + i * 24 * 60 * 60 * 1000);
            const dayEnd = new Date(dayStart);
            dayEnd.setHours(23, 59, 59, 999);
            const overlapStart = s > dayStart ? s : dayStart;
            const overlapEnd = e < dayEnd ? e : dayEnd;
            if (overlapStart < overlapEnd) {
              const seg = computeRowSpan(overlapStart, overlapEnd);
              const content = it.reason ? `Indispo — ${it.reason}` : 'Indisponible';
              blocks.push(
                <div
                  key={`${it.id}-${i}-${seg.start}`}
                  className="rounded bg-red-200 text-red-800 text-xs px-2 py-1 overflow-hidden text-left"
                  style={{ gridColumn: `${i + 2} / ${i + 3}`, gridRow: `${seg.start} / ${seg.end}`, margin: 2 }}
                  title={content}
                />
              );
            }
          }
          return blocks;
        })}
      </div>

      {items.length === 0 ? (
        <div className="text-gray-600 mt-4">Aucun rendez-vous cette semaine.</div>
      ) : null}

      {openItem && <AgendaItemModal item={openItem} onClose={() => setOpenItem(null)} />}
    </div>
  );
}

function MonthGrid({ items, anchorDate }: { items: AgendaItem[]; anchorDate: string }) {
  const anchor = new Date(anchorDate);
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const day = first.getDay() || 7;
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - (day - 1)); // Monday before or same week
  gridStart.setHours(0, 0, 0, 0);
  const cells = Array.from({ length: 42 }, (_, i) => new Date(gridStart.getTime() + i * 24 * 60 * 60 * 1000));

  const [openItem, setOpenItem] = useState<AgendaItem | null>(null);

  const itemsByDay = cells.map((d) =>
    items.filter((it) => {
      const s = new Date(it.startsAt);
      return s.getFullYear() === d.getFullYear() && s.getMonth() === d.getMonth() && s.getDate() === d.getDate();
    }),
  );

  return (
    <div className="mt-4">
      <div className="grid grid-cols-7 gap-2">
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((label) => (
          <div key={label} className="text-center text-sm font-medium text-gray-700">{label}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2 mt-2">
        {cells.map((d, idx) => {
          const inMonth = d.getMonth() === anchor.getMonth();
          const list = itemsByDay[idx];
          return (
            <div key={idx} className={`border rounded p-2 min-h-24 ${inMonth ? 'bg-white' : 'bg-gray-50'}`}>
              <div className={`text-xs mb-1 ${inMonth ? 'text-gray-900' : 'text-gray-400'}`}>
                {d.getDate().toString().padStart(2, '0')}
              </div>
              <div className="space-y-1">
                {list.slice(0, 3).map((it) => {
                  const s = new Date(it.startsAt);
                  const label = `${s.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • ${it.animal?.name || 'RDV'}`;
                  const isBlocked = it.status === 'BLOCKED';
                  if (isBlocked) {
                    return (
                      <div key={it.id} className="w-full text-left text-[11px] px-2 py-1 rounded bg-red-100 text-red-800">
                        {it.reason ? `Indispo — ${it.reason}` : 'Indisponible'}
                      </div>
                    );
                  }
                  return (
                    <button
                      key={it.id}
                      className="w-full text-left text-[11px] px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100"
                      onClick={() => setOpenItem(it)}
                    >
                      {label}
                    </button>
                  );
                })}
                {list.length > 3 ? (
                  <div className="text-[11px] text-gray-500">+{list.length - 3} autres…</div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      {openItem && <AgendaItemModal item={openItem} onClose={() => setOpenItem(null)} />}
    </div>
  );
}

function AgendaItemModal({ item, onClose }: { item: AgendaItem; onClose: () => void }) {
  const start = new Date(item.startsAt);
  const end = new Date(item.endsAt);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold">Détails du rendez-vous</h3>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>✕</button>
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
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button className="px-4 py-2 border rounded" onClick={onClose}>Fermer</button>
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
