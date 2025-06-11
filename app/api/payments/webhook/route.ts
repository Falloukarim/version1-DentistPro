import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    console.log('Webhook received:', JSON.stringify(data, null, 2));

    const { custom_data, status, token, invoice } = data;

    if (!token) {
      console.error('No token in webhook payload');
      return NextResponse.json(
        { error: 'Token manquant' },
        { status: 400 }
      );
    }

    const updateData = {
      status: status === 'completed' ? 'COMPLETED' : 'FAILED',
      paymentDate: new Date(),
      reference: invoice?.receipt_number || token,
      notes: `Paiement ${status} via ${custom_data?.paymentMethod || 'mobile_money'}`
    };

    console.log('Updating payment with:', updateData);
    const updatedPayment = await prisma.payment.updateMany({
      where: { paydunyaToken: token },
      data: updateData
    });

    console.log('Payment updated:', updatedPayment);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Erreur de traitement' },
      { status: 500 }
    );
  }
}