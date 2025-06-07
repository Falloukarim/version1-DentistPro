import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import axios from "axios";

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: { clinic: true },
    });

    if (!user?.clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl) throw new Error("NEXT_PUBLIC_APP_URL is not defined");

    const invoiceData = {
      invoice: {
        items: [{
          name: "Abonnement mensuel",
          quantity: 1,
          unit_price: 5000,
          total_price: 5000,
          description: "Abonnement à l'application de gestion dentaire",
        }],
        total_amount: 5000,
        description: "Paiement de l'abonnement mensuel",
      },
      store: {
        name: user.clinic.name,
        tagline: "Application dentaire",
        postal_address: "Dakar, Sénégal",
        phone: user.clinic.phone || "0000000000",
        logo_url: user.clinic.logoUrl || "",
        website_url: baseUrl,
      },
      actions: {
        cancel_url: `${baseUrl}/dashboard`,
        return_url: `${baseUrl}/paydunya/confirmed`,
        callback_url: `${baseUrl}/api/paydunya/webhook`,
      },
      custom_data: {
        clinicId: user.clinic.id,
      },
    };

    const headers = {
      "Content-Type": "application/json",
      "PAYDUNYA-STORE-KEY": process.env.PAYDUNYA_STORE_KEY!,
      "PAYDUNYA-PRIVATE-KEY": process.env.PAYDUNYA_PRIVATE_KEY!,
      "PAYDUNYA-PUBLIC-KEY": process.env.PAYDUNYA_PUBLIC_KEY!,
      "PAYDUNYA-TOKEN": process.env.PAYDUNYA_TOKEN!,
    };

    // Essayez les deux endpoints possibles
    const endpoints = [
      "https://api.paydunya.com/v1/checkout-invoice/create",
      "https://app.paydunya.com/api/v1/checkout-invoice/create"
    ];

    let lastError;
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.post(endpoint, invoiceData, { headers });
        
        if (response.data.response_code === "00") {
          return NextResponse.json({
            url: response.data.response_text,
            token: response.data.token
          });
        }
        lastError = response.data.response_text;
      } catch (error) {
        lastError = error;
      }
    }

    throw new Error(lastError || "All PayDunya endpoints failed");

  } catch (error: any) {
    console.error("Full error:", {
      message: error.message,
      response: error.response?.data,
      config: error.config,
    });

    return NextResponse.json(
      { error: "Payment creation failed", details: error.message },
      { status: 500 }
    );
  }
}