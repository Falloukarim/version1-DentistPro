import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest } from 'next/server';

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const request = req as NextRequest;
  const url = request.nextUrl.clone();

  // 1. Force HTTPS en production
  if (
    process.env.NODE_ENV === 'production' &&
    request.headers.get('x-forwarded-proto') !== 'https'
  ) {
    url.protocol = 'https:';
    return NextResponse.redirect(url, 301);
  }

  // 2. Routes publiques accessibles sans authentification
  const publicRoutes = ['/', '/sign-in', '/sign-up'];
  if (publicRoutes.includes(url.pathname)) {
    return NextResponse.next();
  }

  // 3. Gestion spéciale des routes PayDunya
  if (url.pathname.startsWith('/api/payments/')) {
    if (url.pathname === '/api/payments/webhook') {
      return NextResponse.next();
    }

    const token = url.searchParams.get('token');
    if (!token && !userId) {
      url.pathname = '/sign-in';
      return NextResponse.redirect(url);
    }
  }

  // 4. Redirection pour les routes protégées si non authentifié
  if (!userId) {
    url.pathname = '/sign-in';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|static|favicon.ico|api/auth|api/cron).*)',
  ],
}