import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import axios from "axios";

export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      console.error("Erreur d'authentification: userId manquant");
      return NextResponse.json(
        { error: "Authentification requise" }, 
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: { clinic: true },
    });

    if (!user?.clinic) {
      console.error("Clinique introuvable pour l'utilisateur:", userId);
      return NextResponse.json(
        { error: "Clinique introuvable" }, 
        { status: 404 }
      );
    }

    const clinic = user.clinic;

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
    const response = await axios.post(
        "https://app.paydunya.com/api/v1/checkout-invoice/create",
        invoiceData,
        {
            headers: {
                "Content-Type": "application/json",
                "PAYDUNYA-MASTER-KEY": process.env.PAYDUNYA_MASTER_KEY!,
                "PAYDUNYA-PRIVATE-KEY": process.env.PAYDUNYA_PRIVATE_KEY!,
                "PAYDUNYA-TOKEN": process.env.PAYDUNYA_TOKEN!,
                "PAYDUNYA-PUBLIC-KEY": process.env.PAYDUNYA_PUBLIC_KEY!,
                "PAYDUNYA-STORE-KEY": process.env.PAYDUNYA_STORE_KEY!,
              },
        }
      );
  
      // Correction: PayDunya retourne l'URL dans response_text
      const invoiceUrl = response.data.response_text;
  
      if (response.data.response_code === "00" && invoiceUrl) {
        return NextResponse.json({ 
          url: invoiceUrl,
          token: response.data.token 
        });
      }
  
      throw new Error(response.data.response_text || "Erreur inconnue de PayDunya");
      
    } catch (error: any) {
      console.error("Erreur complète:", {
        message: error.message,
        response: error.response?.data,
        stack: error.stack
      });
      
      return NextResponse.json(
        { 
          error: "Erreur lors de la création du paiement",
          details: error.response?.data || error.message 
        },
        { status: 500 }
      );
    }
  }