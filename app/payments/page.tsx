'use client';

import { FiArrowLeft, FiDollarSign, FiCheck, FiCircle, FiUser, FiFilter } from "react-icons/fi";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getPaymentHistory } from "./action";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import ErrorAlert from "../../components/ErrorAlert";

interface Payment {
  id: string;
  amount: number;
  paymentMethod: string;
  paymentDate: Date;
  reference?: string;
  notes?: string;
  consultation?: {
    id: string;
    patientName: string;
    patientPhone: string;
    date: Date;
  };
  treatment?: {
    id: string;
    type: string;
    amount: number;
  };
  createdBy: {
    firstName: string;
    lastName: string;
  };
}

export default function PaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'consultations' | 'treatments'>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getPaymentHistory();
        console.log('Fetched payments:', data); // Log pour vérifier les données
        setPayments(data || []); // Assurez-vous que payments est toujours un tableau
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err instanceof Error ? err.message : "Une erreur est survenue");
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, []);

  const clearError = () => setError(null);

  const filteredPayments = payments.filter(payment => {
    if (filter === 'all') return true;
    if (filter === 'consultations') return !!payment.consultation;
    if (filter === 'treatments') return !!payment.treatment;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto bg-background">
      {error && <ErrorAlert message={error} onClose={clearError} />}

      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.back()} 
            className="text-gray-500 hover:text-gray-700"
          >
            <FiArrowLeft size={20} />
          </button>
          <h2 className="text-2xl font-bold text-gray-300">
            <FiDollarSign className="inline mr-2 text-blue-500" />
            Historique des Paiements
          </h2>
        </div>
        
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
          >
            <option value="all">Tous les paiements</option>
            <option value="consultations">Consultations</option>
            <option value="treatments">Traitements</option>
          </select>
        </div>
      </div>

      <div className="bg-background rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredPayments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Détails
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Méthode
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enregistré par
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      {payment.consultation ? (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                          Consultation
                        </span>
                      ) : (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                          Traitement
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-blue-600">
                        {payment.consultation ? (
                          <>
                            <Link 
                              href={`/consultations/${payment.consultation.id}`}
                              className="text-blue-600 hover:underline"
                            >
                              {payment.consultation.patientName}
                            </Link>
                            <div className="text-xs text-gray-300">
                              {new Date(payment.consultation.date).toLocaleDateString()}
                            </div>
                          </>
                        ) : payment.treatment ? (
                          <>
                            <div>{payment.treatment.type}</div>
                            <div className="text-xs text-gray-300">
                              {payment.treatment.amount.toLocaleString()} FCFA
                            </div>
                          </>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-300">
                      {payment.amount.toLocaleString()} FCFA
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {payment.paymentMethod === 'CASH' ? 'Espèces' : 
                       payment.paymentMethod === 'CARD' ? 'Carte' : 
                       payment.paymentMethod === 'TRANSFER' ? 'Virement' : 
                       'Autre'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                      {new Date(payment.paymentDate).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                      {payment.createdBy.firstName} {payment.createdBy.lastName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <FiDollarSign className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              Aucun paiement enregistré
            </h3>
            <p className="mt-1 text-gray-500">
              Les paiements apparaîtront ici une fois enregistrés
            </p>
          </div>
        )}
      </div>
    </div>
  );
}