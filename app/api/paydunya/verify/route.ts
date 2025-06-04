import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: { clinic: { include: { subscription: true } } }
    });

    if (!user?.clinic) {
      return NextResponse.json(
        { error: "Clinique non trouvée" },
        { status: 404 }
      );
    }

    const now = new Date();
    const subscription = user.clinic.subscription;

    // Vérification améliorée
    const isActive = subscription?.status === "active" && 
                   subscription?.paymentStatus === "PAID" &&
                   subscription?.endDate > now;

    return NextResponse.json({
      isActive,
      status: subscription?.status || "none",
      endDate: subscription?.endDate || null,
      now: now.toISOString(),
      subscription // Ajouté pour le débogage
    });

  } catch (error) {
    console.error('[VERIFY ERROR]', error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}