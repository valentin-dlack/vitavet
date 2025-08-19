import React, { useState } from 'react';
import { authService, type DeleteAccountData } from '../services/auth.service';

interface DeleteAccountFormProps {
  onSuccess: (message: string) => void;
  onError: (error: string) => void;
}

const DeleteAccountForm: React.FC<DeleteAccountFormProps> = ({ onSuccess, onError }) => {
  const [formData, setFormData] = useState<DeleteAccountData>({
    reason: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await authService.requestAccountDeletion(formData);
      onSuccess(result.message);
      // Reset form
      setFormData({
        reason: '',
        password: '',
      });
      setShowConfirmation(false);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to request account deletion');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleConfirmClick = () => {
    if (formData.reason.length >= 10) {
      setShowConfirmation(true);
    } else {
      onError('Veuillez fournir une raison d\'au moins 10 caractères');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-red-400 text-xl">⚠️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Demande de suppression de compte
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>
                Cette action est irréversible. Toutes vos données personnelles seront supprimées 
                conformément au droit à l'oubli (RGPD). Vous recevrez une confirmation par email 
                une fois la demande traitée.
              </p>
            </div>
          </div>
        </div>
      </div>

      {!showConfirmation ? (
        <form className="space-y-4">
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
              Raison de la suppression *
            </label>
            <textarea
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Veuillez expliquer la raison de votre demande de suppression..."
              required
              minLength={10}
              maxLength={500}
            />
            <p className="mt-1 text-sm text-gray-500">
              Minimum 10 caractères, maximum 500 caractères
            </p>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Mot de passe *
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Confirmez votre mot de passe pour valider la demande
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleConfirmClick}
              disabled={!formData.reason || !formData.password || formData.reason.length < 10}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continuer
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-yellow-400 text-xl">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Confirmation finale
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Êtes-vous sûr de vouloir demander la suppression de votre compte ? 
                    Cette action ne peut pas être annulée.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Résumé de votre demande :</h4>
            <p className="text-sm text-gray-600 mb-2">
              <strong>Raison :</strong> {formData.reason}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Date de soumission :</strong> {new Date().toLocaleString('fr-FR')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowConfirmation(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Envoi...' : 'Confirmer la demande'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default DeleteAccountForm;
