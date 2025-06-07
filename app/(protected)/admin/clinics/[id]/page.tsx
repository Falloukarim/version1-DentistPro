'use client'

import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from 'next/link'
import { FiArrowLeft } from 'react-icons/fi'

export default function EditClinicPage() {
  const { id } = useParams()
  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    primaryColor: '#3b82f6',
    secondaryColor: '#93c5fd',
    logoUrl: ''
  })
  const [loading, setLoading] = useState(false)
  const { getToken } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const fetchClinic = async () => {
      try {
        const token = await getToken()
        const res = await fetch(`/api/clinics/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (!res.ok) throw new Error(await res.text())
        
        const data = await res.json()
        setForm({
          name: data.name,
          address: data.address,
          phone: data.phone || '',
          email: data.email || '',
          primaryColor: data.primaryColor || '#3b82f6',
          secondaryColor: data.secondaryColor || '#93c5fd',
          logoUrl: data.logoUrl || ''
        })
      } catch (error) {
        toast.error('Erreur de chargement des données')
        console.error(error)
      }
    }
    
    fetchClinic()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const token = await getToken()
      const res = await fetch(`/api/clinics/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || "Erreur de mise à jour")
      }
      
      toast.success('Clinique mise à jour avec succès')
      router.push('/admin/clinics')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setLoading(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('clinicId', id as string)

      const token = await getToken()
      const res = await fetch('/api/clinics/upload-logo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!res.ok) throw new Error('Échec du téléchargement')

      const data = await res.json()
      setForm(prev => ({...prev, logoUrl: data.url}))
      toast.success('Logo mis à jour')
    } catch (error) {
      toast.error('Erreur lors du téléchargement du logo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Link href="/admin/clinics" className="flex items-center gap-2 mb-6 text-sm text-muted-foreground hover:text-primary">
        <FiArrowLeft /> Retour à la liste
      </Link>

      <h1 className="text-2xl font-bold mb-6">Modifier la clinique</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input 
                value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Adresse</Label>
              <Input 
                value={form.address}
                onChange={(e) => setForm({...form, address: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input 
                value={form.phone}
                onChange={(e) => setForm({...form, phone: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                type="email"
                value={form.email}
                onChange={(e) => setForm({...form, email: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Couleur principale</Label>
              <div className="flex items-center gap-2">
                <input 
                  type="color" 
                  value={form.primaryColor}
                  onChange={(e) => setForm({...form, primaryColor: e.target.value})}
                  className="h-10 w-10 rounded cursor-pointer"
                />
                <Input 
                  value={form.primaryColor}
                  onChange={(e) => setForm({...form, primaryColor: e.target.value})}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Couleur secondaire</Label>
              <div className="flex items-center gap-2">
                <input 
                  type="color" 
                  value={form.secondaryColor}
                  onChange={(e) => setForm({...form, secondaryColor: e.target.value})}
                  className="h-10 w-10 rounded cursor-pointer"
                />
                <Input 
                  value={form.secondaryColor}
                  onChange={(e) => setForm({...form, secondaryColor: e.target.value})}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Logo</Label>
              <Input 
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={loading}
              />
              {form.logoUrl && (
                <div className="mt-2">
                  <img 
                    src={form.logoUrl} 
                    alt="Logo de la clinique" 
                    className="h-20 object-contain rounded"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-2">
          <Button type="submit" disabled={loading}>
            {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </Button>
          <Button 
            type="button" 
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Annuler
          </Button>
        </div>
      </form>
    </div>
  )
}