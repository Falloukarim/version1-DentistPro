import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { FiPlus, FiSettings, FiUsers } from 'react-icons/fi'
import UsersTable from './_components/UsersTable'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export default function UsersPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Gestion des Utilisateurs</h1>
        <Link href="/admin/clinics/users/add">
          <Button className="gap-2">
            <FiPlus /> Ajouter utilisateur
          </Button>
        </Link>
      </div>
      <div className="flex gap-4 mb-6">
  <Link href="/admin/clinics/users/assign-role">
    <Button variant="outline" className="gap-2">
      <FiSettings /> Attribuer rôles
    </Button>
  </Link>
  <Link href="/admin/clinics/users/assign-clinic">
    <Button variant="outline" className="gap-2">
      <FiUsers /> Assigner cliniques
    </Button>
  </Link>
</div>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <UsersTable />
      </Suspense>
    </div>
  )
}