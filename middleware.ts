import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest } from 'next/server';

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  const request = req as NextRequest;
  const url = request.nextUrl.clone();

  // 1. Debug des claims de session
  console.log('Session claims:', sessionClaims);

  // 2. Force HTTPS en production
  if (
    process.env.NODE_ENV === 'production' &&
    request.headers.get('x-forwarded-proto') !== 'https'
  ) {
    url.protocol = 'https:';
    return NextResponse.redirect(url, 301);
  }

  // 3. Gestion spéciale des routes PayDunya
  if (url.pathname.startsWith('/api/payments/')) {
    // Autorise l'accès sans authentification aux webhooks PayDunya
    if (url.pathname === '/api/payments/webhook') {
      return NextResponse.next();
    }

    // Vérifie les tokens pour les autres routes de paiement
    const token = url.searchParams.get('token');
    if (!token && !userId) {
      url.pathname = '/sign-in';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|static|favicon.ico|api/auth|api/cron).*)',
  ],
}