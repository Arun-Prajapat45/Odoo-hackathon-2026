import { NextResponse } from 'next/server';
import { queryDb } from '@/lib/db.js';
import { verifyToken } from '@/lib/auth.js';

/**
 * GET /api/notifications
 * Retrieves notifications for the logged in user
 */
export async function GET(request) {
  try {
    const token = request.cookies.get('transitops_token')?.value || request.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await verifyToken(token);
    if (!user || !user.userId) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const notifications = await queryDb(
      'SELECT * FROM notification WHERE user_id = ? ORDER BY id DESC LIMIT 50',
      [user.userId]
    );

    return NextResponse.json({ success: true, notifications }, { status: 200 });
  } catch (err) {
    console.error('[GET /api/notifications Error]:', err);
    return NextResponse.json({ error: 'Failed to retrieve notifications.' }, { status: 500 });
  }
}

/**
 * POST /api/notifications
 * Creates a new notification for a user
 */
export async function POST(request) {
  try {
    const token = request.cookies.get('transitops_token')?.value || request.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await verifyToken(token);
    if (!user || !user.userId) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { title, message, type, target_user_id } = await request.json();
    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message are required.' }, { status: 400 });
    }

    const notifType = ['INFO', 'WARNING', 'CRITICAL'].includes(type) ? type : 'INFO';

    if (target_user_id) {
      // Send to a specific user
      await queryDb(
        'INSERT INTO notification (user_id, title, message, type, `read`, created_at) VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)',
        [target_user_id, title, message, notifType]
      );
      return NextResponse.json({ success: true, message: 'Notification sent.' }, { status: 201 });
    }

    // Broadcast to ALL users
    const allUsers = await queryDb('SELECT id FROM user');
    if (!allUsers || allUsers.length === 0) {
      return NextResponse.json({ error: 'No users found to broadcast to.' }, { status: 400 });
    }

    for (const u of allUsers) {
      const isRead = u.id === user.userId ? 1 : 0;
      await queryDb(
        'INSERT INTO notification (user_id, title, message, type, `read`, created_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
        [u.id, title, message, notifType, isRead]
      );
    }

    return NextResponse.json({ success: true, message: `Broadcast sent to ${allUsers.length} users.` }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/notifications Error]:', err);
    return NextResponse.json({ error: 'Failed to create notification.' }, { status: 500 });
  }
}
