import { getDb } from '@/lib/db';

// POST /api/notifications/[id]/read — mark a notification as read
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const db = getDb();

    const notif = db.prepare(`SELECT id FROM notification WHERE id = ?`).get(id);
    if (!notif) return Response.json({ success: false, error: 'Notification not found' }, { status: 404 });

    db.prepare(`UPDATE notification SET \`read\` = 1 WHERE id = ?`).run(id);
    return Response.json({ success: true, message: 'Marked as read.' });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
