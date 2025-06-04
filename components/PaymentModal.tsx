// components/PaymentModal.tsx
'use client';

import { useState } from 'react';
import { FiX, FiDollarSign, FiCheck } from 'react-icons/fi';

interface PaymentModalProps {
  type: 'consultation' | 'treatment';
  maxAmount: number;
  onClose: () => void;
  onSubmit: (amount: number, paymentMethod: string) => Promise<void>;
}

export default function PaymentModal({ type, maxAmount, onClose, onSubmit }: PaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum)) {
      setError('Veuillez entrer un montant valide');
      setIsSubmitting(false);
      return;
    }
    
    if (amountNum <= 0) {
      setError('Le montant doit être supérieur à 0');
      setIsSubmitting(false);
      return;
    }
    
    if (amountNum > maxAmount) {
      setError(`Le montant ne peut pas dépasser ${maxAmount.toLocaleString()} FCFA`);
      setIsSubmitting(false);
      return;
    }
    
    try {
      await onSubmit(amountNum, paymentMethod);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FiDollarSign className="text-blue-500" />
            {type === 'consultation' ? 'Paiement Consultation' : 'Paiement Traitement'}
          </h3>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700"
            disabled={isSubmitting}
          >
            <FiX size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Montant (FCFA) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError('');
                }}
                placeholder={`Maximum ${maxAmount.toLocaleString()} FCFA`}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400"
                required
                autoFocus
                step="100"
                min="0"
                max={maxAmount}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Méthode de paiement <span className="text-red-500">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400"
                required
              >
                <option value="CASH">Espèces</option>
                <option value="CARD">Carte bancaire</option>
                <option value="TRANSFER">Virement</option>
                <option value="CHECK">Chèque</option>
              </select>
            </div>
            
            {error && (
              <div className="text-red-500 text-sm py-2 px-3 bg-red-50 rounded-md">
                {error}
              </div>
            )}
            
            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={isSubmitting || !amount}
              >
                {isSubmitting ? (
                  'Enregistrement...'
                ) : (
                  <>
                    <FiCheck />
                    Enregistrer
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}