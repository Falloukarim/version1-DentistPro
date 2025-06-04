import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function parseNestedParams(params: URLSearchParams): any {
  const result: Record<string, any> = {};

  for (const [key, value] of params.entries()) {
    const keys = key.replace(/\]/g, "").split("[");
    let current = result;

    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (i === keys.length - 1) {
        current[k] = value;
      } else {
        if (!(k in current)) current[k] = {};
        current = current[k];
      }
    }
  }

  return result;
}

export async function POST(req: Request) {
  try {
    const raw = await req.text();
    console.log("[Webhook] Données brutes reçues:", raw);

    const params = new URLSearchParams(raw);
    const parsed = parseNestedParams(params);

    const data = parsed.data ?? parsed;

    console.log("[Webhook] Objet 'data' reconstruit:", data);

    const clinicId = data?.custom_data?.clinicId;

    if (!clinicId) {
      console.warn("[Webhook] clinicId manquant");
      return NextResponse.json({ error: "clinicId manquant" }, { status: 400 });
    }

    if (data.status !== "completed") {
      console.warn("[Webhook] Statut invalide:", data.status);
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }

    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(now.getDate() + 30);

    const subscription = await prisma.subscription.upsert({
      where: { clinicId },
      update: {
        status: "active",
        paymentStatus: "PAYED",
        startDate: now,
        endDate,
      },
      create: {
        clinicId,
        status: "active",
        paymentStatus: "PAYED",
        startDate: now,
        endDate,
      },
    });

    // ✅ Mise à jour du champ isSubscribed de la clinique
    await prisma.clinic.update({
      where: { id: clinicId },
      data: { isSubscribed: true },
    });

    console.log("[Webhook] Abonnement enregistré et clinique mise à jour:", subscription);
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("[Webhook] Erreur serveur:", error);
    return NextResponse.json(
      {
        error: "Erreur serveur",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
