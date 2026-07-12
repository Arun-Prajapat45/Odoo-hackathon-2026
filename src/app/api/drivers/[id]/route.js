import { queryDb } from '@/lib/db';

// GET /api/drivers/[id] — get single driver with license history
// PUT /api/drivers/[id] — update driver details / status
// DELETE /api/drivers/[id] — delete driver

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const driver = (await queryDb(`
      SELECT d.*, u.name, u.email, u.status as user_status
      FROM driver d
      JOIN user u ON u.id = d.user_id
      WHERE d.id = ?
    `, [id]))?.[0];

    if (!driver) {
      return Response.json({ success: false, error: 'Driver not found' }, { status: 404 });
    }

    // Fetch license history
    const licenses = await queryDb(`
      SELECT * FROM driver_license WHERE driver_id = ? ORDER BY issue_date DESC
    `, [id]);

    // Fetch trip history (last 10)
    const trips = await queryDb(`
      SELECT id, trip_number, source, destination, status, planned_start, actual_start, actual_end, revenue
      FROM trip WHERE driver_id = ? ORDER BY created_at DESC LIMIT 10
    `, [id]);

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
    const existing = (await queryDb(`SELECT * FROM driver WHERE id = ?`, [id]))?.[0];
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

    await queryDb(`
      UPDATE driver
      SET license_number = ?, license_type = ?, license_expiry = ?,
          phone = ?, status = ?, safety_score = ?
      WHERE id = ?
    `, [license_number, license_type, license_expiry, phone, status, safety_score, id]);

    // Re-check license expiry if expiry date changed
    if (body.license_expiry) {
      const updatedDriver = (await queryDb(`
        SELECT d.*, u.name FROM driver d JOIN user u ON u.id = d.user_id WHERE d.id = ?
      `, [id]))?.[0];
      await checkAndNotify(updatedDriver);
    }

    const updated = (await queryDb(`
      SELECT d.*, u.name, u.email FROM driver d JOIN user u ON u.id = d.user_id WHERE d.id = ?
    `, [id]))?.[0];

    return Response.json({ success: true, data: updated });
  } catch (err) {
    console.error('[PUT /api/drivers/[id]]', err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const existing = (await queryDb(`SELECT * FROM driver WHERE id = ?`, [id]))?.[0];
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
    await queryDb(`DELETE FROM driver WHERE id = ?`, [id]);

    return Response.json({ success: true, message: 'Driver deleted.' });
  } catch (err) {
    console.error('[DELETE /api/drivers/[id]]', err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

async function checkAndNotify(driver) {
  try {
    const expiry = new Date(driver.license_expiry);
    const today = new Date();
    const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 30) {
      await queryDb(`
        INSERT INTO notification (user_id, title, message, type)
        VALUES (?, ?, ?, ?)
      `, [
        driver.user_id,
        'License Expiry Warning',
        `Driver ${driver.name}'s license expires in ${daysLeft} day(s) on ${driver.license_expiry}.`,
        daysLeft <= 7 ? 'CRITICAL' : 'WARNING'
      ]);
    }
  } catch (e) {
    console.error('[Notification] check failed:', e);
  }
}
