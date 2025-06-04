'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import Link from "next/link"

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/paydunya/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création du paiement')
      }

      // Vérification améliorée
      const paymentUrl = data.url || data.response_text
      if (!paymentUrl) {
        console.error('Réponse API complète:', data)
        throw new Error(`Format de réponse inattendu: ${JSON.stringify(data)}`)
      }

      // Redirection absolue nécessaire
      window.location.href = paymentUrl.includes('http') 
        ? paymentUrl 
        : `https://${paymentUrl}`

    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Erreur inconnue'
      setError(`Échec de la souscription: ${errorMessage}`)
      console.error('Erreur détaillée:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 sm:p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Abonnement Requis
          </h1>
          <p className="text-gray-600">
            Pour continuer à utiliser notre service, veuillez souscrire à notre abonnement mensuel.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Abonnement Standard
              </h2>
              <p className="text-gray-600 text-sm">
                Accès complet à toutes les fonctionnalités
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">5,000 FCFA</p>
              <p className="text-gray-600 text-sm">/ mois</p>
            </div>
          </div>

          <ul className="space-y-3 mb-6">
            <li className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
              <span>Gestion illimitée de patients</span>
            </li>
            <li className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
              <span>Gestion des rendez-vous</span>
            </li>
            <li className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
              <span>Suivi des paiements</span>
            </li>
            <li className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
              <span>Gestion des stocks</span>
            </li>
          </ul>
          <form onSubmit={handleSubscribe} className="w-full">
          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? 'Connexion à PayDunya...' : 'Souscrire maintenant'}
          </Button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
            <p className="font-medium">Erreur de paiement</p>
            <p>{error}</p>
            <p className="mt-2 text-xs">
              Conseil: Essayez de rafraîchir la page ou contactez le support.
            </p>
          </div>
        )}
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>Vous avez des questions ? <Link href="/contact" className="text-blue-600 hover:underline">Contactez-nous</Link></p>
        </div>
      </div>
    </div>
  );
}