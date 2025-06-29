import { getAppointmentById } from '../action';
import { FiCalendar, FiUser, FiPhone, FiInfo, FiEdit} from 'react-icons/fi';
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
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'no_show':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <Link 
              href="/appointments"
              className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 w-fit"
            >
              <FiArrowLeft className="mr-2" />
              Retour à la liste
            </Link>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white flex items-center justify-center sm:justify-start">
              <FiCalendar className="mr-2 text-blue-500 dark:text-blue-400" />
              Détails du Rendez-vous
            </h2>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400">
                  <FiUser size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Patient</h3>
                  <p className="text-base sm:text-lg font-semibold dark:text-white">{appointment.patientName}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400">
                  <FiPhone size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Téléphone</h3>
                  <p className="text-base sm:text-lg font-semibold dark:text-white">{appointment.patientPhone}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400">
                  <FiCalendar size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Date</h3>
                  <p className="text-base sm:text-lg font-semibold dark:text-white">
                    {formatDate(appointment.date)} à {formatTime(appointment.date)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400">
                  <FiInfo size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Statut</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(appointment.status)}`}>
                    {getStatusLabel(appointment.status)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 dark:text-white">
              <FiInfo className="text-gray-400 dark:text-gray-500" />
              Informations supplémentaires
            </h3>
            
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Motif du rendez-vous</h4>
                <p className="mt-1 dark:text-gray-300">{appointment.reason || "Non spécifié"}</p>
              </div>

              {appointment.consultation && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Consultation associée</h4>
                  <p className="mt-1 dark:text-gray-300">
                    {appointment.consultation.patientName} - {appointment.consultation.patientPhone}
                  </p>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Dentiste</h4>
                <p className="mt-1 dark:text-gray-300">
                  {appointment.dentist.firstName} {appointment.dentist.lastName}
                </p>
              </div>

              {appointment.clinic && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Clinique</h4>
                  <p className="mt-1 dark:text-gray-300">{appointment.clinic.name}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bouton Delete en bas de la page */}
        <div className="p-4 sm:p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 flex justify-center sm:justify-end">
          <DeleteButton id={appointment.id} />
        </div>
      </div>
    </div>
  );
}