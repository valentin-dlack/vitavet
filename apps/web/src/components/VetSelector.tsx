import React, { useState, useEffect } from 'react';
import { clinicsService, type Vet } from '../services/clinics.service';
import './VetSelector.css';

interface VetSelectorProps {
  clinicId: string;
  selectedVetId?: string;
  onVetSelect: (vetId: string | undefined) => void;
  disabled?: boolean;
}

export const VetSelector: React.FC<VetSelectorProps> = ({
  clinicId,
  selectedVetId,
  onVetSelect,
  disabled = false,
}) => {
  const [vets, setVets] = useState<Vet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVets = async () => {
      if (!clinicId) return;

      setLoading(true);
      setError(null);

      try {
        const vetsData = await clinicsService.getVetsByClinic(clinicId);
        setVets(vetsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load vets');
        console.error('Error fetching vets:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVets();
  }, [clinicId]);

  const handleVetChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    onVetSelect(value === '' ? undefined : value);
  };

  if (loading) {
    return (
      <div className="vet-selector">
        <label htmlFor="vet-select" className="vet-selector__label">
          Vétérinaire
        </label>
        <div className="vet-selector__loading">Chargement des vétérinaires...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="vet-selector">
        <label htmlFor="vet-select" className="vet-selector__label">
          Vétérinaire
        </label>
        <div className="vet-selector__error">
          Erreur: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="vet-selector">
      <label htmlFor="vet-select" className="vet-selector__label">
        Vétérinaire
      </label>
      <select
        id="vet-select"
        value={selectedVetId || ''}
        onChange={handleVetChange}
        disabled={disabled || vets.length === 0}
        className="vet-selector__select"
        aria-describedby="vet-select-help"
      >
        <option value="">Tous les vétérinaires</option>
        {vets.map((vet) => (
          <option key={vet.id} value={vet.id}>
            {vet.firstName} {vet.lastName}
            {vet.specialty && ` - ${vet.specialty}`}
          </option>
        ))}
      </select>
      <div id="vet-select-help" className="vet-selector__help">
        Sélectionnez un vétérinaire pour filtrer les créneaux disponibles
      </div>
    </div>
  );
};
