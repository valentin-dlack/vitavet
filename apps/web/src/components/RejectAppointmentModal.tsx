import { useState, useRef, useEffect } from 'react';

interface RejectAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReject: (rejectionReason: string) => Promise<void>;
  appointmentId: string;
  appointmentDetails?: {
    animalName?: string;
    ownerName?: string;
    date?: string;
  };
}

export function RejectAppointmentModal({
  isOpen,
  onClose,
  onReject,
  appointmentDetails,
}: RejectAppointmentModalProps) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      textareaRef.current?.focus();
    }
  }, [isOpen]);

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
    if (!rejectionReason.trim()) {
      setError('La raison du rejet est obligatoire');
      return;
    }

    if (rejectionReason.trim().length < 10) {
      setError('La raison du rejet doit contenir au moins 10 caractères');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onReject(rejectionReason.trim());
      onClose();
      setRejectionReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du rejet');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setRejectionReason('');
      setError(null);
    }
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
          <h2 className="text-xl font-semibold" id="reject-appointment-title">Rejeter le rendez-vous</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            aria-label="Fermer"
            disabled={loading}
          >
            ×
          </button>
        </div>

        {appointmentDetails && (
          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <div className="text-sm text-gray-600">
              <div><strong>Animal:</strong> {appointmentDetails.animalName || '—'}</div>
              <div><strong>Propriétaire:</strong> {appointmentDetails.ownerName || '—'}</div>
              <div><strong>Date:</strong> {appointmentDetails.date || '—'}</div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} aria-labelledby="reject-appointment-title">
          <div className="mb-4">
            <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 mb-2">
              Raison du rejet *
            </label>
            <textarea
              ref={textareaRef}
              id="rejectionReason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              required
              minLength={10}
              maxLength={500}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Expliquez la raison du rejet (minimum 10 caractères)..."
              disabled={loading}
            />
            <div className="mt-1 text-xs text-gray-500">
              {rejectionReason.length}/500 caractères (minimum 10)
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
              disabled={loading || rejectionReason.trim().length < 10}
            >
              {loading ? 'Rejet en cours...' : 'Rejeter le RDV'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
