'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function PrintPage() {
  const [content, setContent] = useState('')
  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/consultations/${params.id}`)
        if (!res.ok) throw new Error('Échec de récupération')

        const consultation = await res.json()
        const clinic = consultation.clinic

        const ticket = `
 
=== ${clinic.name?.toUpperCase()} ===
${clinic.address || ''}
Tél: ${clinic.phone || ''}

--- CONSULTATION ---
Date: ${new Date(consultation.date).toLocaleString('fr-FR')}
Patient: ${consultation.patientName}
Téléphone: ${consultation.patientPhone}

Dentiste: ${consultation.dentist?.firstName || ''} ${consultation.dentist?.lastName || ''}
Montant: ${consultation.payments?.[0]?.amount || 0} FCFA

${consultation.description || ''}

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
    }
  }, [params.id, router])

  const rawbtLink =
    typeof window !== 'undefined'
      ? `rawbt://${window.location.origin}/print/${params.id}`
      : '#'

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

      <div className="no-print mt-6 text-center">
        <a
          href={rawbtLink}
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          🖨️ Imprimer via RawBT
        </a>
      </div>
    </div>
  )
}
