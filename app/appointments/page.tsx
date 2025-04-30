import { fetchAppointments } from './action';
import AppointmentsList from './AppointmentsList';

export default async function AppointmentsPage() {
  const appointments = await fetchAppointments();
  
  return (
    <div className="p-6">
      <AppointmentsList appointments={appointments} />
    </div>
  );
}