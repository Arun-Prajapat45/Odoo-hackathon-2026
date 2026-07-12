import { getDb } from '@/lib/db';

// GET /api/drivers/[id]/license — get license history
// POST /api/drivers/[id]/license — add a new license record

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const db = getDb();

    const driver = db.prepare(`SELECT id FROM driver WHERE id = ?`).get(id);
    if (!driver) return Response.json({ success: false, error: 'Driver not found' }, { status: 404 });

    const licenses = db.prepare(`
      SELECT * FROM driver_license WHERE driver_id = ? ORDER BY issue_date DESC
    `).all(id);

    return Response.json({ success: true, data: licenses });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { license_number, issue_date, expiry_date, category, document_url } = body;

    if (!license_number || !issue_date || !expiry_date || !category) {
      return Response.json(
        { success: false, error: 'Missing required fields: license_number, issue_date, expiry_date, category' },
        { status: 400 }
      );
    }

    // Validate: expiry must be after issue
    if (new Date(expiry_date) <= new Date(issue_date)) {
      return Response.json(
        { success: false, error: 'expiry_date must be after issue_date' },
        { status: 400 }
      );
    }

    const db = getDb();

    const driver = db.prepare(`SELECT id, user_id FROM driver WHERE id = ?`).get(id);
    if (!driver) return Response.json({ success: false, error: 'Driver not found' }, { status: 404 });

    const result = db.prepare(`
      INSERT INTO driver_license (driver_id, license_number, issue_date, expiry_date, category, document_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, license_number, issue_date, expiry_date, category, document_url ?? null);

    // Also update the current license on driver table
    db.prepare(`
      UPDATE driver SET license_number = ?, license_type = ?, license_expiry = ? WHERE id = ?
    `).run(license_number, category, expiry_date, id);

    // Check expiry and create notification
    const daysLeft = Math.ceil((new Date(expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 30) {
      const user = db.prepare(`SELECT name FROM user WHERE id = ?`).get(driver.user_id);
      db.prepare(`
        INSERT INTO notification (user_id, title, message, type)
        VALUES (?, ?, ?, ?)
      `).run(
        driver.user_id,
        'License Expiry Warning',
        `New license for ${user?.name ?? 'Driver'} expires in ${daysLeft} day(s) on ${expiry_date}.`,
        daysLeft <= 7 ? 'CRITICAL' : 'WARNING'
      );
    }

    const license = db.prepare(`SELECT * FROM driver_license WHERE id = ?`).get(result.lastInsertRowid);
    return Response.json({ success: true, data: license }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/drivers/[id]/license]', err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
