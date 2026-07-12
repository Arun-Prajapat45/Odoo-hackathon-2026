import { NextResponse } from 'next/server';
import { queryDb } from '@/lib/db.js';
import { verifyToken } from '@/lib/auth.js';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const token = request.cookies.get('transitops_token')?.value || request.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await verifyToken(token);
    if (!user || !user.userId) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { read } = await request.json();
    const readVal = read ? 1 : 0;

    await queryDb('UPDATE notification SET read = ? WHERE id = ? AND user_id = ?', [readVal, id, user.userId]);

    return NextResponse.json({ success: true, message: 'Notification status updated.' }, { status: 200 });
  } catch (err) {
    console.error('[PUT /api/notifications/[id] Error]:', err);
    return NextResponse.json({ error: 'Failed to update notification.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const token = request.cookies.get('transitops_token')?.value || request.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await verifyToken(token);
    if (!user || !user.userId) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    await queryDb('DELETE FROM notification WHERE id = ? AND user_id = ?', [id, user.userId]);

    return NextResponse.json({ success: true, message: 'Notification deleted.' }, { status: 200 });
  } catch (err) {
    console.error('[DELETE /api/notifications/[id] Error]:', err);
    return NextResponse.json({ error: 'Failed to delete notification.' }, { status: 500 });
  }
}
