import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button"; // Import ShadCN Button
import { Card, CardHeader, CardContent } from "@/components/ui/card"; // Import ShadCN Card
import SyncUser from '../components/SyncUser';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <SignedIn>
        <div className="p-4 flex justify-end">
          <UserButton afterSignOutUrl="/" />
        </div>
        <div className="max-w-4xl mx-auto text-center py-16 px-4">
          <h1 className="text-4xl font-bold text-blue-800 mb-6">
            Bienvenue dans votre espace santé
          </h1>
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
            <Link href="/dashboard">
              Accéder au tableau de bord
            </Link>
          </Button>
        </div>
      </SignedIn>

      <SignedOut>
        <div className="container mx-auto px-4 py-16 flex flex-col md:flex-row items-center justify-center gap-12 min-h-screen">
          {/* Partie gauche - Illustration */}
          <div className="md:w-1/2 flex justify-center">
            <div className="max-w-md">
              <Image
                src="/logo1.jpg"
                alt="Clinique Dentaire"
                width={600}
                height={400}
                className="rounded-lg shadow-xl"
                priority
              />
              <h1 className="text-3xl font-bold text-blue-800 mt-6">
                Cabinet medical
              </h1>
              <p className="text-gray-600 mt-2">
                Des soins exceptionnels pour votre confort quotidien.
              </p>
            </div>
          </div>

          {/* Partie droite - Carte de connexion */}
          <div className="md:w-1/2 max-w-md">
            <Card className="shadow-lg">
              <CardHeader>
                <h2 className="text-2xl font-bold text-center text-gray-800">
                  Espace Professionnel
                </h2>
                <p className="text-gray-500 text-center mt-2">
                  Connectez-vous pour gérer vos rendez-vous et patients
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                  <Link href="/sign-in">
                    Connexion Professionnelle
                  </Link>
                </Button>

                <div className="flex items-center my-6">
                  <div className="flex-grow border-t border-gray-300"></div>
                  <span className="mx-4 text-gray-500">ou</span>
                  <div className="flex-grow border-t border-gray-300"></div>
                </div>

                <Button asChild variant="outline" className="w-full">
                  <Link href="/sign-up">
                    Créer un compte
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </SignedOut>
    </div>
  );
}