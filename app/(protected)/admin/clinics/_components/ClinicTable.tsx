'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Clinic } from 'app/types/clinic'
import { Button } from "@/components/ui/button"
import { FiEdit, FiTrash2 } from 'react-icons/fi'

export default function ClinicTable() {
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [loading, setLoading] = useState(true)
  const { getToken } = useAuth()
  const router = useRouter()

  const fetchClinics = async () => {
    try {
      const token = await getToken()
      const res = await fetch('/api/admin/clinics', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      setClinics(data)
    } catch (error) {
      toast.error('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  const deleteClinic = async (id: string) => {
    try {
      const token = await getToken()
      await fetch(`/api/admin/clinics/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      toast.success('Clinique supprimée')
      fetchClinics()
    } catch (error) {
      toast.error('Erreur de suppression')
    }
  }

  useEffect(() => {
    fetchClinics()
  }, [])

  if (loading) return <div>Chargement...</div>

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-4 text-left">Nom</th>
            <th className="p-4 text-left">Adresse</th>
            <th className="p-4 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {clinics.map(clinic => (
            <tr key={clinic.id} className="border-t">
              <td className="p-4">{clinic.name}</td>
              <td className="p-4">{clinic.address}</td>
              <td className="p-4 flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push(`/admin/clinics/${clinic.id}`)}
                >
                  <FiEdit className="mr-2" /> Modifier
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteClinic(clinic.id)}
                >
                  <FiTrash2 className="mr-2" /> Supprimer
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}