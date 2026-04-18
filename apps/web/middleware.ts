import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });
  const token = request.cookies.get('nous_session')?.value;

  // Protect auth-required pages
  const protectedPaths = ['/notes', '/todos', '/flashcards', '/passwords', '/admin'];
  const isProtected = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path));

  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  let user: { id: string } | null = null;
  let profile: { is_admin?: boolean; is_subscribed?: boolean } | null = null;

  if (token) {
    const sessionResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/profiles/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (sessionResponse.ok) {
      const payload = await sessionResponse.json();
      user = payload.user ?? null;
      profile = payload.profile ?? null;
    } else if (isProtected) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Protect admin-only pages
  if (request.nextUrl.pathname.startsWith('/admin') && user) {
    if (!profile?.is_admin) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Subscription gate: if logged in but not subscribed, block tool pages
  if (isProtected && user && !request.nextUrl.pathname.startsWith('/admin')) {
    if (!profile?.is_subscribed) {
      return NextResponse.redirect(new URL('/pricing', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
