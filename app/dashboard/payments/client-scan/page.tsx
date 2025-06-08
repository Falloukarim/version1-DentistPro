'use client';

import { useAuth } from "@clerk/nextjs";
import { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

export default function ClientScanPage() {
  const { isLoaded, getToken } = useAuth();
  const [qrData, setQrData] = useState<{
    qr_code: string | null;
    payment_url: string;
    token: string;
    amount: number;
    payment_id: string;
    method: string;
  } | null>(null);
  const [error, setError] = useState('');

  const generateQR = async () => {
    if (!isLoaded) {
      setError('Session non chargée');
      return;
    }

    try {
      setError('');
      const token = await getToken();

      const res = await fetch('/api/payments/generate-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: 1000 // Montant de test
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erreur API');
      }

      const data = await res.json();
      setQrData(data);
    } catch (err: any) {
      setError(err.message || 'Erreur inconnue');
      console.error('Erreur:', err);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <button
        onClick={generateQR}
        className="bg-blue-500 text-white px-4 py-2 rounded w-full"
        disabled={!isLoaded}
      >
        {isLoaded ? 'Générer QR Code' : 'Chargement...'}
      </button>

      {error && (
        <div className="mt-2 text-red-500 text-sm">
          {error}
        </div>
      )}

      {qrData && (
        <div className="mt-6 text-center">
          <h2 className="text-lg font-semibold mb-2">QR Code de paiement</h2>
          {qrData.qr_code ? (
            <img
              src={qrData.qr_code}
              alt="QR Code de paiement"
              className="mx-auto border border-gray-200 rounded-lg"
            />
          ) : (
            <QRCodeCanvas
              value={qrData.payment_url}
              size={256}
              level="H"
              includeMargin={true}
              className="mx-auto"
            />
          )}
        </div>
      )}
    </div>
  );
}
