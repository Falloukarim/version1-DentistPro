import { Suspense } from 'react';
import Link from "next/link";
import { redirect } from "next/navigation";
import { FiUser, FiCalendar, FiDollarSign, FiClock, FiChevronRight, FiPhone, FiPlusCircle, FiPackage } from "react-icons/fi";

import { auth } from "@clerk/nextjs/server";
import { getDashboardStats, getTodaysAppointments } from "../actions/dashboard.actions";

import Layout from "components/layout";
import StatCard from "../../components/ui/StatCard";
import QuickAction from "../../components/ui/QuickAction";

// 📊 Stats Section
async function StatsWrapper() {
  const stats = await getDashboardStats();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      <StatCard 
        title="Patients" 
        value={stats.uniqueClients} 
        icon={<FiUser className="text-lg" />} 
        color="blue" 
        href="/consultations"
      />
      <StatCard 
        title="Rendez-vous" 
        value={stats.todaysAppointments} 
        icon={<FiCalendar className="text-lg" />} 
        color="purple" 
        href="/appointments"
      />
      <StatCard 
        title="Revenus" 
        value={`${stats.totalRevenue.toLocaleString()} FCFA`} 
        icon={<FiDollarSign className="text-lg" />} 
        color="green" 
        href="/payments"
      />
      <StatCard 
        title="Impayés" 
        value={stats.unpaidTreatments} 
        icon={<FiClock className="text-lg" />} 
        color="red" 
        href="/unpaid-treatments"
      />
    </div>
  );
}

// 📅 Rendez-vous du jour
async function TodaysAppointments() {
  const appointments = await getTodaysAppointments();

  if (appointments.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm sm:text-base">
        Aucun rendez-vous prévu aujourd'hui
      </div>
    );
  }

  return (
    <div className="space-y-2 sm:space-y-3">
      {appointments.map(appointment => (
        <div key={appointment.id} className="border-b border-border pb-2 sm:pb-3 last:border-0">
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0">
              <h3 className="font-medium text-sm sm:text-base truncate text-foreground">
                {appointment.patientName}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                {appointment.reason}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-medium text-xs sm:text-sm whitespace-nowrap text-foreground">
                {new Date(appointment.date).toLocaleTimeString('fr-FR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
              <span className={`inline-block mt-1 text-[10px] sm:text-xs px-2 py-1 rounded-full ${
                appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                appointment.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                appointment.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
              }`}>
                {appointment.status === 'scheduled' ? 'Planifié' :
                 appointment.status === 'completed' ? 'Terminé' :
                 appointment.status === 'cancelled' ? 'Annulé' : 'Non venu'}
              </span>
            </div>
          </div>
          <div className="flex items-center mt-1 text-xs sm:text-sm text-muted-foreground">
            <FiPhone className="mr-1 shrink-0" size={12} />
            <span className="truncate">{appointment.patientPhone}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// 🧠 Composant principal
export default async function DashboardHome() {
    const { userId } = await auth();
  
    if (!userId) {
      redirect('/sign-in');
    }
  
    return (
        <Layout>
          {/* Conteneur principal sans marges */}
          <div className="h-screen w-full overflow-y-auto bg-background">
            {/* En-tête sans padding latéral */}
            <div className="p-4 sm:p-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Tableau de Bord</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                Bienvenue sur votre espace personnel
              </p>
            </div>
    
            {/* Contenu principal sans padding latéral */}
            <div className="px-4 sm:px-6">
              {/* Cartes Statistiques */}
              <Suspense fallback={
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-pulse">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-card/50 p-4 rounded-xl h-28 sm:h-32 flex items-center justify-center border border-border">
                      <div className="h-6 w-6 bg-muted rounded-full"></div>
                    </div>
                  ))}
                </div>
              }>
                <StatsWrapper />
              </Suspense>
        
              {/* Grille principale sans padding latéral */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 pb-6">
                {/* Section RDV */}
                <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                  <div className="p-4 sm:p-5 border-b border-border flex justify-between items-center">
                    <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                      Rendez-vous aujourd'hui
                    </h2>
                    <Link 
                      href="/appointments" 
                      className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1"
                    >
                      Voir tout <FiChevronRight className="text-sm" />
                    </Link>
                  </div>
                  <div className="p-4 sm:p-5">
                    <Suspense fallback={
                      <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse"></div>
                        ))}
                      </div>
                    }>
                      <TodaysAppointments />
                    </Suspense>
                  </div>
                </div>
        
                {/* Actions rapides */}
                <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                  <div className="p-4 sm:p-5 border-b border-border">
                    <h2 className="text-lg sm:text-xl font-semibold text-foreground">Actions Rapides</h2>
                  </div>
                  <div className="p-4 sm:p-5 grid grid-cols-2 gap-3 sm:gap-4">
                    <QuickAction 
                      icon={<FiPlusCircle className="text-blue-600 dark:text-blue-400" />} 
                      title="Nouvelle Consultation" 
                      href="/consultations/add" 
                      color="blue"
                    />
                    <QuickAction 
                      icon={<FiCalendar className="text-purple-600 dark:text-purple-400" />} 
                      title="Nouveau RDV" 
                      href="/appointments/add" 
                      color="purple"
                    />
                    <QuickAction 
                      icon={<FiDollarSign className="text-green-600 dark:text-green-400" />} 
                      title="Paiement" 
                      href="/payments" 
                      color="green"
                    />
                    <QuickAction 
                      icon={<FiPackage className="text-orange-600 dark:text-orange-400" />} 
                      title="Produits" 
                      href="/products" 
                      color="orange"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
      </Layout>
    );
}