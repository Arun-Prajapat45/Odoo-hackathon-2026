import { NextResponse } from 'next/server';
import { queryDb } from '@/lib/db.js';
import { verifyToken, hashPassword, hasRole } from '@/lib/auth.js';

/**
 * GET /api/users
 * Returns list of all registered users joined with role table
 */
export async function GET(request) {
  try {
    const token = request.cookies.get('transitops_token')?.value || request.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await verifyToken(token);
    if (!user || !hasRole(user.roleName, ['Admin', 'Fleet Manager', 'Safety Officer', 'Finance'])) {
      return NextResponse.json({ error: 'Permission denied. Only authorized staff can view user list.' }, { status: 403 });
    }

    const users = await queryDb(
      'SELECT u.id, u.name, u.email, u.role_id, u.status, r.name as role_name FROM user u JOIN role r ON u.role_id = r.id ORDER BY u.id DESC'
    );

    return NextResponse.json({ success: true, users }, { status: 200 });
  } catch (err) {
    console.error('[GET /api/users Error]:', err);
    return NextResponse.json({ error: 'Failed to retrieve users.' }, { status: 500 });
  }
}

/**
 * POST /api/users
 * Admin/Manager endpoint to directly create user accounts without public signup validation
 */
export async function POST(request) {
  try {
    const token = request.cookies.get('transitops_token')?.value || request.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await verifyToken(token);
    if (!user || !hasRole(user.roleName, ['Admin', 'Fleet Manager'])) {
      return NextResponse.json({ error: 'Permission denied. Only Admins and Fleet Managers can create users manually.' }, { status: 403 });
    }

    const { name, email, password, role_id, status } = await request.json();
    if (!name || !email || !password || !role_id) {
      return NextResponse.json({ error: 'Missing required fields (name, email, password, role_id)' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await queryDb('SELECT id FROM user WHERE email = ?', [cleanEmail]);
    if (existing && existing.length > 0) {
      return NextResponse.json({ error: `User with email ${cleanEmail} already exists.` }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    await queryDb(
      'INSERT INTO user (name, email, password_hash, role_id, status) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), cleanEmail, passwordHash, role_id, status || 'ACTIVE']
    );

    const inserted = await queryDb(
      'SELECT u.id, u.name, u.email, u.role_id, u.status, r.name as role_name FROM user u JOIN role r ON u.role_id = r.id WHERE u.email = ?',
      [cleanEmail]
    );

    return NextResponse.json({ success: true, message: 'User created successfully.', user: inserted[0] }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/users Error]:', err);
    return NextResponse.json({ error: 'Failed to create user.' }, { status: 500 });
  }
}
