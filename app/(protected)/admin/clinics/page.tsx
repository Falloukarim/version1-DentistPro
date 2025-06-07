import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { FiPlus, FiUsers, FiSettings } from 'react-icons/fi'
import ClinicTable from './_components/ClinicTable'

export default function ClinicsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Gestion des Cliniques</h1>
        <div className="flex gap-2">
          <Link href="/admin/clinics/add">
            <Button className="gap-2">
              <FiPlus /> Nouvelle clinique
            </Button>
          </Link>
        </div>
      </div>

      <div className="mb-6 flex gap-4">
        <Link href="/admin/clinics/users">
          <Button variant="outline" className="gap-2">
            <FiUsers /> Gérer utilisateurs
          </Button>
        </Link>
        <Link href="/admin/clinics/users/assign-role">
          <Button variant="outline" className="gap-2">
            <FiSettings /> Attribuer rôles
          </Button>
        </Link>
      </div>

      <ClinicTable />
    </div>
  )
}