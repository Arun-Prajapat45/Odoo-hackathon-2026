import { queryDb } from '@/lib/db';

// GET /api/drivers/[id]/license — get license history
// POST /api/drivers/[id]/license — add a new license record

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const driver = (await queryDb(`SELECT id FROM driver WHERE id = ?`, [id]))?.[0];
    if (!driver) return Response.json({ success: false, error: 'Driver not found' }, { status: 404 });

    const licenses = await queryDb(`
      SELECT * FROM driver_license WHERE driver_id = ? ORDER BY issue_date DESC
    `, [id]);

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

    const driver = (await queryDb(`SELECT id, user_id FROM driver WHERE id = ?`, [id]))?.[0];
    if (!driver) return Response.json({ success: false, error: 'Driver not found' }, { status: 404 });

    const result = await queryDb(`
      INSERT INTO driver_license (driver_id, license_number, issue_date, expiry_date, category, document_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, license_number, issue_date, expiry_date, category, document_url ?? null]);

    // Also update the current license on driver table
    await queryDb(`
      UPDATE driver SET license_number = ?, license_type = ?, license_expiry = ? WHERE id = ?
    `, [license_number, category, expiry_date, id]);

    // Check expiry and create notification
    const daysLeft = Math.ceil((new Date(expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 30) {
      const user = (await queryDb(`SELECT name FROM user WHERE id = ?`, [driver.user_id]))?.[0];
      await queryDb(`
        INSERT INTO notification (user_id, title, message, type)
        VALUES (?, ?, ?, ?)
      `, [
        driver.user_id,
        'License Expiry Warning',
        `New license for ${user?.name ?? 'Driver'} expires in ${daysLeft} day(s) on ${expiry_date}.`,
        daysLeft <= 7 ? 'CRITICAL' : 'WARNING'
      ]);
    }

    const license = (await queryDb(`SELECT * FROM driver_license WHERE driver_id = ? ORDER BY id DESC LIMIT 1`, [id]))?.[0];
    return Response.json({ success: true, data: license }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/drivers/[id]/license]', err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
