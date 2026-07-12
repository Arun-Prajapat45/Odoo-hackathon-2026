import { queryDb } from '@/lib/db';

// GET /api/drivers - list all drivers
// POST /api/drivers - create a new driver (+ user)
export async function GET() {
  try {
    const drivers = await queryDb(`
      SELECT
        d.id,
        d.employee_code,
        d.license_number,
        d.license_type,
        d.license_expiry,
        d.phone,
        d.joining_date,
        d.status,
        d.safety_score,
        u.name,
        u.email
      FROM driver d
      JOIN user u ON u.id = d.user_id
      ORDER BY d.id DESC
    `, []);

    return Response.json({ success: true, data: drivers });
  } catch (err) {
    console.error('[GET /api/drivers]', err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      name, email, password_hash = 'changeme',
      employee_code, license_number, license_type,
      license_expiry, phone, joining_date,
    } = body;

    if (!name || !email || !employee_code || !license_number || !license_type || !license_expiry) {
      return Response.json(
        { success: false, error: 'Missing required fields: name, email, employee_code, license_number, license_type, license_expiry' },
        { status: 400 }
      );
    }

    // Get Driver role_id
    const driverRole = (await queryDb(`SELECT id FROM role WHERE name = 'Driver'`, []))?.[0];
    if (!driverRole) {
      return Response.json({ success: false, error: 'Driver role not found in DB' }, { status: 500 });
    }

    // Insert user first
    const userResult = await queryDb(`
      INSERT INTO user (name, email, password_hash, role_id, status)
      VALUES (?, ?, ?, ?, 'ACTIVE')
    `, [name, email, password_hash, driverRole.id]);

    const userId = (await queryDb(`SELECT id FROM user ORDER BY id DESC LIMIT 1`))?.[0]?.id;

    // Insert driver
    await queryDb(`
      INSERT INTO driver (user_id, employee_code, license_number, license_type, license_expiry, phone, joining_date, status, safety_score)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'AVAILABLE', 100.00)
    `, [userId, employee_code, license_number, license_type, license_expiry, phone ?? null, joining_date ?? null]);

    const driver = (await queryDb(`
      SELECT d.*, u.name, u.email FROM driver d JOIN user u ON u.id = d.user_id ORDER BY d.id DESC LIMIT 1
    `))?.[0];

    // Check license expiry — create notification if expiring within 30 days
    await checkLicenseExpiryNotification(driver);

    return Response.json({ success: true, data: driver }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/drivers]', err);
    const status = err.message.includes('UNIQUE constraint') ? 409 : 500;
    return Response.json({ success: false, error: err.message }, { status });
  }
}

async function checkLicenseExpiryNotification(driver) {
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
        `Driver ${driver.name}'s license (${driver.license_number}) expires in ${daysLeft} day(s) on ${driver.license_expiry}.`,
        daysLeft <= 7 ? 'CRITICAL' : 'WARNING'
      ]);
    }
  } catch (e) {
    console.error('[Notification] License expiry check failed:', e);
  }
}
