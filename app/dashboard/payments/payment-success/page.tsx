'use client';
import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';

export default function PaymentSuccess() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token');

  useEffect(() => {
    console.log('Paiement réussi, token:', token);
    
    // Redirection après 5 secondes
    const timer = setTimeout(() => {
      router.push('/dashboard/payments');
    }, 5000);

    return () => clearTimeout(timer);
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Paiement Réussi!</h1>
        <p className="text-gray-600 mb-4">
          Votre paiement a été traité avec succès.
        </p>
        {token && (
          <p className="text-sm text-gray-500">
            Référence: {token}
          </p>
        )}
        <p className="mt-4 text-sm text-gray-500">
          Redirection automatique dans 5 secondes...
        </p>
      </div>
    </div>
  );
}