import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const cronSecret = process.env.CRON_SECRET;

if (!accountSid || !authToken || !cronSecret) {
  throw new Error('Twilio ou CRON_SECRET manquant dans les variables d\'environnement');
}

const twilioClient = twilio(accountSid, authToken);

export async function POST(request: Request) {
  try {
    // 🔒 Vérification du token de sécurité
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 🕒 Calcul de la plage horaire 24h ±15min
    const now = new Date();
    const lowerBound = new Date(now.getTime() + 23 * 60 * 60 * 1000 + 45 * 60 * 1000);
    const upperBound = new Date(now.getTime() + 24 * 60 * 60 * 1000 + 15 * 60 * 1000);

    // 📅 Rechercher tous les rendez-vous concernés
    const appointments = await prisma.appointment.findMany({
      where: {
        status: 'scheduled',
        date: {
          gte: lowerBound,
          lte: upperBound,
        },
      },
      orderBy: { date: 'asc' },
    });

    if (appointments.length === 0) {
      return NextResponse.json({ message: 'Aucun rendez-vous à rappeler.' });
    }

    const results: any[] = [];

    for (const appointment of appointments) {
      const { clinicId, dentistId, date, patientPhone } = appointment;

      if (!patientPhone) continue;

      // 📞 Format téléphone
      let cleanedPhone = patientPhone.replace(/\s/g, '');
      if (cleanedPhone.startsWith('7')) cleanedPhone = `+221${cleanedPhone}`;
      if (!cleanedPhone.startsWith('+')) continue;

      const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
      const dentist = await prisma.user.findUnique({ where: { id: dentistId } });

      const formattedTime = date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      });

      // 📤 Envoi du message WhatsApp
      const message = await twilioClient.messages.create({
        body: `[Rappel RDV] ${clinic?.name} - RDV avec Dr ${dentist?.lastName ?? ''} demain à ${formattedTime}`,
        from: 'whatsapp:+14155238886',
        to: `whatsapp:${cleanedPhone}`,
      });

      results.push({ to: cleanedPhone, messageSid: message.sid });
    }

    return NextResponse.json({
      success: true,
      total: results.length,
      messages: results,
    });

  } catch (error: any) {
    console.error('Erreur lors des rappels WhatsApp :', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error?.message },
      { status: 500 }
    );
  }
}
