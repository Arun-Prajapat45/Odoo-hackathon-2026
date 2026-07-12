import { getDb } from '@/lib/db';

// GET /api/notifications?user_id=&unread=true — list notifications
// POST /api/notifications/[id]/read — mark as read

export async function GET(request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const unreadOnly = searchParams.get('unread') === 'true';

    let query = `SELECT * FROM notification`;
    const conditions = [];
    const args = [];

    if (userId) {
      conditions.push('user_id = ?');
      args.push(userId);
    }
    if (unreadOnly) {
      conditions.push('read = 0');
    }

    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY created_at DESC LIMIT 50';

    const notifications = db.prepare(query).all(...args);
    return Response.json({ success: true, data: notifications });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST /api/notifications — trigger license & maintenance due check manually
export async function POST() {
  try {
    const db = getDb();
    let created = 0;

    // Check all drivers for license expiry in ≤ 30 days
    const drivers = db.prepare(`
      SELECT d.id, d.user_id, d.license_number, d.license_expiry, u.name
      FROM driver d JOIN user u ON u.id = d.user_id
      WHERE d.status != 'SUSPENDED'
    `).all();

    const notifyStmt = db.prepare(`
      INSERT INTO notification (user_id, title, message, type) VALUES (?, ?, ?, ?)
    `);

    for (const driver of drivers) {
      const daysLeft = Math.ceil((new Date(driver.license_expiry) - new Date()) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 30) {
        notifyStmt.run(
          driver.user_id,
          'License Expiry Warning',
          `License ${driver.license_number} for ${driver.name} expires in ${daysLeft} day(s) on ${driver.license_expiry}.`,
          daysLeft <= 7 ? 'CRITICAL' : 'WARNING'
        );
        created++;
      }
    }

    // Check maintenance due soon (scheduled_date within 3 days)
    const maintenances = db.prepare(`
      SELECT m.id, m.maintenance_type, m.scheduled_date, m.priority,
             v.registration_number, v.vehicle_name,
             u.id as mgr_id
      FROM maintenance m
      JOIN vehicle v ON v.id = m.vehicle_id
      JOIN user u ON u.role_id = (SELECT id FROM role WHERE name = 'Fleet Manager')
      WHERE m.status = 'ACTIVE' AND m.scheduled_date IS NOT NULL
        AND date(m.scheduled_date) <= date('now', '+3 days')
    `).all();

    for (const m of maintenances) {
      notifyStmt.run(
        m.mgr_id,
        'Maintenance Due Soon',
        `Maintenance "${m.maintenance_type}" for ${m.registration_number} is scheduled on ${m.scheduled_date}. Priority: ${m.priority}.`,
        m.priority === 'CRITICAL' ? 'CRITICAL' : 'WARNING'
      );
      created++;
    }

    return Response.json({ success: true, message: `${created} notifications created.` });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
