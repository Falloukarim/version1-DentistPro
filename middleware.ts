import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/consultations(.*)',
  '/appointments(.*)',
  '/products(.*)',
  '/payments(.*)',
  '/admin(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isProtectedRoute(req)) return NextResponse.next();

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }

  // Ne pas utiliser Prisma ici : la logique d'abonnement est déplacée dans la page elle-même
  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next|static|favicon.ico|api/auth).*)'],
};
