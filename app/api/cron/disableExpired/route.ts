import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
    // Vérification du header secret
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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
