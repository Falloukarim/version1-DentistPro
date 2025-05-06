'use client';

import { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Appointment } from '../app/appointments/action';
import { FiClock, FiUser, FiPhone, FiInfo } from 'react-icons/fi';

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

interface CalendarViewProps {
  appointments: Appointment[];
}

export default function CalendarView({ appointments }: CalendarViewProps) {
  const [date, setDate] = useState<Value>(new Date());
  const [selectedAppointments, setSelectedAppointments] = useState<Appointment[]>([]);

  const onDateChange = (value: Value) => {
    setDate(value);
    
    if (value instanceof Date) {
      // Normaliser les dates pour la comparaison (ignorer l'heure et le fuseau horaire)
      const selectedDate = new Date(value);
      selectedDate.setHours(0, 0, 0, 0);
      
      const filtered = appointments.filter(app => {
        const appDate = new Date(app.date);
        appDate.setHours(0, 0, 0, 0);
        return appDate.getTime() === selectedDate.getTime();
      });
      
      setSelectedAppointments(filtered);
    }
  };

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      // Même normalisation pour l'affichage des points
      const currentDate = new Date(date);
      currentDate.setHours(0, 0, 0, 0);
      
      const dayAppointments = appointments.filter(app => {
        const appDate = new Date(app.date);
        appDate.setHours(0, 0, 0, 0);
        return appDate.getTime() === currentDate.getTime();
      });
      
      return dayAppointments.length > 0 ? (
        <div className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></div>
      ) : null;
    }
    return null;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200';
      case 'no_show': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="lg:w-1/2">
        <Calendar
          onChange={onDateChange}
          value={date}
          locale="fr-FR"
          tileContent={tileContent}
          className="react-calendar-custom border rounded-lg shadow-sm p-2 bg-card text-foreground"
          minDetail="month"
          next2Label={null}
          prev2Label={null}
        />
      </div>
      
      <div className="lg:w-1/2">
        <h3 className="text-xl font-semibold mb-4 text-foreground">
          Rendez-vous du {date instanceof Date ? date.toLocaleDateString('fr-FR') : ''}
        </h3>
        
        {selectedAppointments.length > 0 ? (
          <div className="space-y-4">
            {selectedAppointments.map(appointment => (
              <div key={appointment.id} className="border rounded-lg p-4 shadow-sm bg-card">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-lg flex items-center gap-2 text-foreground">
                    <FiUser className="text-primary" />
                    {appointment.patientName}
                  </h4>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(appointment.status)}`}>
                    {appointment.status === 'scheduled' ? 'Planifié' : 
                     appointment.status === 'completed' ? 'Terminé' : 
                     appointment.status === 'cancelled' ? 'Annulé' : 'Non venu'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-2">
                    <FiPhone />
                    {appointment.patientPhone}
                  </div>
                  <div className="flex items-center gap-2">
                    <FiClock />
                    {new Date(appointment.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                
                {appointment.reason && (
                  <div className="text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <FiInfo />
                      <span>Motif</span>
                    </div>
                    <p className="text-foreground">{appointment.reason}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground bg-card rounded-lg shadow-sm border">
            Aucun rendez-vous prévu cette journée
          </div>
        )}
      </div>
    </div>
  );
}