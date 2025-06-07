import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import axios from "axios";

export async function POST() {
  try {
    console.log("[SUBSCRIBE] Début de la requête d'abonnement");

    // Authentification
    const { userId } = await auth();
    console.log("[SUBSCRIBE] UserID récupéré:", userId);

    if (!userId) {
      console.error("[SUBSCRIBE] Erreur d'authentification: userId manquant");
      return NextResponse.json(
        { error: "Authentification requise" }, 
        { status: 401 }
      );
    }

    // Récupération de l'utilisateur et de la clinique
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: { clinic: true },
    });
    console.log("[SUBSCRIBE] Utilisateur trouvé:", user?.id);

    if (!user?.clinic) {
      console.error("[SUBSCRIBE] Clinique introuvable pour l'utilisateur:", userId);
      return NextResponse.json(
        { error: "Clinique introuvable" }, 
        { status: 404 }
      );
    }

    const clinic = user.clinic;
    console.log("[SUBSCRIBE] Clinique trouvée:", clinic.id, clinic.name);

    // Construction des données de facturation
    const invoiceData = {
      invoice: {
        items: [
          {
            name: "Abonnement mensuel",
            quantity: 1,
            unit_price: 5000,
            total_price: 5000,
            description: "Abonnement à l'application de gestion dentaire",
          },
        ],
        total_amount: 5000,
        description: "Paiement de l'abonnement mensuel",
      },
      store: {
        name: clinic.name,
        tagline: "Application dentaire",
        postal_address: "Dakar, Sénégal",
        phone: clinic.phone || "0000000000",
        logo_url: clinic.logoUrl || "",
        website_url: process.env.NEXT_PUBLIC_APP_URL,
      },
      actions: {
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/paydunya/confirmed`,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/paydunya/webhook`,
      },
      custom_data: {
        clinicId: clinic.id,
      },
    };

    console.log("[SUBSCRIBE] Données de facturation construites:", JSON.stringify(invoiceData, null, 2));

    // Préparation des headers
    const headers = {
      "Content-Type": "application/json",
      "PAYDUNYA-STORE-KEY": process.env.PAYDUNYA_STORE_KEY!,
      "PAYDUNYA-PRIVATE-KEY": process.env.PAYDUNYA_PRIVATE_KEY!,
      "PAYDUNYA-PUBLIC-KEY": process.env.PAYDUNYA_PUBLIC_KEY!,
      "PAYDUNYA-TOKEN": process.env.PAYDUNYA_TOKEN!,
    };

    console.log("[SUBSCRIBE] En-têtes préparés:", JSON.stringify(headers, null, 2));
    console.log("[SUBSCRIBE] Envoi de la requête à PayDunya...");

    // Envoi de la requête à PayDunya
    const response = await axios.post(
      "https://app.paydunya.com/api/v1/checkout-invoice/create",
      invoiceData,
      { headers }
    );

    console.log("[SUBSCRIBE] Réponse de PayDunya:", JSON.stringify(response.data, null, 2));

    // Vérification de la réponse
    const invoiceUrl = response.data.response_text;

    if (response.data.response_code === "00" && invoiceUrl) {
      console.log("[SUBSCRIBE] Paiement créé avec succès. URL:", invoiceUrl);
      return NextResponse.json({ 
        url: invoiceUrl,
        token: response.data.token 
      });
    }

    console.error("[SUBSCRIBE] Erreur dans la réponse PayDunya:", response.data.response_text);
    throw new Error(response.data.response_text || "Erreur inconnue de PayDunya");
      
  } catch (error: any) {
    console.error("[SUBSCRIBE] Erreur complète:", {
      message: error.message,
      response: error.response?.data,
      stack: error.stack,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        data: error.config?.data,
      }
    });
    
    return NextResponse.json(
      { 
        error: "Erreur lors de la création du paiement",
        details: error.response?.data || error.message,
        config: {
          url: error.config?.url,
          method: error.config?.method,
        }
      },
      { status: 500 }
    );
  }
}