import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  
  // URL absolue avec HTTPS forcé
  const successUrl = new URL(
    `/dashboard/payments?status=success&token=${token}`, 
    process.env.NEXT_PUBLIC_APP_URL || 'https://klinika-rouge.vercel.app'
  );

  return NextResponse.redirect(successUrl);
}