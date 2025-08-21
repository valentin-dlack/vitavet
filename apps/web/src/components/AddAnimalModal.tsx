import { useState, useRef, useEffect } from 'react';
import { animalsService } from '../services/animals.service';
import { clinicsService, type ClinicDto } from '../services/clinics.service';

interface AddAnimalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clinicId: string;
}

export function AddAnimalModal({ isOpen, onClose, onSuccess, clinicId }: AddAnimalModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clinics, setClinics] = useState<ClinicDto[]>([]);
  const [selectedClinicId, setSelectedClinicId] = useState<string>(clinicId || '');
  const [formData, setFormData] = useState({
    name: '',
    birthdate: '',
    species: '',
    breed: '',
    sex: 'UNKNOWN' as 'MALE' | 'FEMALE' | 'UNKNOWN',
    isSterilized: false,
    color: '',
    chipId: '',
    weightKg: '',
    heightCm: '',
    isNac: false,
  });

  const dialogRef = useRef<HTMLDivElement | null>(null);
  const firstFocusableRef = useRef<HTMLInputElement | null>(null);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      firstFocusableRef.current?.focus();
    }
  }, [isOpen]);

  // Load clinics when modal opens
  useEffect(() => {
    if (!isOpen) return;
    clinicsService
      .search('')
      .then(setClinics)
      .catch(() => setClinics([]));
  }, [isOpen]);

  // Sync selected clinic with prop changes
  useEffect(() => {
    setSelectedClinicId(clinicId || '');
  }, [clinicId]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const animalData = {
        ...formData,
        clinicId: selectedClinicId,
        weightKg: formData.weightKg ? parseFloat(formData.weightKg) : undefined,
        heightCm: formData.heightCm ? parseInt(formData.heightCm) : undefined,
        isSterilized: formData.isSterilized,
        isNac: formData.isNac,
      };

      await animalsService.createAnimal(animalData);
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        name: '',
        birthdate: '',
        species: '',
        breed: '',
        sex: 'UNKNOWN',
        isSterilized: false,
        color: '',
        chipId: '',
        weightKg: '',
        heightCm: '',
        isNac: false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true">
      <div 
        ref={dialogRef}
        className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
        role="document"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold" id="add-animal-title">Ajouter un animal</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} aria-labelledby="add-animal-title">
          <div className="space-y-4">
            {/* Clinic selection */}
            <div>
              <label htmlFor="clinicId" className="block text-sm font-medium text-gray-700 mb-1">
                Clinique * <span className="sr-only">(obligatoire)</span>
              </label>
              <select
                id="clinicId"
                name="clinicId"
                value={selectedClinicId}
                onChange={(e) => setSelectedClinicId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sélectionner une clinique…</option>
                {clinics.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.postcode} {c.city}
                  </option>
                ))}
              </select>
            </div>

            {/* Name - Required */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nom * <span className="sr-only">(obligatoire)</span>
              </label>
              <input
                ref={firstFocusableRef}
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-describedby="name-error"
              />
            </div>

            {/* Birthdate */}
            <div>
              <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700 mb-1">
                Date de naissance
              </label>
              <input
                type="date"
                id="birthdate"
                name="birthdate"
                value={formData.birthdate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Species */}
            <div>
              <label htmlFor="species" className="block text-sm font-medium text-gray-700 mb-1">
                Espèce
              </label>
              <input
                type="text"
                id="species"
                name="species"
                value={formData.species}
                onChange={handleInputChange}
                placeholder="ex: chien, chat, lapin"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Breed */}
            <div>
              <label htmlFor="breed" className="block text-sm font-medium text-gray-700 mb-1">
                Race
              </label>
              <input
                type="text"
                id="breed"
                name="breed"
                value={formData.breed}
                onChange={handleInputChange}
                placeholder="ex: Labrador, Persan"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Sex */}
            <div>
              <label htmlFor="sex" className="block text-sm font-medium text-gray-700 mb-1">
                Sexe
              </label>
              <select
                id="sex"
                name="sex"
                value={formData.sex}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="UNKNOWN">Non déterminé</option>
                <option value="MALE">Mâle</option>
                <option value="FEMALE">Femelle</option>
              </select>
            </div>

            {/* Color */}
            <div>
              <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
                Couleur
              </label>
              <input
                type="text"
                id="color"
                name="color"
                value={formData.color}
                onChange={handleInputChange}
                placeholder="ex: noir, blanc, roux"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Chip ID */}
            <div>
              <label htmlFor="chipId" className="block text-sm font-medium text-gray-700 mb-1">
                Numéro de puce
              </label>
              <input
                type="text"
                id="chipId"
                name="chipId"
                value={formData.chipId}
                onChange={handleInputChange}
                placeholder="ex: 250269604000000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Weight */}
            <div>
              <label htmlFor="weightKg" className="block text-sm font-medium text-gray-700 mb-1">
                Poids (kg)
              </label>
              <input
                type="number"
                id="weightKg"
                name="weightKg"
                value={formData.weightKg}
                onChange={handleInputChange}
                min="0"
                max="1000"
                step="0.1"
                placeholder="ex: 25.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Height */}
            <div>
              <label htmlFor="heightCm" className="block text-sm font-medium text-gray-700 mb-1">
                Taille (cm)
              </label>
              <input
                type="number"
                id="heightCm"
                name="heightCm"
                value={formData.heightCm}
                onChange={handleInputChange}
                min="0"
                max="300"
                placeholder="ex: 55"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Checkboxes */}
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isSterilized"
                  name="isSterilized"
                  checked={formData.isSterilized}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isSterilized" className="ml-2 block text-sm text-gray-700">
                  Stérilisé(e)
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isNac"
                  name="isNac"
                  checked={formData.isNac}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isNac" className="ml-2 block text-sm text-gray-700">
                  NAC (Nouveaux Animaux de Compagnie)
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={loading || !selectedClinicId}
            >
              {loading ? 'Création...' : 'Créer l\'animal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
