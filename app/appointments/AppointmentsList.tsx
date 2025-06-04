'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import CalendarView from 'components/CalendarView';
import { deleteAllAppointments, updateAppointment } from './action';
import type { Appointment } from './action';
import { 
  FiArrowLeft, 
  FiPlusCircle, 
  FiEye, 
  FiTrash2, 
  FiEdit,
  FiSave,
  FiX,
  FiUser,
  FiPhone,
  FiCalendar,
  FiClock,
  FiInfo
} from 'react-icons/fi';
import { Button } from '@/components/ui/button';

export default function AppointmentsList({ appointments: initialAppointments }: { appointments: Appointment[] }) {
  const router = useRouter();
  const { user: isLoaded } = useUser();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    patientName: '',
    patientPhone: '',
    date: '',
    reason: '',
    status: 'scheduled' as 'scheduled' | 'cancelled' | 'completed' | 'no_show'
  });

  if (!isLoaded) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>;
  }

  // Formater la date pour la comparaison
  const today = new Date().toISOString().split('T')[0];
  
  // Filtrer les rendez-vous du jour
  const todaysAppointments = initialAppointments.filter(app => {
    const appointmentDate = new Date(app.date).toISOString().split('T')[0];
    return appointmentDate === today;
  });

  // Trier les rendez-vous par date
  const sortedAppointments = [...initialAppointments].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  const startEditing = (appointment: Appointment) => {
    setEditingId(appointment.id);
    setEditForm({
      patientName: appointment.patientName,
      patientPhone: appointment.patientPhone,
      date: new Date(appointment.date).toISOString().split('T')[0],
      reason: appointment.reason,
      status: appointment.status
    });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    try {
      await updateAppointment(editingId, editForm);
      setEditingId(null);
      router.refresh();
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleDeleteAll = async () => {
    if (confirm("Êtes-vous sûr de vouloir supprimer tous les rendez-vous ?")) {
      try {
        await deleteAllAppointments();
        router.refresh();
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
      }
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200';
      case 'no_show':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Planifié';
      case 'completed': return 'Terminé';
      case 'cancelled': return 'Annulé';
      case 'no_show': return 'Non venu';
      default: return status;
    }
  };

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-muted-foreground hover:text-primary">
            <FiArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <FiCalendar className="text-primary" />
            Gestion des Rendez-vous
          </h1>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleDeleteAll}
            variant="destructive"
            className="gap-2 shadow-md"
          >
            <FiTrash2 />
            <span>Supprimer tout</span>
          </Button>
          <Button asChild className="gap-2 shadow-md">
            <Link href="/appointments/add">
              <FiPlusCircle />
              <span>Nouveau RDV</span>
            </Link>
          </Button>
        </div>
      </div>

      <div className="mb-8 bg-card rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-accent">
          <h2 className="text-xl font-semibold text-primary flex items-center gap-2">
            <FiClock className="text-primary" />
            Calendrier des Rendez-vous
          </h2>
        </div>
        <div className="p-4">
          <CalendarView appointments={initialAppointments} />
        </div>
      </div>

      {/* Section RDV du jour */}
      <div className="mb-8 bg-card rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-accent">
          <h2 className="text-xl font-semibold text-primary flex items-center gap-2">
            <FiClock className="text-primary" />
           Rendez-vous aujourd&apos;hui

({new Date(today).toLocaleDateString('fr-FR')})
          </h2>
        </div>
        <div className="p-4">
          {todaysAppointments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-accent">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Patient</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Téléphone</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Heure</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Statut</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Motif</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {todaysAppointments.map(appointment => (
                    <tr key={appointment.id} className="hover:bg-accent/50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-foreground">
                          <FiUser className="text-muted-foreground" />
                          {appointment.patientName}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                        {appointment.patientPhone}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                        {new Date(appointment.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(appointment.status)}`}>
                          {getStatusLabel(appointment.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                        {appointment.reason || "Non spécifié"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
Aucun rendez-vous enregistré
</div>
          )}
        </div>
      </div>

      {/* Tous les RDV */}
      <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-accent">
          <h2 className="text-xl font-semibold text-primary">
            Historique des Rendez-vous
          </h2>
        </div>
        <div className="p-4">
          {sortedAppointments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-accent">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Patient</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Statut</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Motif</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sortedAppointments.map(appointment => {
                    const isEditing = editingId === appointment.id;
                    
                    return (
                      <tr key={appointment.id} className="hover:bg-accent/50 transition-colors">
                        {isEditing ? (
                          <td className="px-4 py-3" colSpan={5}>
                            <form onSubmit={handleSubmit} className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-foreground mb-1">
                                    <FiUser className="inline mr-2" /> Nom patient
                                  </label>
                                  <input
                                    type="text"
                                    name="patientName"
                                    value={editForm.patientName}
                                    onChange={handleEditChange}
                                    className="w-full p-2 border rounded-md bg-background"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-foreground mb-1">
                                    <FiPhone className="inline mr-2" /> Téléphone
                                  </label>
                                  <input
                                    type="text"
                                    name="patientPhone"
                                    value={editForm.patientPhone}
                                    onChange={handleEditChange}
                                    className="w-full p-2 border rounded-md bg-background"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-foreground mb-1">
                                    <FiCalendar className="inline mr-2" /> Date
                                  </label>
                                  <input
                                    type="date"
                                    name="date"
                                    value={editForm.date}
                                    onChange={handleEditChange}
                                    className="w-full p-2 border rounded-md bg-background"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-foreground mb-1">
                                    Statut
                                  </label>
                                  <select
                                    name="status"
                                    value={editForm.status}
                                    onChange={handleEditChange}
                                    className="w-full p-2 border rounded-md bg-background"
                                  >
                                    <option value="scheduled">Planifié</option>
                                    <option value="completed">Terminé</option>
                                    <option value="cancelled">Annulé</option>
                                    <option value="no_show">Non venu</option>
                                  </select>
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                  <FiInfo className="inline mr-2" /> Motif
                                </label>
                                <textarea
                                  name="reason"
                                  value={editForm.reason}
                                  onChange={handleEditChange}
                                  className="w-full p-2 border rounded-md bg-background"
                                  rows={2}
                                  required
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button
                                  type="button"
                                  onClick={cancelEdit}
                                  variant="outline"
                                >
                                  <FiX className="mr-2" /> Annuler
                                </Button>
                                <Button type="submit">
                                  <FiSave className="mr-2" /> Enregistrer
                                </Button>
                              </div>
                            </form>
                          </td>
                        ) : (
                          <>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-2 text-foreground">
                                <FiUser className="text-muted-foreground" />
                                {appointment.patientName}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              <div className="text-foreground">
                                {new Date(appointment.date).toLocaleDateString('fr-FR')}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(appointment.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(appointment.status)}`}>
                                {getStatusLabel(appointment.status)}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                              {appointment.reason || "Non spécifié"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end gap-2">
                                <Button
                                  onClick={() => startEditing(appointment)}
                                  variant="outline"
                                  size="sm"
                                  className="gap-1"
                                >
                                  <FiEdit size={14} />
                                  <span>Modifier</span>
                                </Button>
                                <Button asChild variant="outline" size="sm" className="gap-1">
                                  <Link href={`/appointments/${appointment.id}`}>
                                    <FiEye size={14} />
                                    <span>Détails</span>
                                  </Link>
                                </Button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Aucun rendez-vous enregistré
            </div>
          )}
        </div>
      </div>
    </div>
  );
}