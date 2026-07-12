import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const getSecretKey = () => {
  const secret = process.env.JWT_SECRET || 'transitops_super_secret_jwt_key_2026_hackathon_production';
  return new TextEncoder().encode(secret);
};

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get('transitops_token')?.value || request.headers.get('authorization')?.split(' ')[1];

  let userPayload = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, getSecretKey());
      userPayload = payload;
    } catch (err) {
      userPayload = null;
    }
  }

  if (pathname.startsWith('/dashboard')) {
    if (!userPayload) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    const response = NextResponse.next();
    response.headers.set('x-user-id', String(userPayload.userId));
    response.headers.set('x-user-email', String(userPayload.email));
    response.headers.set('x-user-role', String(userPayload.roleName || 'Driver'));
    return response;
  }

  if (pathname === '/login' || pathname === '/register') {
    if (userPayload) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register']
};
