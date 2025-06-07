'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from 'next/link'
import { FiArrowLeft } from 'react-icons/fi'

export default function AddClinicPage() {
  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: ''
  })
  const [loading, setLoading] = useState(false)
  const { getToken } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const token = await getToken()
      const res = await fetch('/api/admin/clinics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      })

      if (!res.ok) throw new Error(await res.text())
      
      toast.success('Clinique créée')
      router.push('/admin/clinics')
    } catch (error) {
      toast.error('Erreur de création')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <Link href="/admin/clinics" className="flex items-center gap-2 mb-6">
        <FiArrowLeft /> Retour
      </Link>

      <h1 className="text-2xl font-bold mb-6">Nouvelle clinique</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
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

        <div className="flex gap-4 pt-4">
          <Button type="submit" disabled={loading}>
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
          <Button 
            type="button" 
            variant="outline"
            onClick={() => router.back()}
          >
            Annuler
          </Button>
        </div>
      </form>
    </div>
  )
}