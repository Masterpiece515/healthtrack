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
    nextUrl.pathname.startsWith('/settings') ||
    nextUrl.pathname.startsWith('/details') ||
    nextUrl.pathname.startsWith('/admin');

  const isAuthPage =
    nextUrl.pathname === '/login' ||
    nextUrl.pathname === '/register';

  // Только полностью незалогиненные — на логин
  // (удалённых пользователей перехватывает layout через auth() с проверкой БД)
  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL('/login', nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
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
