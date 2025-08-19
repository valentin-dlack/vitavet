import { useEffect, useMemo, useState } from 'react';
import { animalsService, type AnimalDto } from '../../services/animals.service';
import { AddAnimalModal } from '../../components/AddAnimalModal';
import { AnimalDetailsModal } from '../../components/AnimalDetailsModal';
import { authService } from '../../services/auth.service';

export function OwnerAnimals() {
  const [animals, setAnimals] = useState<AnimalDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnimal, setSelectedAnimal] = useState<AnimalDto | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [userClinicId, setUserClinicId] = useState<string>('');

  const loadAnimals = () => {
    setLoading(true);
    setError(null);
    animalsService
      .getMyAnimals(userClinicId)
      .then(setAnimals)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erreur'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // Get user's clinic ID
    const clinics = authService.getUserClinics();
    const clinicId = clinics.length > 0 ? clinics[0] : '';
    setUserClinicId(clinicId);
  }, []);

  useEffect(() => {
    if (userClinicId !== '') {
      loadAnimals();
    }
  }, [userClinicId]);

  const handleAddSuccess = () => {
    loadAnimals();
  };

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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Mes animaux</h1>
        </div>
        {loading ? <div>Chargement…</div> : null}
        {error ? <div className="text-red-700 bg-red-50 border border-red-200 rounded p-2">{error}</div> : null}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setShowAddModal(true)}
            className="border-2 border-dashed rounded-lg p-6 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-left flex items-center justify-center h-full min-h-[120px]"
            aria-label="Ajouter un animal"
          >
            <div className="text-center">
              <div className="text-3xl">➕</div>
              <div className="mt-2 font-medium">Ajouter un animal</div>
            </div>
          </button>

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
          <div className="text-gray-600 mt-3">Aucun animal.</div>
        ) : null}

        <AddAnimalModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
          clinicId={userClinicId}
        />
        <AnimalDetailsModal
          isOpen={selectedAnimal != null}
          onClose={() => setSelectedAnimal(null)}
          animal={selectedAnimal}
        />
      </div>
    </div>
  );
}


