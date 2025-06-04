import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();

    // Trouver toutes les cliniques avec abonnement expiré (endDate < now) et qui sont toujours actives (isSubscribed = true)
    const expiredClinics = await prisma.subscription.findMany({
      where: {
        endDate: { lt: now },
        status: "active",
      },
      include: {
        clinic: true,
      },
    });

    const clinicIdsToDeactivate = expiredClinics
      .filter((sub: { clinic: { isSubscribed: any; }; }) => sub.clinic?.isSubscribed)
      .map((sub: { clinicId: any; }) => sub.clinicId);

    if (clinicIdsToDeactivate.length === 0) {
      return NextResponse.json({ message: "Aucune clinique expirée à désactiver" });
    }

    // Désactivation en batch (ou un par un si besoin)
    await prisma.clinic.updateMany({
      where: {
        id: { in: clinicIdsToDeactivate },
      },
      data: {
        isSubscribed: false,
        isActive: false,  // si tu souhaites désactiver aussi l'accès
      },
    });

    return NextResponse.json({ message: `Désactivé ${clinicIdsToDeactivate.length} cliniques expirées` });
  } catch (error) {
    console.error("Erreur désactivation cliniques expirées", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
