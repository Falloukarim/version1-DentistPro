'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from "@/components/ui/button"
import { FiEdit, FiTrash2 } from 'react-icons/fi'

interface User {
  clinicId: any
  id: string
  clerkUserId: string
  firstName: string
  lastName: string
  email: string
  role: string
  clinic?: {
    name: string
  }
}

export default function UsersTable() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const { getToken } = useAuth()
  const router = useRouter()

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const token = await getToken()
      const res = await fetch('/api/admin/users', { 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
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

  const deleteUser = async (clerkUserId: string) => {
    try {
      const token = await getToken()
      const res = await fetch(`/api/admin/users/${clerkUserId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Failed to delete user')
      }

      toast.success('Utilisateur supprimé')
      fetchUsers()
    } catch (error) {
      console.error('[DELETE_USER_ERROR]', error)
      toast.error(error instanceof Error ? error.message : 'Erreur de suppression')
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-full bg-gray-100 rounded animate-pulse" />
        <div className="h-64 w-full bg-gray-50 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-4 text-left">Nom</th>
            <th className="p-4 text-left">Email</th>
            <th className="p-4 text-left">Rôle</th>
            <th className="p-4 text-left">Clinique</th>
            <th className="p-4 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.clerkUserId} className="border-t hover:bg-gray-50">
              <td className="p-4">{user.firstName} {user.lastName}</td>
              <td className="p-4">{user.email}</td>
              <td className="p-4">{user.role}</td>
              <td className="p-4">{user.clinic?.name || '-'}</td>
              <td className="p-4 flex flex-wrap gap-2">
  <Button 
    variant="outline" 
    size="sm"
  onClick={() => router.push(`/protected/admin/clinics/${user.clinicId}`)}
  >
    <FiEdit className="mr-2" /> Modifier
  </Button>

  <Button
    variant="destructive"
    size="sm"
    onClick={() => deleteUser(user.clerkUserId)}
  >
    <FiTrash2 className="mr-2" /> Supprimer
  </Button>

  <Button
    variant="secondary"
    size="sm"
    onClick={() => router.push(`/admin/clinics/users/assign-clinic/${user.clerkUserId}`)}
  >
    Assigner clinique
  </Button>
</td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}