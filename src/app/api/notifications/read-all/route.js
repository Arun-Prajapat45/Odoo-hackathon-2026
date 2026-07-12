import { NextResponse } from 'next/server';
import { queryDb } from '@/lib/db.js';
import { verifyToken } from '@/lib/auth.js';

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read for current user
 */
export async function PUT(request) {
  try {
    const token = request.cookies.get('transitops_token')?.value || request.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await verifyToken(token);
    if (!user || !user.userId) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    await queryDb('UPDATE notification SET read = 1 WHERE user_id = ?', [user.userId]);

    return NextResponse.json({ success: true, message: 'All notifications marked as read.' }, { status: 200 });
  } catch (err) {
    console.error('[PUT /api/notifications/read-all Error]:', err);
    return NextResponse.json({ error: 'Failed to update notifications.' }, { status: 500 });
  }
}
