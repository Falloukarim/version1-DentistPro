import { NextResponse } from 'next/server';
import { getPaydunyaConfig, getAppBaseUrl } from '@/lib/paydunya';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  try {
    console.log('[PAYMENT] Starting payment generation...');
    const { userId } = await auth();
    
    if (!userId) {
      console.error('[AUTH] No user ID found');
      return NextResponse.json(
        { error: 'Authentification requise' }, 
        { status: 401 }
      );
    }

    console.log('[USER] Fetching user from database...');
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { 
        id: true,
        clinicId: true,
        firstName: true,
        lastName: true 
      }
    });

    if (!user || !user.clinicId) {
      console.error('[USER] User or clinic not found for clerkUserId:', userId);
      return NextResponse.json(
        { error: 'Utilisateur non associé à une clinique' },
        { status: 403 }
      );
    }

    const { amount, consultationId, treatmentId, notes } = await req.json();
    console.log('[REQUEST] Received data:', { amount, consultationId, treatmentId, notes });

    // Validation
    if (!amount || amount <= 0) {
      console.error('[VALIDATION] Invalid amount:', amount);
      return NextResponse.json(
        { error: 'Montant invalide' },
        { status: 400 }
      );
    }

    const { baseUrl, headers, isTest } = getPaydunyaConfig();
    const appBaseUrl = getAppBaseUrl();

    const payload = {
      invoice: {
        total_amount: Math.round(amount * 100),
        description: notes || `Paiement ${isTest ? 'TEST' : ''}`,
        items: [{
          name: "Consultation dentaire",
          quantity: 1,
          unit_price: Math.round(amount * 100),
          total_price: Math.round(amount * 100),
          description: `Paiement initié par ${user.firstName} ${user.lastName}`
        }]
      },
      store: {
        name: "Clinique Dentaire",
        website_url: appBaseUrl
      },
      payment_methods: {
        qr: true,
        wave: true,
        orange_money: true
      },
      actions: {
        callback_url: `${appBaseUrl}/api/payments/webhook`,
        return_url: `${appBaseUrl}/dashboard/payments`,
        cancel_url: `${appBaseUrl}/dashboard/payments`
      },
      custom_data: {
        clinicId: user.clinicId,
        consultationId,
        treatmentId,
        createdById: user.id,
        isTest
      }
    };

    console.log('[PAYDUNYA] Sending request to PayDunya with payload:', payload);
    const response = await fetch(`${baseUrl}/checkout-invoice/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log('[PAYDUNYA] Received response:', data);

    if (!response.ok) {
      console.error('[PAYDUNYA] API Error:', data);
      return NextResponse.json(
        { error: data.message || 'Erreur PayDunya' },
        { status: 400 }
      );
    }

    console.log('[DATABASE] Creating payment record...');
    const payment = await prisma.payment.create({
      data: {
        amount,
        paymentMethod: 'MOBILE_MONEY',
        paymentDate: new Date(),
        status: 'PENDING',
        isTest,
        paydunyaToken: data.token,
        reference: data.token,
        notes: notes || 'Paiement mobile money initié',
        clinicId: user.clinicId,
        consultationId: consultationId || null,
        treatmentId: treatmentId || null,
        createdById: user.id
      }
    });

    const responseData = {
      success: true,
      qr_code: data.response?.qr_code || null,
      payment_url: data.response?.invoice_url || `${appBaseUrl}/dashboard/payments?token=${data.token}`,
      token: data.token,
      amount: amount,
      payment_id: payment.id,
      method: data.response?.payment_method || 'mobile_money'
    };

    console.log('[SUCCESS] Returning response:', responseData);
    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('[ERROR] Full error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Erreur serveur',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}