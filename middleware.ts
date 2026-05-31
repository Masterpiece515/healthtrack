import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';
import { NextResponse } from 'next/server';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const session = req.auth;
  const isLoggedIn = !!session?.user;
  const { pathname } = req.nextUrl;

  // Маршруты приложения и админки — требуют авторизации
  const isProtected =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/settings')  ||
    pathname.startsWith('/profile')   ||
    pathname.startsWith('/history')   ||
    pathname.startsWith('/details')   ||
    pathname.startsWith('/recommendations') ||
    pathname.startsWith('/analytics') ||
    pathname.startsWith('/admin');

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Если уже залогинен — не пускаем на /login и /register
  if (isLoggedIn && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.png|.*\\.svg|.*\\.jpg).*)'],
};
