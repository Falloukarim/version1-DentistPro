'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  connectToPrinter, 
  printConsultationTicket, 
  disconnectPrinter, 
  isPrinterConnected, 
  getPrinterStatus,
  PrinterStatus // Import du type
} from '@/lib/bluetoothPrinter';
export default function PrintPage() {
  const [content, setContent] = useState('')
  const [consultation, setConsultation] = useState<any>(null)
  const router = useRouter()
  const params = useParams()
   const [printerStatus, setPrinterStatus] = useState<PrinterStatus>({ 
    isConnected: false, 
    printerName: null,
    device: null,
    bluetoothAvailable: false
  });
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/consultations/${params.id}`)
        if (!res.ok) throw new Error('Échec de récupération')

        const consultationData = await res.json()
        setConsultation(consultationData)
        
        const clinic = consultationData.clinic
        const ticket = `
 
=== ${clinic.name?.toUpperCase()} ===
${clinic.address || ''}
Tél: ${clinic.phone || ''}

--- CONSULTATION ---
Date: ${new Date(consultationData.date).toLocaleString('fr-FR')}
Patient: ${consultationData.patientName}
Téléphone: ${consultationData.patientPhone}

Dentiste: ${consultationData.dentist?.firstName || ''} ${consultationData.dentist?.lastName || ''}
Montant: ${consultationData.payments?.[0]?.amount || 0} FCFA

${consultationData.description || ''}

----------------------------
Merci de votre visite
`.trim()

        setContent(ticket)
      } catch (err) {
        console.error(err)
        router.push('/404')
      }
    }

    if (params.id) {
      fetchData()
      updatePrinterStatus()
    }
  }, [params.id, router])

  const updatePrinterStatus = () => {
    setPrinterStatus(getPrinterStatus())
  }

  const handleConnectPrinter = async () => {
    setIsConnecting(true)
    try {
      await connectToPrinter()
      updatePrinterStatus()
    } catch (error) {
      console.error('Failed to connect to printer:', error)
      alert(`Erreur de connexion: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnectPrinter = () => {
    disconnectPrinter()
    updatePrinterStatus()
  }

  const handlePrintTicket = async () => {
    if (!consultation) return
    
    try {
      await printConsultationTicket(
        consultation.clinic,
        {
          date: consultation.date,
          patientName: consultation.patientName,
          patientPhone: consultation.patientPhone,
          dentist: consultation.dentist,
          amount: consultation.payments?.[0]?.amount || 0,
          description: consultation.description
        }
      )
      
      alert('Ticket imprimé avec succès!')
    } catch (error) {
      console.error('Print error:', error)
      alert(`Erreur d'impression: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
  }

  return (
    <div className="p-4 font-mono whitespace-pre-wrap text-sm">
      <style>{`
        @media print {
          .no-print {
            display: none;
          }
        }
      `}</style>

      {content || 'Chargement...'}

      <div className="mt-8 text-center text-xs">Merci de votre confiance</div>

      <div className="no-print mt-6 space-y-4">
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center">
            <span className="mr-2">Imprimante Bluetooth:</span>
            <span className="font-medium">
              {printerStatus.isConnected 
                ? (printerStatus.printerName || 'Connectée') 
                : 'Non connectée'}
            </span>
          </div>
          
          {printerStatus.isConnected ? (
            <button 
              onClick={handleDisconnectPrinter}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              Déconnecter
            </button>
          ) : (
            <button 
              onClick={handleConnectPrinter}
              disabled={isConnecting}
              className="px-3 py-1 bg-blue-100 rounded hover:bg-blue-200 disabled:opacity-50"
            >
              {isConnecting ? 'Connexion...' : 'Connecter'}
            </button>
          )}
        </div>

        <button
          onClick={handlePrintTicket}
          disabled={!printerStatus.isConnected}
          className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          🖨️ Imprimer via Bluetooth
        </button>

        <button
          onClick={() => window.print()}
          className="w-full py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          📄 Imprimer via navigateur
        </button>
      </div>
    </div>
  )
}