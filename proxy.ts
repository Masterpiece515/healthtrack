import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';
import { NextResponse } from 'next/server';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session?.user;

  const isProtected =
    nextUrl.pathname.startsWith('/dashboard') ||
    nextUrl.pathname.startsWith('/analytics') ||
    nextUrl.pathname.startsWith('/recommendations') ||
    nextUrl.pathname.startsWith('/profile') ||
    nextUrl.pathname.startsWith('/history') ||
    nextUrl.pathname.startsWith('/settings');

  const isAuthPage =
    nextUrl.pathname === '/login' ||
    nextUrl.pathname === '/register';

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL('/login', nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/analytics/:path*',
    '/recommendations/:path*',
    '/profile/:path*',
    '/history/:path*',
    '/settings/:path*',
    '/login',
    '/register',
  ],
};
