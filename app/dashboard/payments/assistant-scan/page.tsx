'use client';
import { useAuth } from "@clerk/nextjs";
import { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Loader2, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AssistantScanPage() {
  const { getToken, isLoaded, userId } = useAuth();
  const [paymentData, setPaymentData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'completed' | 'failed'>('idle');
  const router = useRouter();

  useEffect(() => {
    console.log('Payment data changed:', paymentData);
  }, [paymentData]);

  useEffect(() => {
    console.log('Error changed:', error);
  }, [error]);

  const startPayment = async (method: 'wave' | 'orange_money') => {
    try {
      setIsLoading(true);
      setError(null);
      setPaymentStatus('pending');
      setPaymentData(null);
      
      console.log(`Initiating ${method} payment...`);
      const token = await getToken();
      
      if (!token || !userId) {
        throw new Error('Authentification requise');
      }

      const response = await fetch('/api/payments/generate-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: 5000,
          notes: `Paiement via ${method}`,
          paymentMethod: method,
          consultationId: null,
          treatmentId: null
        })
      });

      const data = await response.json();
      console.log('Payment API response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Échec de la création du paiement');
      }

      if (!data.payment_url) {
        throw new Error('URL de paiement non reçue');
      }

      setPaymentData(data);
      setPaymentStatus('pending');
      
      if (data.token) {
        pollPaymentStatus(data.token);
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Erreur lors du paiement');
      setPaymentStatus('failed');
    } finally {
      setIsLoading(false);
    }
  };

  const pollPaymentStatus = async (token: string) => {
    console.log(`Starting polling for token: ${token}`);
    let attempts = 0;
    const maxAttempts = 30;
    
    const interval = setInterval(async () => {
      attempts++;
      console.log(`Polling attempt ${attempts}`);
      
      try {
        const res = await fetch(`/api/payments/status?token=${token}`);
        const data = await res.json();

        if (data.status === 'completed') {
          clearInterval(interval);
          setPaymentStatus('completed');
          console.log('Payment completed!');
          setTimeout(() => router.push('/dashboard/payments'), 2000);
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          setPaymentStatus('failed');
          setError('Délai dépassé - Paiement non confirmé');
          console.log('Polling timeout');
        }
      } catch (err) {
        console.error('Polling error:', err);
        clearInterval(interval);
        setPaymentStatus('failed');
        setError('Erreur de vérification du statut');
      }
    }, 5000);

    return () => clearInterval(interval);
  };

  const renderPaymentStatus = () => {
    switch (paymentStatus) {
      case 'pending':
        return (
          <div className="flex items-center gap-2 text-yellow-600">
            <RefreshCw className="animate-spin h-5 w-5" />
            <span>En attente de paiement...</span>
          </div>
        );
      case 'completed':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span>Paiement confirmé! Redirection en cours...</span>
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            <span>Échec du paiement</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Paiement Mobile Money</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => startPayment('wave')}
            disabled={isLoading || !isLoaded}
            className={`flex-1 py-3 px-4 rounded-md text-white font-medium ${
              isLoading ? 'bg-gray-400' : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin h-5 w-5" />
                Chargement...
              </span>
            ) : (
              'Wave Money'
            )}
          </button>
          <button
            onClick={() => startPayment('orange_money')}
            disabled={isLoading || !isLoaded}
            className={`flex-1 py-3 px-4 rounded-md text-white font-medium ${
              isLoading ? 'bg-gray-400' : 'bg-orange-500 hover:bg-orange-600'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin h-5 w-5" />
                Chargement...
              </span>
            ) : (
              'Orange Money'
            )}
          </button>
        </div>

        {error && (
          <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-md border border-red-200">
            <p className="font-medium">Erreur :</p>
            <p>{error}</p>
            {process.env.NODE_ENV === 'development' && (
              <button 
                onClick={() => setError(null)}
                className="mt-2 text-sm text-blue-600 hover:underline"
              >
                Réessayer
              </button>
            )}
          </div>
        )}

        {renderPaymentStatus()}

        {paymentData && (
          <div className="border rounded-lg p-6 bg-gray-50 mt-4 animate-fade-in">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-1 flex flex-col items-center">
                {paymentData.qr_code ? (
                  <img 
                    src={paymentData.qr_code} 
                    alt="QR Code de paiement"
                    className="w-full max-w-xs border border-gray-200 rounded-lg"
                  />
                ) : (
                  <div className="border border-gray-200 rounded-lg p-4 bg-white">
                    <QRCodeCanvas
                      value={paymentData.payment_url} 
                      size={256}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                )}
                <p className="mt-2 text-sm text-gray-500">
                  {paymentData.method === 'wave' ? 'Scanner avec Wave' : 'Scanner avec Orange Money'}
                </p>
              </div>
              
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-4">Détails du paiement</h2>
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-md border">
                    <p className="font-medium">Montant :</p>
                    <p className="text-2xl font-bold">{paymentData.amount} FCFA</p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-md border">
                    <p className="font-medium mb-2">Instructions :</p>
                    <ol className="list-decimal pl-5 space-y-1">
                      <li>Ouvrez l'application {paymentData.method === 'wave' ? 'Wave' : 'Orange Money'}</li>
                      <li>Sélectionnez "Payer" ou "Scanner QR Code"</li>
                      <li>Autorisez le paiement lorsque demandé</li>
                    </ol>
                  </div>

                  <div className="bg-white p-4 rounded-md border">
                    <p className="font-medium mb-2">Lien de paiement :</p>
                    <a 
                      href={paymentData.payment_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all text-sm"
                    >
                      {paymentData.payment_url}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}