import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { custom_data, status, token, invoice } = data;

    // Mise à jour du paiement
    await prisma.payment.updateMany({
      where: { paydunyaToken: token },
      data: {
        status: status === 'completed' ? 'COMPLETED' : 'FAILED',
        paymentDate: new Date(),
        reference: invoice?.receipt_number || token,
        notes: `Paiement ${status} via PayDunya`
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