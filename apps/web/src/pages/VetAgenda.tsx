import { useEffect, useMemo, useRef, useState, type JSX, useCallback } from 'react';
import { agendaService, type AgendaItem } from '../services/agenda.service';
import { animalsService, type AnimalHistoryDto } from '../services/animals.service';
import { clinicsService } from '../services/clinics.service';
import { appointmentsService, type CompleteAppointmentData } from '../services/appointments.service';
import { documentsService } from '../services/documents.service';
import type { Document } from '../entities/document.entity';

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
  const [showBlocks, setShowBlocks] = useState(true);
  const blockDialogRef = useRef<HTMLDivElement | null>(null);
  const blockFirstButtonRef = useRef<HTMLButtonElement | null>(null);
  const [openItem, setOpenItem] = useState<AgendaItem | null>(null);

  const fetchAgenda = useCallback(() => {
    setLoading(true);
    setError(null);
    const fetcher = range === 'day' ? agendaService.getMyDay : range === 'week' ? agendaService.getMyWeek : agendaService.getMyMonth;
    fetcher.call(agendaService, date)
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load agenda'))
      .finally(() => setLoading(false));
  }, [date, range]);

  useEffect(() => {
    if (!blockOpen) return;
    const prev = document.activeElement as HTMLElement | null;
    blockFirstButtonRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setBlockOpen(false);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [blockOpen]);

  useEffect(() => {
    fetchAgenda();
  }, [fetchAgenda]);

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

  const filteredItems = useMemo(() => items.filter((it) => showBlocks || it.status !== 'BLOCKED'), [items, showBlocks]);

  const byHour = useMemo(() => {
    const map = new Map<string, AgendaItem[]>();
    filteredItems.forEach((it) => {
      const h = new Date(it.startsAt).toLocaleTimeString([], { hour: '2-digit' });
      if (!map.has(h)) map.set(h, []);
      map.get(h)!.push(it);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredItems]);

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
            <div className="flex items-center gap-1 bg-white border rounded p-1" role="group" aria-label="Période d'affichage">
              <button aria-pressed={range==='day'} className={`px-2 py-1 rounded ${range==='day'?'bg-blue-600 text-white':'text-gray-700'}`} onClick={() => setRange('day')}>Jour</button>
              <button aria-pressed={range==='week'} className={`px-2 py-1 rounded ${range==='week'?'bg-blue-600 text-white':'text-gray-700'}`} onClick={() => setRange('week')}>Semaine</button>
              <button aria-pressed={range==='month'} className={`px-2 py-1 rounded ${range==='month'?'bg-blue-600 text-white':'text-gray-700'}`} onClick={() => setRange('month')}>Mois</button>
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

        {/* Filters & Legend (separate row for better spacing) */}
        <div className="mb-3 p-3 bg-white border rounded">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <input id="toggle-blocks" type="checkbox" checked={showBlocks} onChange={(e) => setShowBlocks(e.target.checked)} />
              <label htmlFor="toggle-blocks">Afficher les blocs</label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded bg-green-500 inline-block" aria-hidden /> Confirmé</span>
              <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded bg-yellow-500 inline-block" aria-hidden /> En attente</span>
              <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded bg-gray-500 inline-block" aria-hidden /> Terminé</span>
              <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded bg-red-500 inline-block" aria-hidden /> Blocage</span>
            </div>
          </div>
        </div>

        {loading ? <div aria-live="polite">Chargement…</div> : null}
        {error ? <div className="text-red-600" role="alert">{error}</div> : null}

        <div className="text-sm text-gray-600">{filteredItems.length} rendez-vous</div>

        {range === 'day' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            {byHour.map(([hour, rows]) => (
              <div key={hour} className="border rounded p-3">
                <div className="font-medium mb-2">{hour}h</div>
                <div className="space-y-2">
                  {rows.map((r) => (
                    <AgendaRow key={r.id} item={r} onOpenModal={() => setOpenItem(r)} />
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
          <WeekGrid items={filteredItems} anchorDate={date} setOpenItem={setOpenItem} />
        )}

        {range === 'month' && (
          <MonthGrid items={filteredItems} anchorDate={date} setOpenItem={setOpenItem} />
        )}
      </div>

      {blockOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="block-modal-title">
          <div ref={blockDialogRef} className="bg-white rounded-lg w-full max-w-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 id="block-modal-title" className="text-lg font-semibold">Bloquer un créneau</h3>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setBlockOpen(false)} aria-label="Fermer la fenêtre">✕</button>
            </div>
            {blockError ? <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2" role="alert">{blockError}</div> : null}
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
              <button ref={blockFirstButtonRef} className="px-4 py-2 border rounded" onClick={() => setBlockOpen(false)} disabled={blockLoading}>Annuler</button>
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
      {openItem && <AgendaItemModal item={openItem} onClose={() => { setOpenItem(null); fetchAgenda(); }} />}
    </div>
  );
}

function WeekGrid({ items, anchorDate, setOpenItem }: { items: AgendaItem[]; anchorDate: string; setOpenItem: (item: AgendaItem | null) => void; }) {
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
            const statusClass = it.status === 'COMPLETED'
              ? 'bg-gray-400/80 hover:bg-gray-500'
              : 'bg-blue-500/80 hover:bg-blue-600';
            return (
              <button
                type="button"
                key={`${it.id}-${start}`}
                className={`rounded ${statusClass} text-white text-xs px-2 py-1 overflow-hidden cursor-pointer text-left`}
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
                  className="rounded bg-red-300 text-red-900 text-xs px-2 py-1 overflow-hidden text-left"
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

      {/* The AgendaItemModal component will manage its own openItem state */}
    </div>
  );
}

function MonthGrid({ items, anchorDate, setOpenItem }: { items: AgendaItem[]; anchorDate: string; setOpenItem: (item: AgendaItem | null) => void; }) {
  const anchor = new Date(anchorDate);
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const day = first.getDay() || 7;
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - (day - 1)); // Monday before or same week
  gridStart.setHours(0, 0, 0, 0);
  const cells = Array.from({ length: 42 }, (_, i) => new Date(gridStart.getTime() + i * 24 * 60 * 60 * 1000));

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
                      <div key={it.id} className="w-full text-left text-[11px] px-2 py-1 rounded bg-red-200 text-red-800">
                        {it.reason ? `Indispo — ${it.reason}` : 'Indisponible'}
                      </div>
                    );
                  }
                  const isCompleted = it.status === 'COMPLETED';
                  const color = it.status === 'CONFIRMED' ? 'bg-green-100 text-green-800 hover:bg-green-200' : it.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' : isCompleted ? 'bg-gray-200 text-gray-800' : 'bg-blue-100 text-blue-800 hover:bg-blue-200';
                  return (
                    <button
                      key={it.id}
                      className={`w-full text-left text-[11px] px-2 py-1 rounded ${color}`}
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
      {/* The AgendaItemModal component will manage its own openItem state */}
    </div>
  );
}

function AgendaItemModal({ item, onClose }: { item: AgendaItem; onClose: () => void }) {
  const start = new Date(item.startsAt);
  const end = new Date(item.endsAt);
  const [history, setHistory] = useState<AnimalHistoryDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [completionForm, setCompletionForm] = useState<CompleteAppointmentData>({
    notes: '',
    report: '',
  });

  useEffect(() => {
    let cancelled = false;
    if (item.animal?.id) {
      setLoading(true);
      setError(null);
      animalsService
        .getHistory(item.animal.id)
        .then((h) => { if (!cancelled) setHistory(h); })
        .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Erreur'); })
        .finally(() => { if (!cancelled) setLoading(false); });

      documentsService.getDocumentsForAppointment(item.id).then((data) => {
        setDocuments(Array.isArray(data) ? data : []);
      }).catch((e) => {
        console.error('Error fetching documents:', e);
        setDocuments([]);
      });
    }
    return () => { cancelled = true; };
  }, [item.animal?.id, item.id]);

  const handleComplete = async () => {
    setLoading(true);
    setError(null);
    try {
      await appointmentsService.completeAppointment(item.id, completionForm);
      onClose(); // This should trigger a refresh in the parent component
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to complete appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      console.log('Starting file upload...');
      const newDoc = await documentsService.uploadDocument(item.id, file);
      console.log('Upload successful, new document:', newDoc);
      setDocuments((prev) => {
        console.log('Previous documents:', prev);
        const updated = [newDoc, ...prev];
        console.log('Updated documents:', updated);
        return updated;
      });
      setFile(null);
    } catch (e) {
      console.error('Upload failed:', e);
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="appointment-details-title">
      <div className="bg-white rounded-lg w-full max-w-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 id="appointment-details-title" className="text-lg font-semibold">Détails du rendez-vous</h3>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>✕</button>
        </div>
        
        {isCompleting ? (
          <div>
            <div className="space-y-4">
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes internes (vétérinaire)</label>
                <textarea
                  id="notes"
                  rows={4}
                  className="mt-1 block w-full border rounded p-2"
                  value={completionForm.notes}
                  onChange={(e) => setCompletionForm({ ...completionForm, notes: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="report" className="block text-sm font-medium text-gray-700">Compte-rendu (visible par le propriétaire)</label>
                <textarea
                  id="report"
                  rows={6}
                  className="mt-1 block w-full border rounded p-2"
                  value={completionForm.report}
                  onChange={(e) => setCompletionForm({ ...completionForm, report: e.target.value })}
                />
              </div>
            </div>
            {error && <div className="text-red-600 mt-2" role="alert">{error}</div>}
            <div className="mt-4 flex justify-end gap-2">
              <button className="px-4 py-2 border rounded" onClick={() => setIsCompleting(false)} disabled={loading}>Annuler</button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleComplete} disabled={loading}>
                {loading ? 'Sauvegarde...' : 'Sauvegarder et compléter'}
              </button>
            </div>
          </div>
        ) : (
          <>
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
                <div className="mt-3">
                  <div className="font-medium">Historique de l'animal</div>
                  {loading ? <div className="text-sm text-gray-500">Chargement…</div> : null}
                  {error ? <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">{error}</div> : null}
                  {history && (
                    <ul className="mt-2 space-y-1 text-sm">
                      {history.appointments.slice(0, 5).map((apt) => (
                        <li key={apt.id} className="flex items-center justify-between">
                          <span>{new Date(apt.startsAt).toLocaleDateString()} {new Date(apt.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="text-gray-600">{apt.type?.label || 'RDV'} — {apt.status}</span>
                        </li>
                      ))}
                      {history.appointments.length === 0 ? <li className="text-gray-600">Aucun historique</li> : null}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {isCompleting ? (
              <div className="mt-4">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes internes (vétérinaire)</label>
                    <textarea
                      id="notes"
                      rows={4}
                      className="mt-1 block w-full border rounded p-2"
                      value={completionForm.notes}
                      onChange={(e) => setCompletionForm({ ...completionForm, notes: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="report" className="block text-sm font-medium text-gray-700">Compte-rendu (visible par le propriétaire)</label>
                    <textarea
                      id="report"
                      rows={6}
                      className="mt-1 block w-full border rounded p-2"
                      value={completionForm.report}
                      onChange={(e) => setCompletionForm({ ...completionForm, report: e.target.value })}
                    />
                  </div>
                </div>
                {error && <div className="text-red-600 mt-2" role="alert">{error}</div>}
                <div className="mt-4 flex justify-end gap-2">
                  <button className="px-4 py-2 border rounded" onClick={() => setIsCompleting(false)} disabled={loading}>Annuler</button>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleComplete} disabled={loading}>
                    {loading ? 'Sauvegarde...' : 'Sauvegarder et compléter'}
                  </button>
                </div>
              </div>
            ) : null}

            {item.status === 'COMPLETED' && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Documents</h3>
                <div className="space-y-2">
                  {documents && documents.length > 0 ? (
                    documents.map(doc => doc ? (
                      <div key={doc.id} className="text-sm">
                        <a href={`/uploads/${doc.storagePath.replace(/\\/g, '/')}`} target="_blank" rel="noopener noreferrer">{doc.filename}</a>
                      </div>
                    ) : null)
                  ) : (
                    <p className="text-sm text-gray-500">Aucun document.</p>
                  )}
                </div>
                <div className="mt-4">
                  <input type="file" className="text-sm" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} />
                  <button onClick={handleFileUpload} disabled={uploading || !file} className="ml-2 px-3 py-1 text-sm bg-blue-500 text-white rounded disabled:bg-gray-300">
                    {uploading ? 'Envoi...' : 'Envoyer'}
                  </button>
                </div>
              </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button className="px-4 py-2 border rounded" onClick={onClose}>Fermer</button>
              {item.status !== 'COMPLETED' && (
                <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={() => setIsCompleting(true)}>
                  Compléter le RDV
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function AgendaRow({ item, onOpenModal }: { item: AgendaItem; onOpenModal: () => void }) {
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
          <span className={`text-xs px-2 py-1 rounded ${item.status === 'COMPLETED' ? 'bg-gray-200 text-gray-800' : item.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : item.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-700'}`}>
            {item.status}
          </span>
          <button className="text-blue-600 text-sm hover:underline" onClick={onOpenModal}>Détails</button>
        </div>
      </div>
    </div>
  );
}
