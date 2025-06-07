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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function AddUserPage() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    clerkUserId: '',
    role: 'DENTIST'
  })
  const [loading, setLoading] = useState(false)
  const { getToken } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const token = await getToken()
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      })

      if (!res.ok) throw new Error(await res.text())
      
      toast.success('Utilisateur créé')
      router.push('/admin/clinics/users')
    } catch (error) {
      toast.error('Erreur de création')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <Link href="/admin/clinics/users" className="flex items-center gap-2 mb-6">
        <FiArrowLeft /> Retour
      </Link>

      <h1 className="text-2xl font-bold mb-6">Nouvel utilisateur</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Prénom *</Label>
          <Input 
            value={form.firstName}
            onChange={(e) => setForm({...form, firstName: e.target.value})}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Nom</Label>
          <Input 
            value={form.lastName}
            onChange={(e) => setForm({...form, lastName: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <Label>Email *</Label>
          <Input 
            type="email"
            value={form.email}
            onChange={(e) => setForm({...form, email: e.target.value})}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>ID Clerk *</Label>
          <Input 
            value={form.clerkUserId}
            onChange={(e) => setForm({...form, clerkUserId: e.target.value})}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Rôle *</Label>
          <Select
            value={form.role}
            onValueChange={(value) => setForm({...form, role: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un rôle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ADMIN">Administrateur</SelectItem>
              <SelectItem value="DENTIST">Dentiste</SelectItem>
              <SelectItem value="ASSISTANT">Assistant</SelectItem>
            </SelectContent>
          </Select>
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