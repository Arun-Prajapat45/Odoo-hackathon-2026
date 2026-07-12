import { getDb } from '@/lib/db';

// GET  /api/drivers/[id]/status — get current status
// POST /api/drivers/[id]/status — update status (with validation)

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const db = getDb();
    const driver = db.prepare(`SELECT id, status, safety_score FROM driver WHERE id = ?`).get(id);
    if (!driver) return Response.json({ success: false, error: 'Driver not found' }, { status: 404 });
    return Response.json({ success: true, data: driver });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const { status } = await request.json();
    const db = getDb();

    const VALID_STATUSES = ['AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'SUSPENDED'];
    if (!VALID_STATUSES.includes(status)) {
      return Response.json(
        { success: false, error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const driver = db.prepare(`SELECT * FROM driver WHERE id = ?`).get(id);
    if (!driver) return Response.json({ success: false, error: 'Driver not found' }, { status: 404 });

    // Business rule: suspended drivers cannot be set to ON_TRIP
    if (driver.status === 'SUSPENDED' && status === 'ON_TRIP') {
      return Response.json(
        { success: false, error: 'Cannot assign a trip to a suspended driver.' },
        { status: 409 }
      );
    }

    db.prepare(`UPDATE driver SET status = ? WHERE id = ?`).run(status, id);

    return Response.json({ success: true, data: { id: driver.id, status } });
  } catch (err) {
    console.error('[POST /api/drivers/[id]/status]', err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
