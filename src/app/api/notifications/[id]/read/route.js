import { queryDb } from '@/lib/db';

// POST /api/notifications/[id]/read — mark a notification as read
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const notif = (await queryDb(`SELECT id FROM notification WHERE id = ?`, [id]))?.[0];
    if (!notif) return Response.json({ success: false, error: 'Notification not found' }, { status: 404 });

    await queryDb(`UPDATE notification SET \`read\` = 1 WHERE id = ?`, [id]);
    return Response.json({ success: true, message: 'Marked as read.' });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
