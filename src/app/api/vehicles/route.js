import { queryDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';

    let sql = `
      SELECT v.*, c.name as category_name
      FROM vehicle v
      LEFT JOIN vehicle_category c ON v.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ` AND v.status = ?`;
      params.push(status);
    }

    if (type) {
      sql += ` AND v.category_id = ?`;
      params.push(parseInt(type, 10));
    }

    if (search) {
      const like = `%${search}%`;
      sql += ` AND (
        v.registration_number LIKE ? OR 
        v.vehicle_name LIKE ? OR 
        v.manufacturer LIKE ? OR 
        v.model LIKE ? OR 
        c.name LIKE ?
      )`;
      params.push(like, like, like, like, like);
    }

    sql += ` ORDER BY v.created_at DESC`;

    const rows = await queryDb(sql, params) || [];

    const mappedVehicles = rows.map(v => ({
      ...v,
      id: v.id,
      vehicleName: v.vehicle_name || v.vehicleName,
      registrationNumber: v.registration_number || v.registrationNumber,
      categoryId: v.category_id || v.categoryId,
      manufacturer: v.manufacturer,
      model: v.model,
      year: v.year,
      capacity: v.capacity,
      odometer: v.odometer,
      fuelType: v.fuel_type || v.fuelType,
      purchaseCost: v.purchase_cost || v.purchaseCost,
      status: v.status,
      currentLocation: v.current_location || v.currentLocation,
      insuranceExpiry: v.insurance_expiry || v.insuranceExpiry,
      pollutionExpiry: v.pollution_expiry || v.pollutionExpiry,
      category: v.category_name ? {
        id: v.category_id || v.categoryId,
        name: v.category_name
      } : null
    }));

    return NextResponse.json(mappedVehicles);
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

    if (!registrationNumber || !vehicleName || !categoryId || !capacity || !fuelType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existing = await queryDb('SELECT id FROM vehicle WHERE registration_number = ?', [registrationNumber]);
    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'Registration number already exists' }, { status: 400 });
    }

    await queryDb(`
      INSERT INTO vehicle (
        registration_number, vehicle_name, category_id, manufacturer, model,
        year, capacity, odometer, fuel_type, purchase_cost, status,
        current_location, insurance_expiry, pollution_expiry
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      registrationNumber, vehicleName, parseInt(categoryId, 10), manufacturer || null, model || null,
      year ? parseInt(year, 10) : null, parseFloat(capacity), odometer ? parseFloat(odometer) : 0,
      fuelType, purchaseCost ? parseFloat(purchaseCost) : 0, status || 'AVAILABLE',
      currentLocation || null, insuranceExpiry || null, pollutionExpiry || null
    ]);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('POST /api/vehicles error:', error);
    return NextResponse.json({ error: 'Failed to create vehicle' }, { status: 500 });
  }
}
