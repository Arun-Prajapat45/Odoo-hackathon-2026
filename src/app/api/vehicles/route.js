import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';

    let sql = `
      SELECT 
        v.id,
        v.registration_number AS registrationNumber,
        v.vehicle_name AS vehicleName,
        v.category_id AS categoryId,
        v.manufacturer,
        v.model,
        v.year,
        v.capacity,
        v.odometer,
        v.fuel_type AS fuelType,
        v.purchase_cost AS purchaseCost,
        v.status,
        v.current_location AS currentLocation,
        v.insurance_expiry AS insuranceExpiry,
        v.pollution_expiry AS pollutionExpiry,
        v.created_at AS createdAt,
        c.name AS category_name
      FROM vehicle v
      LEFT JOIN vehicle_category c ON v.category_id = c.id
    `;
    
    const conditions = [];
    const args = [];

    if (status) {
      conditions.push("v.status = ?");
      args.push(status);
    }

    if (type) {
      conditions.push("v.category_id = ?");
      args.push(parseInt(type, 10));
    }

    if (search) {
      conditions.push(`(
        v.registration_number LIKE ? OR 
        v.vehicle_name LIKE ? OR 
        v.manufacturer LIKE ? OR 
        v.model LIKE ? OR 
        c.name LIKE ?
      )`);
      const searchPattern = `%${search}%`;
      args.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    sql += " ORDER BY v.created_at DESC";

    const vehicles = await db.query(sql, args);

    // Map each vehicle to include category: { name } and documents: []
    // Also include active trips count for deletion validation
    const populated = await Promise.all(vehicles.map(async (v) => {
      const documents = await db.query(
        "SELECT id, document_type AS documentType, document_url AS documentUrl, expiry_date AS expiryDate, verified FROM vehicle_document WHERE vehicle_id = ?",
        [v.id]
      );
      
      const activeTrips = await db.query(
        "SELECT COUNT(*) AS count FROM trip WHERE vehicle_id = ? AND status IN ('DRAFT', 'DISPATCHED')",
        [v.id]
      );
      
      return {
        ...v,
        category: { id: v.categoryId, name: v.category_name },
        documents,
        _count: {
          trips: activeTrips[0]?.count || 0
        }
      };
    }));

    return NextResponse.json(populated);
  } catch (error) {
    console.error('GET /api/vehicles error:', error);
    return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      registrationNumber,
      vehicleName,
      categoryId,
      manufacturer,
      model,
      year,
      capacity,
      odometer,
      fuelType,
      purchaseCost,
      status,
      currentLocation,
      insuranceExpiry,
      pollutionExpiry
    } = body;

    // Validate required fields
    if (!registrationNumber || !vehicleName || !categoryId || !capacity || !fuelType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check unique registration number
    const existing = await db.query("SELECT id FROM vehicle WHERE registration_number = ?", [registrationNumber]);
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Registration number already exists' }, { status: 400 });
    }

    // Insert new vehicle
    await db.query(`
      INSERT INTO vehicle (
        registration_number, vehicle_name, category_id, manufacturer, model, year, 
        capacity, odometer, fuel_type, purchase_cost, status, current_location, 
        insurance_expiry, pollution_expiry
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      registrationNumber,
      vehicleName,
      parseInt(categoryId, 10),
      manufacturer || null,
      model || null,
      year ? parseInt(year, 10) : null,
      parseFloat(capacity),
      odometer ? parseFloat(odometer) : 0,
      fuelType,
      purchaseCost ? parseFloat(purchaseCost) : 0,
      status || 'AVAILABLE',
      currentLocation || null,
      insuranceExpiry || null,
      pollutionExpiry || null
    ]);

    // Query back the newly inserted vehicle by unique registration_number
    const newVehicleList = await db.query(`
      SELECT 
        v.id,
        v.registration_number AS registrationNumber,
        v.vehicle_name AS vehicleName,
        v.category_id AS categoryId,
        v.manufacturer,
        v.model,
        v.year,
        v.capacity,
        v.odometer,
        v.fuel_type AS fuelType,
        v.purchase_cost AS purchaseCost,
        v.status,
        v.current_location AS currentLocation,
        v.insurance_expiry AS insuranceExpiry,
        v.pollution_expiry AS pollutionExpiry,
        c.name AS category_name
      FROM vehicle v
      LEFT JOIN vehicle_category c ON v.category_id = c.id
      WHERE v.registration_number = ?
    `, [registrationNumber]);

    const v = newVehicleList[0];
    const responseData = {
      ...v,
      category: { id: v.categoryId, name: v.category_name },
      documents: []
    };

    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error('POST /api/vehicles error:', error);
    return NextResponse.json({ error: 'Failed to create vehicle' }, { status: 500 });
  }
}
