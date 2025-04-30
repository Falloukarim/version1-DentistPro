import Link from 'next/link';
import { FiLock } from 'react-icons/fi';

export default function UnauthorizedPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
            <FiLock className="text-5xl text-red-500 mb-4" />
            <h1 className="text-2xl font-bold mb-2">Accès non autorisé</h1>
            <p className="mb-6">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
            <Link 
                href="/dashboard" 
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
                Retour au tableau de bord
            </Link>
        </div>
    );
}