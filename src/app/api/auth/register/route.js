import { NextResponse } from 'next/server';
import { z } from 'zod';
import { queryDb } from '@/lib/db.js';
import { hashPassword, createToken, ROLE_ID_MAP } from '@/lib/auth.js';
import { verifyRealEmail } from '@/lib/email-verify.js';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long').max(120, 'Name is too long'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter (A-Z)')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter (a-z)')
    .regex(/[0-9]/, 'Password must contain at least one number (0-9)')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character (!@#$%^&*)'),
  role_id: z.coerce.number().int().min(2, 'Role must be selected').max(5, 'Invalid role selected')
});

export async function POST(request) {
  try {
    const body = await request.json();

    // Normalize: frontend may send roleId or role_id
    if (body.roleId !== undefined && body.role_id === undefined) {
      body.role_id = body.roleId;
    }

    // 1. Zod schema validation
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.errors[0]?.message || 'Invalid registration payload';
      return NextResponse.json({ error: firstError, details: validation.error.errors }, { status: 400 });
    }

    const { name, email, password, role_id } = validation.data;
    const cleanEmail = email.trim().toLowerCase();

    // 2. 3-Tier Real Email Verification (MX lookup & Disposable blocklist)
    const emailCheck = await verifyRealEmail(cleanEmail);
    if (!emailCheck.valid) {
      return NextResponse.json({ error: emailCheck.error }, { status: 400 });
    }

    // 3. Database uniqueness check
    const existingUsers = await queryDb('SELECT id FROM user WHERE email = ?', [cleanEmail]);
    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json({ 
        error: `An account with email "${cleanEmail}" is already registered in TransitOps.` 
      }, { status: 409 });
    }

    // 4. Hash password and insert
    const passwordHash = await hashPassword(password);
    
    await queryDb(
      'INSERT INTO user (name, email, password_hash, role_id, status) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), cleanEmail, passwordHash, role_id, 'ACTIVE']
    );

    // 5. Retrieve newly inserted user profile
    const users = await queryDb(
      'SELECT u.id, u.name, u.email, u.role_id, u.status, r.name as role_name FROM user u JOIN role r ON u.role_id = r.id WHERE u.email = ?',
      [cleanEmail]
    );

    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'User registration succeeded but profile retrieval failed.' }, { status: 500 });
    }

    const newUser = users[0];
    const roleName = newUser.role_name || ROLE_ID_MAP[newUser.role_id] || 'Driver';

    // 6. Create JWT token
    const token = await createToken({
      userId: newUser.id,
      email: newUser.email,
      roleId: newUser.role_id,
      roleName: roleName
    });

    const response = NextResponse.json({
      success: true,
      message: 'Account registered successfully!',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        roleId: newUser.role_id,
        roleName: roleName,
        status: newUser.status
      }
    }, { status: 201 });

    // 7. Set HTTP-only secure cookie
    response.cookies.set('transitops_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return response;
  } catch (err) {
    console.error('[Register API Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error during registration.' }, { status: 500 });
  }
}
