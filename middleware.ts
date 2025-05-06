import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/consultations(.*)',
  '/appointments(.*)',
  '/products(.*)',
  '/payments(.*)',
  '/admin(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isProtectedRoute(req)) {
    console.log('✅ Route non protégée : passage direct');
    return NextResponse.next();
  }

  const { userId } = await auth();
  console.log('🔑 userId Clerk détecté :', userId);

  if (!userId) {
    console.log('⛔ Pas authentifié, redirection vers sign-in');
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }

  try {
    const verifyUrl = new URL('/api/auth/verify', req.nextUrl.origin);
    const verification = await fetch(verifyUrl, {
      headers: { 'Cookie': req.cookies.toString() },
      cache: 'no-store'
    });

    if (!verification.ok) {
      const data = await verification.json();
      
      // Cas spécial pour les SUPER_ADMIN en conflit
      if (data.error === 'Email conflict') {
        console.warn('Conflit détecté, tentative de résolution...');
        const resolveUrl = new URL('/api/auth/resolve-conflict', req.nextUrl.origin);
        const resolution = await fetch(resolveUrl, {
          method: 'POST',
          headers: { 'Cookie': req.cookies.toString() },
          cache: 'no-store'
        });
        
        if (resolution.ok) return NextResponse.next();
      }

      const redirectUrl = data.error === 'No clinic assigned' 
        ? '/select-clinic' 
        : '/unauthorized';
      return NextResponse.redirect(new URL(redirectUrl, req.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.redirect(new URL('/error', req.url));
  }
});