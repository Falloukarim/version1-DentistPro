'use client';
import { FiArrowLeft, FiSave, FiPrinter, FiX, FiBluetooth } from 'react-icons/fi';
import Link from 'next/link';
import { addTreatment, getConsultationById } from '../../../action';
import { Button } from '@/components/ui/button';
import { use, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  connectToPrinter, 
  printTreatmentTicket, 
  disconnectPrinter, 
  isPrinterConnected, 
  getPrinterStatus,
  PrinterStatus,
  isBluetoothAvailable
} from '@/lib/bluetoothPrinter';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="gap-2 transition-all duration-300 ease-in-out"
    >
      {pending ? (
        <>
          <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          Enregistrement...
        </>
      ) : (
        <>
          <FiSave />
          Enregistrer
        </>
      )}
    </Button>
  );
}

// Définir le type pour l'état qui correspond à ce que retourne addTreatment
interface TreatmentState {
  error?: string;
  success?: boolean;
  id?: string;
}

export default function AddTreatment({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [consultation, setConsultation] = useState<any>(null);
  const [state, formAction] = useActionState<TreatmentState, FormData>(addTreatment, {});
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const [printerStatus, setPrinterStatus] = useState<PrinterStatus>({ 
    isConnected: false, 
    printerName: null,
    device: null,
    bluetoothAvailable: false
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [formValues, setFormValues] = useState({
    type: '',
    amount: 0,
    paidAmount: 0,
    status: 'UNPAID' as 'UNPAID' | 'PAID' | 'PARTIAL'
  });

  useEffect(() => {
    setIsClient(true);
    const fetchConsultation = async () => {
      try {
        const data = await getConsultationById(id);
        setConsultation(data);
      } catch (error) {
        console.error('Failed to load consultation:', error);
      }
    };
    fetchConsultation();
    
    updatePrinterStatus();
  }, [id]);

  const updatePrinterStatus = () => {
    setPrinterStatus(getPrinterStatus());
  };

  const handleConnectPrinter = async () => {
    if (!isBluetoothAvailable()) {
      alert('API Bluetooth non disponible. Utilisez Chrome ou Edge sur Android/Windows.');
      return;
    }

    setIsConnecting(true);
    try {
      await connectToPrinter();
      updatePrinterStatus();
    } catch (error) {
      console.error('Failed to connect to printer:', error);
      alert(`Erreur de connexion: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectPrinter = () => {
    disconnectPrinter();
    updatePrinterStatus();
  };

  const handlePrintTicket = async () => {
    if (!consultation || !consultation.clinic) {
      alert('Données de consultation incomplètes');
      return;
    }
    
    try {
      const remainingAmount = formValues.amount - formValues.paidAmount;
      
      await printTreatmentTicket(
        {
          name: consultation.clinic.name || 'Clinique Dentaire',
          address: consultation.clinic.address || '',
          phone: consultation.clinic.phone || ''
        },
        {
          patientName: consultation.patientName,
          patientPhone: consultation.patientPhone,
          date: new Date().toLocaleString('fr-FR'),
          treatmentType: formValues.type,
          amount: formValues.amount,
          paidAmount: formValues.paidAmount,
          remainingAmount: remainingAmount,
          status: formValues.status
        }
      );
      
      alert('Ticket imprimé avec succès!');
    } catch (error) {
      console.error('Print error:', error);
      alert(`Erreur d'impression: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: name === 'amount' || name === 'paidAmount' ? Number(value) : value
    }));
  };

  // Cette fonction est maintenant compatible avec useActionState
  const handleFormSubmit = (formData: FormData) => {
    const type = formData.get('type') as string;
    const amount = Number(formData.get('amount'));
    const paidAmount = Number(formData.get('paidAmount') || 0);
    const status = formData.get('status') as 'UNPAID' | 'PAID' | 'PARTIAL';
    
    setFormValues({ type, amount, paidAmount, status });
    formData.append('consultationId', consultation.id);
    
    return formAction(formData);
  };

  if (!consultation) {
    return (
      <div className="p-6 max-w-lg mx-auto bg-white rounded-lg shadow-lg border animate-pulse">
        <div className="flex justify-center items-center h-40">
          <span className="inline-block h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow-md border space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/consultations/${consultation.id}`}>
            <FiArrowLeft size={20} />
          </Link>
        </Button>
        <h2 className="text-3xl font-semibold text-gray-800">Ajouter un Traitement</h2>
      </div>

      {/* Status Bluetooth */}
      <div className={`p-4 rounded-lg flex items-center justify-between ${
        !printerStatus.bluetoothAvailable ? 'bg-destructive/10 text-destructive' :
        printerStatus.isConnected ? 'bg-success/10 text-success' : 'bg-muted'
      }`}>
        <div className="flex items-center">
          <FiBluetooth className="mr-2" />
          <span>
            {!printerStatus.bluetoothAvailable 
              ? 'Bluetooth non disponible (Chrome/Edge requis)'
              : printerStatus.isConnected 
                ? `Imprimante: ${printerStatus.printerName || 'Connectée'}`
                : 'Imprimante non connectée'}
          </span>
        </div>
        
        {printerStatus.bluetoothAvailable && (
          printerStatus.isConnected ? (
            <Button variant="outline" size="sm" onClick={handleDisconnectPrinter}>
              Déconnecter
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleConnectPrinter}
              disabled={isConnecting}
            >
              {isConnecting ? 'Connexion...' : 'Connecter imprimante'}
            </Button>
          )
        )}
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="font-semibold text-blue-900">
          👤 Patient : {consultation.patientName}
        </p>
        <p className="text-sm text-blue-800">
          🗓️ Consultation du : {new Date(consultation.date).toLocaleDateString()}
        </p>
        {consultation.clinic && (
          <p className="text-sm text-blue-800">
            🏥 Clinique : {consultation.clinic.name}
          </p>
        )}
      </div>

      <form action={handleFormSubmit} className="space-y-5">
        <input type="hidden" name="consultationId" value={consultation.id} />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type de traitement <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="type"
            required
            minLength={3}
            className="w-full px-4 py-2 border rounded-md bg-gray-50 focus:ring-2 focus:ring-primary focus:outline-none"
            placeholder="Ex: Détartrage, Extraction..."
            onChange={handleInputChange}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Montant total (FCFA) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="amount"
              required
              min="0"
              step="500"
              className="w-full px-4 py-2 border rounded-md bg-gray-50 focus:ring-2 focus:ring-primary focus:outline-none"
              placeholder="10000"
              onChange={handleInputChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Montant payé (FCFA)
            </label>
            <input
              type="number"
              name="paidAmount"
              min="0"
              step="500"
              className="w-full px-4 py-2 border rounded-md bg-gray-50 focus:ring-2 focus:ring-primary focus:outline-none"
              placeholder="5000"
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Statut de paiement <span className="text-red-500">*</span>
          </label>
          <select
            name="status"
            required
            className="w-full px-4 py-2 border rounded-md bg-gray-50 focus:ring-2 focus:ring-primary focus:outline-none"
            onChange={handleInputChange}
          >
            <option value="UNPAID">Non payé</option>
            <option value="PAID">Payé</option>
            <option value="PARTIAL">Partiel</option>
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button asChild variant="outline">
            <Link href={`/consultations/${consultation.id}`}>
              <FiX className="mr-2" />
              Annuler
            </Link>
          </Button>
          <SubmitButton />
        </div>
      </form>

      {state?.success && isClient && (
        <div className="mt-6 p-5 rounded-lg border border-green-300 bg-green-50 animate-fade-in">
          <p className="text-green-700 font-semibold mb-4">
            ✅ Traitement enregistré avec succès !
          </p>

          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href={`/consultations/${consultation.id}`}>
                <FiX className="mr-2" />
                Retour à la consultation
              </Link>
            </Button>

            <Button 
              onClick={handlePrintTicket}
              disabled={!printerStatus.isConnected}
              className="flex items-center gap-2"
            >
              <FiPrinter className="mr-2" />
              Imprimer le ticket
            </Button>

            <Button asChild variant="secondary">
              <Link href={`/print/treatment/${state.id}`} target="_blank">
                <FiPrinter className="mr-2" />
                Voir le ticket
              </Link>
            </Button>
          </div>
          
          {!printerStatus.isConnected && (
            <p className="mt-3 text-sm text-muted-foreground">
              Connectez une imprimante Bluetooth pour imprimer le ticket
            </p>
          )}
        </div>
      )}

      {state?.error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg border border-red-300">
          <p className="font-medium">❌ Erreur : {state.error}</p>
        </div>
      )}
    </div>
  );
}