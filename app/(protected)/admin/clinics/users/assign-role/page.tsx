'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from "@/components/ui/button"
import Link from 'next/link'
import { FiArrowLeft } from 'react-icons/fi'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from '@/components/ui/label'

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  clerkUserId: string
  role: string
}

export default function AssignRolePage() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedRole, setSelectedRole] = useState('DENTIST')
  const [loading, setLoading] = useState(false)
  const { getToken } = useAuth()
  const router = useRouter()

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const token = await getToken()
      const res = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Failed to fetch users')
      }

      const data = await res.json()
      setUsers(data)
    } catch (error) {
      console.error('[FETCH_USERS_ERROR]', error)
      toast.error(error instanceof Error ? error.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  const assignRole = async () => {
    if (!selectedUserId) {
      toast.error('Veuillez sélectionner un utilisateur')
      return
    }
  
    setLoading(true)
    try {
      const token = await getToken()
      const res = await fetch('/api/admin/users/assign-role', {  // ← Modifié ici
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          clerkUserId: selectedUserId,
          role: selectedRole
        })
      })
  
      // Vérifiez d'abord le type de réponse
      const contentType = res.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
        const text = await res.text()
        console.error('Réponse non-JSON:', text)
        throw new Error('Réponse inattendue du serveur')
      }
  
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.message || "Erreur lors de l'attribution")
      }
      
      toast.success(`Rôle ${selectedRole} attribué avec succès`)
      fetchUsers()
    } catch (error) {
      console.error('Erreur complète:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  return (
    <div className="max-w-md mx-auto py-8 px-4">
      <Link href="/admin/clinics/users" className="flex items-center gap-2 mb-6 text-sm text-muted-foreground hover:text-primary">
        <FiArrowLeft /> Retour à la liste
      </Link>

      <h1 className="text-2xl font-bold mb-6">Attribuer un rôle</h1>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label>Utilisateur *</Label>
          <Select 
            onValueChange={setSelectedUserId}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un utilisateur" />
            </SelectTrigger>
            <SelectContent>
              {users.map(user => (
                <SelectItem 
                  key={user.clerkUserId} 
                  value={user.clerkUserId}
                >
                  {user.firstName} {user.lastName} ({user.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Rôle *</Label>
          <Select 
            value={selectedRole}
            onValueChange={setSelectedRole}
            disabled={loading}
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

        <div className="flex gap-4 pt-2">
          <Button 
            onClick={assignRole}
            disabled={!selectedUserId || loading}
            className="w-full"
          >
            {loading ? 'En cours...' : 'Attribuer le rôle'}
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