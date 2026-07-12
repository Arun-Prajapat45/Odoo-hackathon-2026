import { NextResponse } from 'next/server';
import { z } from 'zod';
import { queryDb } from '@/lib/db.js';
import { comparePassword, createToken, ROLE_ID_MAP } from '@/lib/auth.js';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

export async function POST(request) {
  try {
    const body = await request.json();

    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0]?.message || 'Invalid login payload' }, { status: 400 });
    }

    const { email, password } = validation.data;
    const cleanEmail = email.trim().toLowerCase();

    // Query user and joined role name
    const users = await queryDb(
      'SELECT u.*, r.name as role_name FROM user u JOIN role r ON u.role_id = r.id WHERE u.email = ?',
      [cleanEmail]
    );

    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const user = users[0];

    // Check account status
    if (user.status === 'SUSPENDED') {
      return NextResponse.json({ error: 'Your account has been suspended. Please contact the Fleet Manager or Safety Officer.' }, { status: 403 });
    }
    if (user.status === 'INACTIVE') {
      return NextResponse.json({ error: 'Your account is inactive. Please verify your email or contact support.' }, { status: 403 });
    }

    // Verify password against stored hash
    // Note: For pre-seeded hackathon accounts without hashed passwords during testing, fallback or verify hash
    let isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch && user.password_hash === password) {
      // Direct string comparison fallback if remote database was pre-seeded with plain text 'Transit@1234'
      isMatch = true;
    }

    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const roleName = user.role_name || ROLE_ID_MAP[user.role_id] || 'Driver';

    // Issue JWT
    const token = await createToken({
      userId: user.id,
      email: user.email,
      roleId: user.role_id,
      roleName: roleName
    });

    const response = NextResponse.json({
      success: true,
      message: 'Logged in successfully!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roleId: user.role_id,
        roleName: roleName,
        status: user.status
      }
    }, { status: 200 });

    response.cookies.set('transitops_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return response;
  } catch (err) {
    console.error('[Login API Error]:', err);
    return NextResponse.json({ error: 'An unexpected error occurred during login.' }, { status: 500 });
  }
}
