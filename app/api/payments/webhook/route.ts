import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    console.log('Webhook reçu:', JSON.stringify(data, null, 2));

    const token = data.token || data.custom_data?.token;
    if (!token) {
      return NextResponse.json({ error: 'Token manquant' }, { status: 400 });
    }

    await prisma.payment.updateMany({
      where: { paydunyaToken: token },
      data: { 
        status: 'COMPLETED',
        paymentDate: new Date(),
        reference: data.invoice?.receipt_number || token
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur webhook:', error);
    return NextResponse.json(
      { error: 'Erreur de traitement' },
      { status: 500 }
    );
  }
}