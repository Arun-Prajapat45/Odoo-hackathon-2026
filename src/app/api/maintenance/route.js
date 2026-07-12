import { queryDb } from '@/lib/db';

// GET /api/maintenance — list all maintenance records (optional filters: ?vehicle_id=&status=)
// POST /api/maintenance — create maintenance record → sets vehicle to IN_SHOP

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('vehicle_id');
    const status = searchParams.get('status');

    let query = `
      SELECT m.*, v.registration_number, v.vehicle_name, u.name as created_by_name
      FROM maintenance m
      JOIN vehicle v ON v.id = m.vehicle_id
      JOIN user u ON u.id = m.created_by
    `;
    const conditions = [];
    const args = [];

    if (vehicleId) {
      conditions.push('m.vehicle_id = ?');
      args.push(vehicleId);
    }
    if (status) {
      conditions.push('m.status = ?');
      args.push(status.toUpperCase());
    }

    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY m.id DESC';

    const records = await queryDb(query, args);
    return Response.json({ success: true, data: records });
  } catch (err) {
    console.error('[GET /api/maintenance]', err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      vehicle_id,
      maintenance_type,
      description,
      priority = 'MEDIUM',
      cost = 0,
      scheduled_date,
      created_by,
    } = body;

    if (!vehicle_id || !maintenance_type || !created_by) {
      return Response.json(
        { success: false, error: 'Missing required fields: vehicle_id, maintenance_type, created_by' },
        { status: 400 }
      );
    }

    const vehicle = (await queryDb(`SELECT * FROM vehicle WHERE id = ?`, [vehicle_id]))?.[0];
    if (!vehicle) {
      return Response.json({ success: false, error: 'Vehicle not found' }, { status: 404 });
    }

    if (vehicle.status === 'RETIRED') {
      return Response.json(
        { success: false, error: 'Cannot schedule maintenance for a retired vehicle.' },
        { status: 409 }
      );
    }

    // Business Rule: Creating maintenance → vehicle becomes IN_SHOP
    await queryDb(`UPDATE vehicle SET status = 'IN_SHOP' WHERE id = ?`, [vehicle_id]);

    const result = await queryDb(`
      INSERT INTO maintenance (vehicle_id, maintenance_type, description, priority, cost, status, scheduled_date, created_by)
      VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?, ?)
    `, [vehicle_id, maintenance_type, description ?? null, priority, cost, scheduled_date ?? null, created_by]);

    // Notify all fleet managers
    await notifyFleetManagers(vehicle, maintenance_type, priority);

    const record = (await queryDb(`
      SELECT m.*, v.registration_number, v.vehicle_name FROM maintenance m
      JOIN vehicle v ON v.id = m.vehicle_id ORDER BY m.id DESC LIMIT 1
    `))?.[0];

    return Response.json({ success: true, data: record }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/maintenance]', err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

async function notifyFleetManagers(vehicle, maintenanceType, priority) {
  try {
    const fleetManagers = await queryDb(`
      SELECT u.id FROM user u JOIN role r ON r.id = u.role_id WHERE r.name = 'Fleet Manager'
    `, []);

    for (const mgr of fleetManagers) {
      await queryDb(`
        INSERT INTO notification (user_id, title, message, type) VALUES (?, ?, ?, ?)
      `, [
        mgr.id,
        'Maintenance Scheduled',
        `Vehicle ${vehicle.registration_number} (${vehicle.vehicle_name}) has been sent to shop for: ${maintenanceType}. Priority: ${priority}.`,
        priority === 'CRITICAL' ? 'CRITICAL' : 'WARNING'
      ]);
    }
  } catch (e) {
    console.error('[Notification] Fleet manager notify failed:', e);
  }
}
