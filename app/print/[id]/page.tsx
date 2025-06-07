'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function PrintPage() {
  const [content, setContent] = useState('')
  const router = useRouter()
  const params = useParams() // Utilisez useParams() au lieu de recevoir params en props

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/consultations/${params.id}`) // Notez le pluriel "consultations"
        if (!res.ok) throw new Error('Failed to fetch')
        
        const consultation = await res.json()

        const ticket = `
=== ${consultation.clinic.name} ===
${consultation.clinic.address || ''}
Tél: ${consultation.clinic.phone || ''}

Date: ${new Date(consultation.date).toLocaleString('fr-FR')}
Patient: ${consultation.patientName}
Téléphone: ${consultation.patientPhone}

Dentiste: ${consultation.dentist?.firstName || ''} ${consultation.dentist?.lastName || ''}
Montant: ${consultation.payments?.[0]?.amount || 0} FCFA

${consultation.description || ''}
        `.trim()

        setContent(ticket)
      } catch (err) {
        console.error(err)
        router.push('/404')
      }
    }

    if (params.id) {
      fetchData()
    }
  }, [params.id, router]) // params.id est maintenant correctement utilisé

  return (
    <div className="p-4 font-mono whitespace-pre-wrap">
      {content || 'Chargement...'}
      <div className="mt-8 text-center text-xs">Merci de votre visite</div>

      <div className="no-print mt-6 text-center">
      <a
  href={`rawbt://${window.location.host}/print/${params.id}`}
  className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
>
  🖨️ Imprimer via RawBT
</a>

      </div>
    </div>
  )
}