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
      console.error('[USER] User or clinic not found');
      return NextResponse.json(
        { error: 'Utilisateur non associé à une clinique' },
        { status: 403 }
      );
    }

    const { amount, consultationId, treatmentId, notes, paymentMethod } = await req.json();
    console.log('[REQUEST] Received data:', { amount, consultationId, treatmentId, notes, paymentMethod });

    if (!amount || amount <= 0) {
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
        }],
        checkout: {
            base_url: "https://checkout-paydunya.com/sandbox-checkout",
            send_sms: false,
            send_email: false
          },
      },
      store: {
        name: "Clinique Dentaire",
        website_url: appBaseUrl
      },
      payment_methods: {
        qr: true,
        wave: paymentMethod === 'wave',
        orange_money: paymentMethod === 'orange_money'
      },
      actions: {
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment-success?token={TOKEN}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment-cancel`
      },
      custom_data: {
        clinicId: user.clinicId,
        consultationId,
        bypass_authentication: true,
        treatmentId,
        createdById: user.id,
        isTest,
        paymentMethod
      }
    };

    console.log('[PAYDUNYA] Sending request to PayDunya...');
    const response = await fetch(`${baseUrl}/checkout-invoice/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    console.log('[PAYDUNYA] Response:', JSON.stringify(data, null, 2));
    
    if (!response.ok) {
        console.error('[PAYDUNYA] API Error:', data);
        return NextResponse.json(
          { error: data.message || 'Erreur PayDunya' },
          { status: 400 }
        );
      }
      
    
    const invoiceUrl = data.invoice_url || data.response_text;
    if (!data.token || !invoiceUrl) {
      console.error('[PAYDUNYA] Missing required fields in response');
      return NextResponse.json(
        { error: 'Réponse invalide du service de paiement' },
        { status: 500 }
      );
    }

    const payment = await prisma.payment.create({
        data: {
          amount,
          paymentMethod: paymentMethod?.toUpperCase() || 'MOBILE_MONEY',
          status: 'PENDING',
          paydunyaToken: data.token, // Stockez le token ici
        isTest,
        reference: data.token,
        notes: notes || `Paiement ${paymentMethod} initié`,
        clinicId: user.clinicId,
        consultationId: consultationId || null,
        treatmentId: treatmentId || null,
        createdById: user.id,
        paymentDate: new Date() 

      }
    });

    console.log('[SUCCESS] Final response:', {
        payment_url: invoiceUrl,
        token: data.token,
        payment_id: payment.id
      });
    return NextResponse.json({
        success: true,
        qr_code: data.qr_code || null,
        payment_url: data.invoice_url || data.response_text,
        token: data.token,
        amount: amount,
        payment_id: payment.id,
        method: paymentMethod || 'mobile_money'
      });

  } catch (error: any) {
    console.error('[ERROR]', error);
    return NextResponse.json(
      { 
        error: error.message || 'Erreur serveur',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      },
      { status: 500 }
    );
  }
}