import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { fetchConsultations } from './action';
import ConsultationsList from './ConsultationsList';

export default async function ConsultationsPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  const consultations = await fetchConsultations();
  return <ConsultationsList consultations={consultations} />;
}