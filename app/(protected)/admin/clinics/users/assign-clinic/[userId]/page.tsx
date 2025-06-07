'use client'

import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'
import { FiArrowLeft } from 'react-icons/fi'

export default function AssignClinicPage() {
  const { userId } = useParams()
  const [clinics, setClinics] = useState<{id: string, name: string}[]>([])
  const [selectedClinic, setSelectedClinic] = useState('')
  const [loading, setLoading] = useState(false)
  const { getToken } = useAuth()
  const router = useRouter()

  // Récupérer la liste des cliniques
  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const token = await getToken()
        const res = await fetch('/api/admin/clinics', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()
        setClinics(data)
      } catch (error) {
        toast.error('Erreur de chargement des cliniques')
      }
    }
    fetchClinics()
  }, [])

  // Assigner l'utilisateur à la clinique
  const assignClinic = async () => {
    if (!selectedClinic) {
      toast.error('Veuillez sélectionner une clinique')
      return
    }

    setLoading(true)
    try {
      const token = await getToken()
      const res = await fetch('/api/admin/users/assign-clinic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          clerkUserId: userId,
          clinicId: selectedClinic
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || "Échec de l'assignation")
      }

      toast.success('Utilisateur assigné avec succès')
      router.push('/admin/clinics/users')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <Link 
        href="/admin/clinics/users" 
        className="flex items-center gap-2 mb-6 text-sm text-muted-foreground hover:text-primary"
      >
        <FiArrowLeft /> Retour à la liste des utilisateurs
      </Link>

      <h1 className="text-2xl font-bold mb-6">Assigner à une clinique</h1>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label>Clinique *</Label>
          <Select 
            value={selectedClinic}
            onValueChange={setSelectedClinic}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une clinique" />
            </SelectTrigger>
            <SelectContent>
              {clinics.map(clinic => (
                <SelectItem key={clinic.id} value={clinic.id}>
                  {clinic.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-4 pt-4">
          <Button 
            onClick={assignClinic}
            disabled={!selectedClinic || loading}
            className="w-full"
          >
            {loading ? 'En cours...' : 'Confirmer l\'assignation'}
          </Button>
          <Button 
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
            className="w-full"
          >
            Annuler
          </Button>
        </div>
      </div>
    </div>
  )
}