import { getDb } from '@/lib/db';

// GET /api/drivers/[id] — get single driver with license history
// PUT /api/drivers/[id] — update driver details / status
// DELETE /api/drivers/[id] — delete driver

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const db = getDb();

    const driver = db.prepare(`
      SELECT d.*, u.name, u.email, u.status as user_status
      FROM driver d
      JOIN user u ON u.id = d.user_id
      WHERE d.id = ?
    `).get(id);

    if (!driver) {
      return Response.json({ success: false, error: 'Driver not found' }, { status: 404 });
    }

    // Fetch license history
    const licenses = db.prepare(`
      SELECT * FROM driver_license WHERE driver_id = ? ORDER BY issue_date DESC
    `).all(id);

    // Fetch trip history (last 10)
    const trips = db.prepare(`
      SELECT id, trip_number, source, destination, status, planned_start, actual_start, actual_end, revenue
      FROM trip WHERE driver_id = ? ORDER BY created_at DESC LIMIT 10
    `).all(id);

    return Response.json({ success: true, data: { ...driver, licenses, trips } });
  } catch (err) {
    console.error('[GET /api/drivers/[id]]', err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const db = getDb();

    const existing = db.prepare(`SELECT * FROM driver WHERE id = ?`).get(id);
    if (!existing) {
      return Response.json({ success: false, error: 'Driver not found' }, { status: 404 });
    }

    // Validate: cannot un-suspend a driver on a trip
    if (body.status && existing.status === 'ON_TRIP' && body.status === 'SUSPENDED') {
      return Response.json(
        { success: false, error: 'Cannot suspend a driver currently on a trip.' },
        { status: 409 }
      );
    }

    const {
      license_number = existing.license_number,
      license_type = existing.license_type,
      license_expiry = existing.license_expiry,
      phone = existing.phone,
      status = existing.status,
      safety_score = existing.safety_score,
    } = body;

    db.prepare(`
      UPDATE driver
      SET license_number = ?, license_type = ?, license_expiry = ?,
          phone = ?, status = ?, safety_score = ?
      WHERE id = ?
    `).run(license_number, license_type, license_expiry, phone, status, safety_score, id);

    // Re-check license expiry if expiry date changed
    if (body.license_expiry) {
      const updatedDriver = db.prepare(`
        SELECT d.*, u.name FROM driver d JOIN user u ON u.id = d.user_id WHERE d.id = ?
      `).get(id);
      checkAndNotify(db, updatedDriver);
    }

    const updated = db.prepare(`
      SELECT d.*, u.name, u.email FROM driver d JOIN user u ON u.id = d.user_id WHERE d.id = ?
    `).get(id);

    return Response.json({ success: true, data: updated });
  } catch (err) {
    console.error('[PUT /api/drivers/[id]]', err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const db = getDb();

    const existing = db.prepare(`SELECT * FROM driver WHERE id = ?`).get(id);
    if (!existing) {
      return Response.json({ success: false, error: 'Driver not found' }, { status: 404 });
    }

    if (existing.status === 'ON_TRIP') {
      return Response.json(
        { success: false, error: 'Cannot delete a driver currently on a trip.' },
        { status: 409 }
      );
    }

    // Cascades handled by FK: driver_license, trip (restricted), driver
    db.prepare(`DELETE FROM driver WHERE id = ?`).run(id);

    return Response.json({ success: true, message: 'Driver deleted.' });
  } catch (err) {
    console.error('[DELETE /api/drivers/[id]]', err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

function checkAndNotify(db, driver) {
  try {
    const expiry = new Date(driver.license_expiry);
    const today = new Date();
    const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 30) {
      db.prepare(`
        INSERT INTO notification (user_id, title, message, type)
        VALUES (?, ?, ?, ?)
      `).run(
        driver.user_id,
        'License Expiry Warning',
        `Driver ${driver.name}'s license expires in ${daysLeft} day(s) on ${driver.license_expiry}.`,
        daysLeft <= 7 ? 'CRITICAL' : 'WARNING'
      );
    }
  } catch (e) {
    console.error('[Notification] check failed:', e);
  }
}
