import { useEffect, useState } from 'react';
import { animalsService, type AnimalDto, type AnimalHistoryDto } from '../../services/animals.service';
import { documentsService } from '../../services/documents.service';
import { httpService } from '../../services/http.service';
import type { Document } from '../../entities/document.entity';

export function OwnerAnimals() {
  const [animals, setAnimals] = useState<AnimalDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [history, setHistory] = useState<Record<string, AnimalHistoryDto | undefined>>({});
  const [documents, setDocuments] = useState<Record<string, Document[]>>({});

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
        
        // Load documents for completed appointments
        const completedAppointments = h.appointments.filter(apt => apt.status === 'COMPLETED');
        for (const apt of completedAppointments) {
          try {
            const docs = await documentsService.getDocumentsForAppointment(apt.id);
            setDocuments(prev => ({
              ...prev,
              [apt.id]: Array.isArray(docs) ? docs : []
            }));
          } catch (e) {
            console.error('Error loading documents for appointment:', apt.id, e);
            setDocuments(prev => ({
              ...prev,
              [apt.id]: []
            }));
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  }

  const handleDownloadDocument = async (documentId: string, filename: string) => {
    try {
      const response = await httpService.download(`/documents/download/${documentId}`);
      
      // Create a blob from the response
      const blob = new Blob([response]);
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Erreur lors du téléchargement du document');
    }
  };

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
                            <li key={apt.id} className="p-2 border-b">
                              <div className="flex items-center justify-between">
                                <span>{new Date(apt.startsAt).toLocaleDateString()} {new Date(apt.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                <span className="text-gray-600">{apt.type?.label || 'RDV'} — {apt.status}</span>
                              </div>
                              {apt.report ? <p className="text-xs text-gray-700">Rapport: {apt.report}</p> : null}
                              {apt.status === 'COMPLETED' && documents[apt.id] && documents[apt.id].length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs text-gray-600 mb-1">Documents :</p>
                                  <div className="space-y-1">
                                    {documents[apt.id].map(doc => (
                                      <div key={doc.id} className="text-xs">
                                        <button
                                          onClick={() => handleDownloadDocument(doc.id, doc.filename)}
                                          className="text-blue-600 hover:underline bg-transparent border-none p-0 cursor-pointer"
                                        >
                                          📄 {doc.filename}
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
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


