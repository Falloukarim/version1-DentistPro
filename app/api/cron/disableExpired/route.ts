import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  // Debug logging
  console.log('Incoming headers:', Object.fromEntries(request.headers.entries()));
  
  // Flexible header check
  const authHeader = request.headers.get('Authorization')?.trim() 
    || request.headers.get('authorization')?.trim();

  if (!authHeader) {
    console.error('Missing auth header');
    return new Response('Authorization header required', { status: 401 });
  }
    const token = authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7).trim()
    : authHeader.trim();

  if (!process.env.CRON_SECRET) {
    console.error('CRON_SECRET not configured');
    return new Response('Server misconfigured', { status: 500 });
  }
    if (token !== process.env.CRON_SECRET.trim()) {
    console.error(`Invalid token. Received: "${token}", Expected: "${process.env.CRON_SECRET}"`);
    return new Response('Unauthorized', { status: 401 });
  }
    // Votre logique existante
    const now = new Date();
    try {
      const expiredSubscriptions = await prisma.subscription.findMany({
        where: { endDate: { lt: now }, status: { in: ['active', 'trial'] } },
        include: { clinic: true },
      });

    if (expiredSubscriptions.length === 0) {
      return NextResponse.json({ message: 'Aucun abonnement expiré' });
    }

    // 2. Obtenir les IDs des cliniques à désactiver
    const clinicIdsToDeactivate = expiredSubscriptions
      .filter((sub: { clinic: any; }) => sub.clinic) // ne filtre plus sur isActive
      .map((sub: { clinic: any; }) => sub.clinic!.id);

    console.log('Cliniques à désactiver:', clinicIdsToDeactivate);

    // 3. Mettre à jour les statuts des abonnements et cliniques
    await prisma.$transaction([
      prisma.subscription.updateMany({
        where: {
          clinicId: { in: clinicIdsToDeactivate },
        },
        data: {
          status: 'expired',
        },
      }),
      prisma.clinic.updateMany({
        where: {
          id: { in: clinicIdsToDeactivate },
        },
        data: {
          isActive: false,
        },
      }),
    ]);

    return NextResponse.json({
      message: `Cliniques désactivées: ${clinicIdsToDeactivate.length}`,
    });
  } catch (error) {
    console.error('Erreur désactivation cliniques expirées', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
