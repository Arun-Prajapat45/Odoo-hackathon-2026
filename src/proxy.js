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

  const publicPaths = ['/login', '/register', '/api/auth/login', '/api/auth/register'];
  const isPublic = publicPaths.includes(pathname);

  if (!userPayload && !isPublic && !pathname.startsWith('/_next') && !pathname.startsWith('/favicon.ico') && !pathname.startsWith('/api/ai')) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (userPayload && isPublic) {
    if (pathname === '/login' || pathname === '/register') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  const response = NextResponse.next();
  if (userPayload) {
    response.headers.set('x-user-id', String(userPayload.userId));
    response.headers.set('x-user-email', String(userPayload.email));
    response.headers.set('x-user-role', String(userPayload.roleName || 'Driver'));
  }
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
