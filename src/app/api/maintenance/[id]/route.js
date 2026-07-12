import { getDb } from '@/lib/db';

// GET /api/maintenance/[id] — get single record
// PUT /api/maintenance/[id] — update record (including closing → vehicle becomes AVAILABLE)
// DELETE /api/maintenance/[id] — delete record

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const db = getDb();

    const record = db.prepare(`
      SELECT m.*, v.registration_number, v.vehicle_name, v.status as vehicle_status,
             u.name as created_by_name
      FROM maintenance m
      JOIN vehicle v ON v.id = m.vehicle_id
      JOIN user u ON u.id = m.created_by
      WHERE m.id = ?
    `).get(id);

    if (!record) {
      return Response.json({ success: false, error: 'Maintenance record not found' }, { status: 404 });
    }

    return Response.json({ success: true, data: record });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const db = getDb();

    const existing = db.prepare(`SELECT * FROM maintenance WHERE id = ?`).get(id);
    if (!existing) {
      return Response.json({ success: false, error: 'Maintenance record not found' }, { status: 404 });
    }

    const {
      maintenance_type = existing.maintenance_type,
      description = existing.description,
      priority = existing.priority,
      cost = existing.cost,
      status = existing.status,
      scheduled_date = existing.scheduled_date,
      completed_date = existing.completed_date,
    } = body;

    db.prepare(`
      UPDATE maintenance
      SET maintenance_type = ?, description = ?, priority = ?,
          cost = ?, status = ?, scheduled_date = ?, completed_date = ?
      WHERE id = ?
    `).run(maintenance_type, description, priority, cost, status, scheduled_date, completed_date, id);

    // Business Rule: Closing maintenance → vehicle becomes AVAILABLE
    if (status === 'CLOSED' && existing.status === 'ACTIVE') {
      db.prepare(`UPDATE vehicle SET status = 'AVAILABLE' WHERE id = ?`).run(existing.vehicle_id);

      // Notify fleet managers that vehicle is back
      notifyVehicleAvailable(db, existing.vehicle_id, maintenance_type);
    }

    const updated = db.prepare(`
      SELECT m.*, v.registration_number, v.vehicle_name, v.status as vehicle_status
      FROM maintenance m JOIN vehicle v ON v.id = m.vehicle_id WHERE m.id = ?
    `).get(id);

    return Response.json({ success: true, data: updated });
  } catch (err) {
    console.error('[PUT /api/maintenance/[id]]', err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const db = getDb();

    const existing = db.prepare(`SELECT * FROM maintenance WHERE id = ?`).get(id);
    if (!existing) {
      return Response.json({ success: false, error: 'Maintenance record not found' }, { status: 404 });
    }

    db.prepare(`DELETE FROM maintenance WHERE id = ?`).run(id);

    // If we delete an active maintenance, release the vehicle back to AVAILABLE
    if (existing.status === 'ACTIVE') {
      db.prepare(`UPDATE vehicle SET status = 'AVAILABLE' WHERE id = ?`).run(existing.vehicle_id);
    }

    return Response.json({ success: true, message: 'Maintenance record deleted.' });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

function notifyVehicleAvailable(db, vehicleId, maintenanceType) {
  try {
    const vehicle = db.prepare(`SELECT registration_number, vehicle_name FROM vehicle WHERE id = ?`).get(vehicleId);
    const fleetManagers = db.prepare(`
      SELECT u.id FROM user u JOIN role r ON r.id = u.role_id WHERE r.name = 'Fleet Manager'
    `).all();

    const stmt = db.prepare(`
      INSERT INTO notification (user_id, title, message, type) VALUES (?, ?, ?, 'INFO')
    `);

    for (const mgr of fleetManagers) {
      stmt.run(
        mgr.id,
        'Vehicle Available',
        `Vehicle ${vehicle?.registration_number ?? vehicleId} is now AVAILABLE after completing maintenance: ${maintenanceType}.`
      );
    }
  } catch (e) {
    console.error('[Notification] Vehicle available notify failed:', e);
  }
}
