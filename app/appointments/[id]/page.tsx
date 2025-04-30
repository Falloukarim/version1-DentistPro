import { getAppointmentById } from '../action';
import { FiCalendar, FiClock, FiUser, FiPhone, FiInfo, FiEdit, FiTrash2 } from 'react-icons/fi';
import Link from 'next/link';
import DeleteButton from './DeleteButton';
import { FiArrowLeft } from 'react-icons/fi';

interface AppointmentDetailPageProps {
  params: {
    id: string;
  };
}

export default async function AppointmentDetailPage({ params }: AppointmentDetailPageProps) {
  const appointment = await getAppointmentById(params.id);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Planifié';
      case 'completed':
        return 'Terminé';
      case 'cancelled':
        return 'Annulé';
      case 'no_show':
        return 'Non venu';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no_show':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <div className="flex justify-between items-center">
            <Link 
              href="/appointments"
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <FiArrowLeft className="mr-2" />
              Retour à la liste
            </Link>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <FiCalendar className="mr-2 text-blue-500" />
              Détails du Rendez-vous
            </h2>
            <div className="flex gap-2">
              <Link
                href={`/appointments/${appointment.id}/edit`}
                className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1 rounded-md text-sm transition-colors"
              >
                <FiEdit size={14} />
                <span>Modifier</span>
              </Link>
              <DeleteButton id={appointment.id} />
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <FiUser size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Patient</h3>
                  <p className="text-lg font-semibold">{appointment.patientName}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <FiPhone size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Téléphone</h3>
                  <p className="text-lg font-semibold">{appointment.patientPhone}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <FiCalendar size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Date</h3>
                  <p className="text-lg font-semibold">
                    {formatDate(appointment.date)} à {formatTime(appointment.date)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <FiInfo size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Statut</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(appointment.status)}`}>
                    {getStatusLabel(appointment.status)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <FiInfo className="text-gray-400" />
              Informations supplémentaires
            </h3>
            
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Motif du rendez-vous</h4>
                <p className="mt-1">{appointment.reason || "Non spécifié"}</p>
              </div>

              {appointment.consultation && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Consultation associée</h4>
                  <p className="mt-1">
                    {appointment.consultation.patientName} - {appointment.consultation.patientPhone}
                  </p>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium text-gray-500">Dentiste</h4>
                <p className="mt-1">
                  {appointment.dentist.firstName} {appointment.dentist.lastName}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}