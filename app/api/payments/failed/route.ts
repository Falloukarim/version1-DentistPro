import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  
  return NextResponse.redirect(
    new URL(`/dashboard/payments?status=failed&token=${token}`, req.url)
  );
}