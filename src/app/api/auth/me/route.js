import { NextResponse } from 'next/server';
import { verifyToken, ROLE_ID_MAP } from '@/lib/auth.js';
import { queryDb } from '@/lib/db.js';

export async function GET(request) {
  try {
    const cookie = request.cookies.get('transitops_token')?.value;
    const authHeader = request.headers.get('authorization')?.split(' ')[1];
    const token = cookie || authHeader;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized. No session token found.' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Session expired or invalid token.' }, { status: 401 });
    }

    const users = await queryDb(
      'SELECT u.id, u.name, u.email, u.role_id, u.status, r.name as role_name FROM user u JOIN role r ON u.role_id = r.id WHERE u.id = ?',
      [payload.userId]
    );

    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'User account not found.' }, { status: 404 });
    }

    const user = users[0];
    const roleName = user.role_name || ROLE_ID_MAP[user.role_id] || 'Driver';

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roleId: user.role_id,
        roleName: roleName,
        status: user.status
      }
    }, { status: 200 });
  } catch (err) {
    console.error('[Auth Me API Error]:', err);
    return NextResponse.json({ error: 'Internal server error validating session.' }, { status: 500 });
  }
}
